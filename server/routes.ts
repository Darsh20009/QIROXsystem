import type { Express } from "express";
import type { Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { type User } from "@shared/schema";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import crypto from "crypto";
import { sendWelcomeEmail, sendOtpEmail, sendEmailVerificationEmail, sendOrderConfirmationEmail, sendOrderStatusEmail, sendMessageNotificationEmail, sendProjectUpdateEmail, sendTaskAssignedEmail, sendTaskCompletedEmail, sendDirectEmail, sendTestEmail, sendAdminNewClientEmail, sendAdminNewOrderEmail, sendWelcomeWithCredentialsEmail } from "./email";
import { pushNotification, broadcastNotification } from "./ws";
import { sendPushToUser, VAPID_PUBLIC } from "./push";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function sanitizeUser(user: any): any {
  if (!user) return user;
  if (Array.isArray(user)) return user.map(sanitizeUser);
  const obj = typeof user.toJSON === "function" ? user.toJSON() : { ...user };
  delete obj.password;
  return obj;
}

function translateError(err: any): string {
  const msg: string = err?.message || err?.toString() || "";
  if (msg.includes("E11000") || msg.includes("duplicate key")) {
    if (msg.includes("email")) return "البريد الإلكتروني مستخدم من قبل، جرّب بريداً آخر";
    if (msg.includes("username")) return "اسم المستخدم مستخدم من قبل، جرّب اسماً آخر";
    return "هذه البيانات مستخدمة مسبقاً";
  }
  if (msg.includes("validation failed") || msg.includes("is required")) return "تأكد من تعبئة جميع الحقول المطلوبة";
  if (msg.includes("Cast to ObjectId") || msg.includes("ObjectId")) return "معرّف غير صالح";
  if (msg.includes("LIMIT_FILE_SIZE")) return "حجم الملف كبير جداً (الحد الأقصى 20 ميغابايت)";
  if (msg.includes("No file") || msg.includes("No files")) return "لم يتم اختيار أي ملف";
  if (msg.includes("ENOENT") || msg.includes("EACCES")) return "حدث خطأ في نظام الملفات";
  if (msg.includes("connect") || msg.includes("network") || msg.includes("ECONNREFUSED")) return "تعذّر الاتصال بقاعدة البيانات، حاول مجدداً";
  return "حدث خطأ غير متوقع، حاول مجدداً";
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = crypto.randomBytes(16).toString("hex");
      cb(null, `${name}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|mp4|mov|avi|mp3|wav)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مسموح به"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const { hashPassword } = setupAuth(app);

  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), service: "QIROX Studio" });
  });

  app.post("/api/upload", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "حجم الملف كبير جداً (الحد الأقصى 20 ميغابايت)" });
        return res.status(400).json({ error: translateError(err) });
      }
      if (err) return res.status(400).json({ error: translateError(err) });
      if (!req.file) return res.status(400).json({ error: "لم يتم اختيار أي ملف" });
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.originalname, size: req.file.size });
    });
  });

  app.post("/api/upload/multiple", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    upload.array("files", 10)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "حجم الملف كبير جداً (الحد الأقصى 20 ميغابايت)" });
        return res.status(400).json({ error: translateError(err) });
      }
      if (err) return res.status(400).json({ error: translateError(err) });
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ error: "لم يتم اختيار أي ملف" });
      const results = files.map(f => ({
        url: `/uploads/${f.filename}`,
        filename: f.originalname,
        size: f.size,
      }));
      res.json(results);
    });
  });

  // === AUTH API ===
  app.post(api.auth.register.path, async (req, res, next) => {
    try {
      const { UserModel, OtpModel } = await import("./models");
      const incomingEmail = req.body.email ? String(req.body.email).toLowerCase().trim() : null;

      // Check if username already exists
      const existingByUsername = await storage.getUserByUsername(req.body.username);
      if (existingByUsername) {
        const eu = existingByUsername as any;
        if (!eu.emailVerified) {
          // Account exists but not verified — re-login and resend OTP
          return req.login(eu, async (err) => {
            if (err) return next(err);
            if (eu.email) {
              const code = Math.floor(100000 + Math.random() * 900000).toString();
              const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
              await OtpModel.updateMany({ email: eu.email.toLowerCase().trim(), used: false, type: "email_verify" }, { used: true });
              await OtpModel.create({ email: eu.email.toLowerCase().trim(), code, expiresAt, type: "email_verify" });
              sendEmailVerificationEmail(eu.email, eu.fullName || eu.username, code).catch(console.error);
              console.log(`[EMAIL-VERIFY] Resend for existing unverified ${eu.email}: ${code}`);
            }
            return res.status(200).json({ ...sanitizeUser(eu), needsVerification: true, resent: true });
          });
        }
        return res.status(400).json({ error: "اسم المستخدم مستخدم من قبل" });
      }

      // Check if email already exists
      if (incomingEmail) {
        const existingByEmail = await UserModel.findOne({ email: incomingEmail });
        if (existingByEmail) {
          const ee = existingByEmail as any;
          if (!ee.emailVerified) {
            // Email exists but not verified — re-login and resend OTP
            return req.login(ee, async (err) => {
              if (err) return next(err);
              const code = Math.floor(100000 + Math.random() * 900000).toString();
              const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
              await OtpModel.updateMany({ email: incomingEmail, used: false, type: "email_verify" }, { used: true });
              await OtpModel.create({ email: incomingEmail, code, expiresAt, type: "email_verify" });
              sendEmailVerificationEmail(incomingEmail, ee.fullName || ee.username, code).catch(console.error);
              console.log(`[EMAIL-VERIFY] Resend for existing unverified email ${incomingEmail}: ${code}`);
              return res.status(200).json({ ...sanitizeUser(ee), needsVerification: true, resent: true });
            });
          }
          return res.status(400).json({ error: "البريد الإلكتروني مستخدم من قبل" });
        }
      }

      // New account — create it
      const role = req.body.role || "client";
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        role,
        password: hashedPassword,
        email: incomingEmail || req.body.email,
      });

      req.login(user, async (err) => {
        if (err) return next(err);
        if (user.email) {
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
          await OtpModel.updateMany({ email: String(user.email).toLowerCase().trim(), used: false, type: "email_verify" }, { used: true });
          await OtpModel.create({ email: String(user.email).toLowerCase().trim(), code, expiresAt, type: "email_verify" });
          sendEmailVerificationEmail(user.email, user.fullName || user.username, code).catch(console.error);
          console.log(`[EMAIL-VERIFY] Code for ${user.email}: ${code}`);
          const adminEmail = "info@qiroxstudio.online";
          sendAdminNewClientEmail(adminEmail, user.fullName || user.username, user.email, (user as any).phone || "", "التسجيل الذاتي").catch(console.error);
        }
        res.status(201).json({ ...sanitizeUser(user), emailVerified: false, needsVerification: true });
      });
    } catch (err) {
      next(err);
    }
  });

  // Admin users list (Only for admin)
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    const users = await storage.getUsers();
    res.json(sanitizeUser(users));
  });

  const allowedRoles = ["manager", "accountant", "sales_manager", "sales", "developer", "designer", "support", "client"];
  const userFieldsWhitelist = ["username", "password", "email", "fullName", "role", "phone"];

  app.post("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    try {
      const { username, password, email, fullName, role, phone } = req.body;
      if (!username || !password || !email || !fullName || !role) {
        return res.status(400).json({ error: "جميع الحقول المطلوبة يجب تعبئتها" });
      }
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: "الصلاحية المختارة غير صالحة" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "اسم المستخدم مستخدم من قبل" });
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username: String(username).trim(),
        password: hashedPassword,
        email: String(email).trim(),
        fullName: String(fullName).trim(),
        role,
        phone: phone ? String(phone).trim() : undefined,
      });
      res.status(201).json(sanitizeUser(user));
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    try {
      const sanitized: Record<string, any> = {};
      for (const key of userFieldsWhitelist) {
        if (req.body[key] !== undefined && req.body[key] !== "") {
          sanitized[key] = typeof req.body[key] === "string" ? req.body[key].trim() : req.body[key];
        }
      }
      if (sanitized.role && !allowedRoles.includes(sanitized.role)) {
        return res.status(400).json({ error: "الصلاحية المختارة غير صالحة" });
      }
      if (sanitized.password) {
        if (sanitized.password.length < 6) {
          return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
        }
        sanitized.password = await hashPassword(sanitized.password);
      }
      const user = await storage.updateUser(req.params.id, sanitized);
      if (!user) return res.sendStatus(404);
      res.json(sanitizeUser(user));
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    try {
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) return res.sendStatus(404);
      if (targetUser.role === "admin") {
        return res.status(400).json({ error: "لا يمكن حذف حساب المدير" });
      }
      await storage.deleteUser(req.params.id);
      res.sendStatus(204);
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  // Admin reset password for any user → auto-generate + send email + return to admin
  app.post("/api/admin/users/:id/reset-password", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) return res.sendStatus(404);
      const rawPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase() + "@Q";
      const hashed = await hashPassword(rawPassword);
      await storage.updateUser(req.params.id, { password: hashed });
      sendWelcomeWithCredentialsEmail(targetUser.email, targetUser.fullName, targetUser.username, rawPassword).catch(e => console.error("[RESET] email failed:", e));
      res.json({ ok: true, username: targetUser.username, rawPassword, email: targetUser.email });
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  // Internal Gate Verification
  app.post("/api/internal-gate/verify", (req, res) => {
    const { password } = req.body;
    if (password === "qirox2026") {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "كلمة مرور خاطئة" });
    }
  });

  app.post(api.auth.login.path, (req, res, next) => {
    const passportLogin = (req: any, res: any, next: any) => {
       import("passport").then((passport) => {
         passport.default.authenticate("local", (err: any, user: any, info: any) => {
          if (err) return next(err);
          if (!user) return res.status(401).send("اسم المستخدم أو كلمة المرور غير صحيحة");
          req.login(user, (err: any) => {
            if (err) return next(err);
            res.status(200).json(sanitizeUser(user));
          });
        })(req, res, next);
       });
    }
    passportLogin(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get(api.auth.user.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(sanitizeUser(req.user));
  });

  // Attendance API
  app.post("/api/attendance/check-in", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { ipAddress, location } = req.body;
    
    const attendance = await storage.createAttendance({
      userId: String(user.id),
      checkIn: new Date(),
      ipAddress,
      location
    });
    res.json(attendance);
  });

  app.post("/api/attendance/check-out", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const latest = await storage.getLatestAttendance(String(user.id));
    
    if (!latest || latest.checkOut) {
      return res.status(400).send("لا توجد جلسة نشطة");
    }

    const checkOut = new Date();
    const workHours = (checkOut.getTime() - latest.checkIn.getTime()) / (1000 * 60 * 60);
    
    const attendance = await storage.updateAttendance(String(latest.id), {
      checkOut,
      workHours: Number(workHours.toFixed(2))
    });
    res.json(attendance);
  });

  app.get("/api/attendance/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const latest = await storage.getLatestAttendance(String(user.id));
    res.json(latest || null);
  });

  app.get("/api/admin/attendance", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as User).role !== 'admin') {
      return res.sendStatus(403);
    }
    const users = await storage.getUsers();
    const allAttendance = await Promise.all(users.map(async (u) => {
      const attendance = await storage.getAttendance(String(u.id));
      return { user: u, attendance };
    }));
    res.json(allAttendance);
  });

  // === SERVICES API ===
  app.get(api.services.list.path, async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  app.get(api.services.get.path, async (req, res) => {
    const service = await storage.getService(req.params.id);
    if (!service) return res.sendStatus(404);
    res.json(service);
  });

  // === ADMIN SERVICES API ===
  app.post("/api/admin/services", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    const service = await storage.createService(req.body);
    res.status(201).json(service);
  });

  app.patch("/api/admin/services/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    const service = await storage.updateService(req.params.id, req.body);
    res.json(service);
  });

  app.delete("/api/admin/services/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    await storage.deleteService(req.params.id);
    res.sendStatus(204);
  });

  // === CONTACT FORM ===
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !message) return res.status(400).json({ error: "يرجى تعبئة جميع الحقول المطلوبة" });
      await sendDirectEmail("support@qiroxstudio.online", "QIROX", subject || "رسالة جديدة من نموذج التواصل", `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#111;border-bottom:2px solid #eee;padding-bottom:12px;">رسالة جديدة من نموذج التواصل</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">الاسم:</td><td style="padding:8px 0;color:#111;">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">البريد:</td><td style="padding:8px 0;color:#111;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">الموضوع:</td><td style="padding:8px 0;color:#111;">${subject || '—'}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;">
            <p style="color:#111;line-height:1.7;white-space:pre-wrap;">${message}</p>
          </div>
          <p style="color:#999;font-size:12px;margin-top:24px;">تم الإرسال من موقع QIROX Studio</p>
        </div>
      `);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: "فشل إرسال الرسالة، يرجى المحاولة مرة أخرى" }); }
  });

  // === ADMIN ORDERS API ===
  app.get("/api/admin/orders", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") {
      return res.sendStatus(403);
    }
    const orders = await storage.getOrdersWithUsers();
    res.json(orders);
  });

  app.get("/api/admin/orders/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") {
      return res.sendStatus(403);
    }
    const order = await storage.getOrderWithUser(req.params.id);
    if (!order) return res.sendStatus(404);
    res.json(order);
  });

  app.patch("/api/admin/orders/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") {
      return res.sendStatus(403);
    }
    const order = await storage.updateOrder(req.params.id, req.body);
    // Send email + notification when status changes
    if (req.body.status && order) {
      try {
        const { NotificationModel, UserModel } = await import("./models");
        const clientUser = await UserModel.findById((order as any).userId).select("email fullName username");
        if (clientUser?.email) {
          sendOrderStatusEmail(clientUser.email, clientUser.fullName || clientUser.username, String(order.id), req.body.status).catch(console.error);
        }
        const statusLabels: Record<string, string> = { pending: 'قيد المراجعة', approved: 'تمت الموافقة', in_progress: 'قيد التنفيذ', review: 'مراجعة العميل', completed: 'مكتمل', rejected: 'مرفوض' };
        const notifTitle = `تحديث طلبك: ${statusLabels[req.body.status] || req.body.status}`;
        await NotificationModel.create({ userId: (order as any).userId, type: 'status', title: notifTitle, body: `تم تحديث حالة طلبك`, link: '/dashboard', icon: '📋' });
        pushNotification(String((order as any).userId), { title: notifTitle, body: 'تم تحديث حالة طلبك', icon: '📋', link: '/dashboard' });
        const { ActivityLogModel } = await import("./models");
        ActivityLogModel.create({ userId: (req.user as any)?.id, action: 'update_order_status', entity: 'order', entityId: String(order.id), details: { status: req.body.status }, ip: req.ip }).catch(() => {});
      } catch (e) { console.error("[OrderStatus]", e); }
    }
    res.json(order);
  });

  // === EMPLOYEE LIST (for assignment dropdowns) ===
  app.get("/api/employees", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const allUsers = await storage.getUsers();
    const employees = allUsers.filter((u: any) => u.role !== "client");
    res.json(employees.map((u: any) => ({ id: u.id, fullName: u.fullName, username: u.username, role: u.role })));
  });

  // === ORDERS API ===
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    if (user.role === "client") {
      const orders = await storage.getOrders(String(user.id));
      return res.json(orders);
    }
    const orders = await storage.getOrdersWithUsers();
    res.json(orders);
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    if (!(user as any).emailVerified) {
      return res.status(403).json({ error: "account_not_verified", message: "يجب تفعيل حسابك أولاً قبل تقديم أي طلب" });
    }
    const order = await storage.createOrder({ ...req.body, userId: String(user.id) });
    const items: string[] = (req.body.items || []).map((i: any) => i.nameAr || i.name || "عنصر").filter(Boolean);
    if ((user as any).email) {
      // Confirm to client
      sendOrderConfirmationEmail((user as any).email, (user as any).fullName || (user as any).username, String(order.id), items).catch(console.error);
      // Create in-app notification
      const { NotificationModel } = await import("./models");
      await NotificationModel.create({ userId: user.id, type: 'order', title: 'تم استلام طلبك', body: `تم استلام طلبك بنجاح، سنتواصل معك قريباً.`, link: '/dashboard', icon: '📦' });
    }
    // Notify admin
    sendAdminNewOrderEmail(
      "info@qiroxstudio.online",
      (user as any).fullName || (user as any).username,
      (user as any).email || "",
      String(order.id),
      items,
      req.body.totalAmount
    ).catch(console.error);
    res.status(201).json(order);
  });

  // === PROJECTS API ===
  app.get(api.projects.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const projects = await storage.getProjects(String(user.id), user.role);
    res.json(projects);
  });

  app.post("/api/admin/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const role = (req.user as any).role;
    if (role === "client") return res.sendStatus(403);
    try {
      const { ProjectModel } = await import("./models");
      const project = await ProjectModel.create(req.body);
      res.status(201).json(project);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.get(api.projects.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const project = await storage.getProject(req.params.id);
    if (!project) return res.sendStatus(404);
    res.json(project);
  });

  app.patch(api.projects.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.projects.update.input.parse(req.body);
    const oldProject = await storage.getProject(req.params.id);
    const project = await storage.updateProject(req.params.id, input);
    res.json(project);
    // Send email to client if status or progress changed
    try {
      const statusChanged = input.status && oldProject?.status !== input.status;
      const progressChanged = input.progress !== undefined && oldProject?.progress !== input.progress;
      if ((statusChanged || progressChanged) && (project as any).clientId) {
        const { UserModel, NotificationModel } = await import("./models");
        const clientUser = await UserModel.findById((project as any).clientId).select("email fullName username");
        if (clientUser?.email) {
          sendProjectUpdateEmail(
            clientUser.email,
            clientUser.fullName || clientUser.username,
            (project as any).name || "مشروعك",
            (project as any).status || "in_progress",
            (project as any).progress || 0,
            input.status && statusChanged ? `تم تغيير حالة المشروع إلى: ${input.status}` : undefined
          ).catch(console.error);
        }
        const notifMsg = statusChanged ? `تم تغيير حالة المشروع` : `تحديث تقدم المشروع: ${(project as any).progress || 0}%`;
        await NotificationModel.create({ userId: (project as any).clientId, type: 'project', title: notifMsg, body: (project as any).name || "مشروعك", link: `/projects/${req.params.id}`, icon: '🚀' }).catch(() => {});
        pushNotification(String((project as any).clientId), { title: notifMsg, body: (project as any).name || "مشروعك", icon: '🚀', link: `/projects/${req.params.id}` });
      }
    } catch (e) { console.error("[Email] project update email error:", e); }
  });

  // === TASKS API ===
  app.get(api.tasks.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tasks = await storage.getTasks(req.params.projectId);
    res.json(tasks);
  });

  app.post(api.tasks.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.tasks.create.input.parse(req.body);
    const task = await storage.createTask({ ...input, projectId: req.params.projectId });
    res.status(201).json(task);
    // Email assignee when task is created with assignment
    try {
      if ((task as any).assignedTo) {
        const { UserModel, ProjectModel } = await import("./models");
        const assignee = await UserModel.findById((task as any).assignedTo).select("email fullName username");
        const project = await ProjectModel?.findById(req.params.projectId).select("name");
        if (assignee?.email) {
          sendTaskAssignedEmail(
            assignee.email,
            assignee.fullName || assignee.username,
            (task as any).title || "مهمة جديدة",
            project?.name || "المشروع",
            (task as any).priority || "medium",
            (task as any).deadline
          ).catch(console.error);
        }
      }
    } catch (e) { console.error("[Email] task assigned email error:", e); }
  });

  app.patch(api.tasks.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.tasks.update.input.parse(req.body);
    const { TaskModel } = await import("./models");
    const oldTask = await TaskModel?.findById(req.params.id).lean().catch(() => null);
    const task = await storage.updateTask(req.params.id, input);
    res.json(task);
    // Email assignee if task is newly assigned
    // Email project client if task is completed
    try {
      const { UserModel, ProjectModel } = await import("./models");
      const { NotificationModel } = await import("./models");
      if (input.assignedTo && (!oldTask || (oldTask as any).assignedTo?.toString() !== input.assignedTo)) {
        const assignee = await UserModel.findById(input.assignedTo).select("email fullName username");
        const project = await ProjectModel?.findById((task as any).projectId).select("name");
        if (assignee?.email) {
          sendTaskAssignedEmail(
            assignee.email,
            assignee.fullName || assignee.username,
            (task as any).title || "مهمة",
            project?.name || "المشروع",
            (task as any).priority || "medium",
            (task as any).deadline
          ).catch(console.error);
        }
        const taskTitle = (task as any).title || "مهمة جديدة";
        await NotificationModel.create({ userId: input.assignedTo, type: 'task', title: `مهمة جديدة: ${taskTitle}`, body: `في مشروع: ${project?.name || 'المشروع'}`, link: `/projects/${(task as any).projectId}`, icon: '✅' }).catch(() => {});
        pushNotification(String(input.assignedTo), { title: `مهمة جديدة: ${taskTitle}`, body: `في مشروع: ${project?.name || 'المشروع'}`, icon: '✅', link: `/projects/${(task as any).projectId}` });
        sendPushToUser(String(input.assignedTo), { title: `✅ مهمة جديدة: ${taskTitle}`, body: `في مشروع: ${project?.name || 'المشروع'}`, data: { url: `/projects/${(task as any).projectId}` } }).catch(() => {});
      }
      if (input.status === "done" && (!oldTask || (oldTask as any).status !== "done")) {
        const project = await ProjectModel?.findById((task as any).projectId).select("name clientId");
        if (project?.clientId) {
          const clientUser = await UserModel.findById(project.clientId).select("email fullName username");
          const completedBy = (req.user as any)?.fullName || (req.user as any)?.username || "الفريق";
          if (clientUser?.email) {
            sendTaskCompletedEmail(
              clientUser.email,
              clientUser.fullName || clientUser.username,
              (task as any).title || "مهمة",
              project.name || "المشروع",
              completedBy
            ).catch(console.error);
          }
          const doneTitle = `اكتملت مهمة: ${(task as any).title || 'مهمة'}`;
          await NotificationModel.create({ userId: project.clientId, type: 'task', title: doneTitle, body: `في مشروع: ${project.name || 'المشروع'}`, link: `/projects/${(task as any).projectId}`, icon: '🎉' }).catch(() => {});
          pushNotification(String(project.clientId), { title: doneTitle, body: `في مشروع: ${project.name || 'المشروع'}`, icon: '🎉', link: `/projects/${(task as any).projectId}` });
        }
      }
    } catch (e) { console.error("[Email] task update email error:", e); }
  });

  app.delete("/api/projects/:projectId/tasks/:taskId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { TaskModel } = await import("./models");
      const task = await TaskModel.findById(req.params.taskId);
      if (!task) return res.sendStatus(404);
      if (String(task.projectId) !== req.params.projectId) return res.sendStatus(403);
      await TaskModel.findByIdAndDelete(req.params.taskId);
      res.sendStatus(204);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // === PROJECT MEMBERS API ===
  app.get("/api/projects/:projectId/members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const members = await storage.getProjectMembers(req.params.projectId);
    res.json(members);
  });

  app.post("/api/projects/:projectId/members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const member = await storage.addProjectMember({
      ...req.body,
      projectId: req.params.projectId
    });
    res.status(201).json(member);
  });

  app.delete("/api/projects/:projectId/members/:memberId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ProjectMemberModel } = await import("./models");
      await ProjectMemberModel.findByIdAndDelete(req.params.memberId);
      res.sendStatus(204);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // === MESSAGES API ===
  app.get(api.messages.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const messages = await storage.getMessages(req.params.projectId);
    res.json(messages);
  });

  app.post(api.messages.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.messages.create.input.parse(req.body);
    const message = await storage.createMessage({ 
      ...input, 
      projectId: req.params.projectId, 
      senderId: String((req.user as User).id) 
    });
    res.status(201).json(message);
  });

  // === PROJECT VAULT API ===
  app.get("/api/projects/:projectId/vault", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const items = await storage.getVaultItems(req.params.projectId);
    res.json(items);
  });

  app.post("/api/projects/:projectId/vault", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const item = await storage.createVaultItem({
      ...req.body,
      projectId: req.params.projectId
    });
    res.status(201).json(item);
  });

  app.delete("/api/projects/:projectId/vault/:vaultId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ProjectVaultModel } = await import("./models");
      await ProjectVaultModel.findByIdAndDelete(req.params.vaultId);
      res.sendStatus(204);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // === CHAT API ===
  app.get("/api/projects/:projectId/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const messages = await storage.getMessages(req.params.projectId);
    res.json(messages);
  });

  app.post("/api/projects/:projectId/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const message = await storage.createMessage({
      projectId: req.params.projectId,
      senderId: String(user.id),
      content: req.body.content,
      isInternal: req.body.isInternal || false,
    });
    res.status(201).json(message);
  });

  // === SECTOR TEMPLATES API ===
  app.get("/api/templates", async (req, res) => {
    const templates = await storage.getSectorTemplates();
    res.json(templates);
  });

  app.get("/api/templates/:id", async (req, res) => {
    const template = await storage.getSectorTemplate(req.params.id);
    if (!template) return res.sendStatus(404);
    res.json(template);
  });

  app.post("/api/admin/templates", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    const template = await storage.createSectorTemplate(req.body);
    res.status(201).json(template);
  });

  app.patch("/api/admin/templates/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    const template = await storage.updateSectorTemplate(req.params.id, req.body);
    res.json(template);
  });

  app.delete("/api/admin/templates/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    await storage.deleteSectorTemplate(req.params.id);
    res.sendStatus(204);
  });

  // === PRICING PLANS API ===
  app.get("/api/pricing", async (req, res) => {
    const plans = await storage.getPricingPlans();
    res.json(plans);
  });

  app.post("/api/admin/pricing", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    const plan = await storage.createPricingPlan(req.body);
    res.status(201).json(plan);
  });

  app.patch("/api/admin/pricing/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    const plan = await storage.updatePricingPlan(req.params.id, req.body);
    res.json(plan);
  });

  app.delete("/api/admin/pricing/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    await storage.deletePricingPlan(req.params.id);
    res.sendStatus(204);
  });

  // === NEWS API ===
  app.get("/api/news", async (req, res) => {
    const news = await storage.getNews();
    res.json(news);
  });

  app.post("/api/admin/news", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const news = await storage.createNews({ ...req.body, authorId: (req.user as any).id });
      res.status(201).json(news);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/admin/news/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const news = await storage.updateNews(req.params.id, req.body);
      res.json(news);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.delete("/api/admin/news/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      await storage.deleteNews(req.params.id);
      res.sendStatus(204);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // === JOBS API ===
  app.get("/api/jobs", async (req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.post("/api/admin/jobs", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const job = await storage.createJob(req.body);
      res.status(201).json(job);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/admin/jobs/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const job = await storage.updateJob(req.params.id, req.body);
      res.json(job);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.delete("/api/admin/jobs/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      await storage.deleteJob(req.params.id);
      res.sendStatus(204);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // Public job application
  app.post("/api/apply", async (req, res) => {
    try {
      const { jobId, fullName, email, phone, resumeUrl, coverLetter } = req.body;
      if (!jobId || !fullName || !email) return res.status(400).json({ error: "يرجى تعبئة الحقول المطلوبة" });
      const application = await storage.createApplication({ jobId, fullName, email, phone: phone || "", resumeUrl: resumeUrl || "" });
      sendDirectEmail("support@qiroxstudio.online", "QIROX HR", `طلب توظيف جديد — ${fullName}`, `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#111;">طلب توظيف جديد</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">الاسم:</td><td style="color:#111;">${fullName}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">البريد:</td><td style="color:#111;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">الهاتف:</td><td style="color:#111;">${phone || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">المعرف الوظيفي:</td><td style="color:#111;">${jobId}</td></tr>
            ${resumeUrl ? `<tr><td style="padding:8px 0;color:#666;font-weight:bold;">السيرة الذاتية:</td><td style="color:#111;"><a href="${resumeUrl}">${resumeUrl}</a></td></tr>` : ''}
          </table>
          ${coverLetter ? `<div style="margin-top:16px;padding:16px;background:#f9f9f9;border-radius:8px;"><p style="color:#111;line-height:1.7;">${coverLetter}</p></div>` : ''}
        </div>
      `).catch(console.error);
      res.status(201).json(application);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // === APPLICATIONS API ===
  app.get("/api/admin/applications", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const applications = await storage.getApplications();
    res.json(applications);
  });

  app.patch("/api/admin/applications/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const application = await storage.updateApplication(req.params.id, req.body);
      res.json(application);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // Hire applicant as employee → create account + send credentials
  app.post("/api/admin/applications/:id/hire", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const { role, username, email, fullName, phone } = req.body;
      if (!role || !username || !email || !fullName) {
        return res.status(400).json({ error: "جميع الحقول مطلوبة" });
      }
      const allowedEmployeeRoles = ["manager", "accountant", "sales_manager", "sales", "developer", "designer", "support", "merchant"];
      if (!allowedEmployeeRoles.includes(role)) {
        return res.status(400).json({ error: "دور غير مسموح به" });
      }
      const existingByUsername = await storage.getUserByUsername(username);
      if (existingByUsername) return res.status(400).json({ error: "اسم المستخدم مستخدم من قبل" });

      const rawPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase() + "!";
      const hashedPassword = await hashPassword(rawPassword);

      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName,
        role,
        phone: phone || "",
        emailVerified: true,
      });

      sendWelcomeWithCredentialsEmail(email, fullName, username, rawPassword).catch(e => console.error("[HIRE] email failed:", e));
      await storage.updateApplication(req.params.id, { status: "accepted" });

      console.log(`[HIRE] New employee created: ${username} / role:${role} / email:${email}`);
      res.json({ ok: true, userId: newUser.id, username, rawPassword, email });
    } catch (err: any) {
      console.error("[HIRE] error:", err);
      res.status(500).json({ error: translateError(err) });
    }
  });

  // === ADMIN CUSTOMERS API ===
  app.get("/api/admin/customers", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const users = await storage.getUsers();
    res.json(sanitizeUser(users.filter((u: any) => u.role === "client")));
  });

  // === MARKETING POSTS API ===
  app.get("/api/marketing/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { MarketingPostModel } = await import("./models");
      const posts = await MarketingPostModel.find().sort({ createdAt: -1 }).lean();
      res.json(posts.map((p: any) => ({ ...p, id: p._id?.toString() })));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/marketing/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const allowedRoles = ["admin", "manager", "sales_manager", "sales"];
    if (!allowedRoles.includes(user.role)) return res.sendStatus(403);
    try {
      const { MarketingPostModel } = await import("./models");
      const { title, description, imageUrl, platform } = req.body;
      if (!title || !imageUrl) return res.status(400).json({ error: "العنوان ورابط الصورة مطلوبان" });
      const post = await MarketingPostModel.create({
        title, description, imageUrl, platform: platform || "instagram",
        uploadedBy: user.username, status: "published",
      });
      res.json({ ...post.toObject(), id: post._id?.toString() });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/marketing/posts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const allowedRoles = ["admin", "manager", "sales_manager", "sales"];
    if (!allowedRoles.includes(user.role)) return res.sendStatus(403);
    try {
      const { MarketingPostModel } = await import("./models");
      await MarketingPostModel.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // === PARTNERS API ===
  app.get("/api/partners", async (req, res) => {
    const partners = await storage.getPartners();
    res.json(partners);
  });

  app.post("/api/admin/partners", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    const partner = await storage.createPartner(req.body);
    res.status(201).json(partner);
  });

  app.patch("/api/admin/partners/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    const partner = await storage.updatePartner(req.params.id, req.body);
    res.json(partner);
  });

  app.delete("/api/admin/partners/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    await storage.deletePartner(req.params.id);
    res.sendStatus(204);
  });

  // === ADMIN STATS API ===
  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    try {
      const [allOrders, allProjects, allUsers, allServices, allModRequests] = await Promise.all([
        storage.getOrders(),
        storage.getProjects(),
        storage.getUsers(),
        storage.getServices(),
        storage.getModificationRequests(),
      ]);

      const totalOrders = allOrders.length;
      const pendingOrders = allOrders.filter(o => o.status === "pending").length;
      const activeProjects = allProjects.filter(p => p.status !== "closed" && p.status !== "delivery").length;
      const totalRevenue = allOrders.reduce((sum, o) => {
        if (o.status === "completed" || o.status === "approved" || o.status === "in_progress") {
          return sum + Number(o.totalAmount || 0);
        }
        return sum;
      }, 0);
      const totalClients = allUsers.filter(u => u.role === "client").length;
      const totalEmployees = allUsers.filter(u => u.role !== "client" && u.role !== "admin").length;
      const totalServices = allServices.length;

      const recentOrders = allOrders
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      const recentModRequests = allModRequests.slice(0, 5);

      res.json({
        totalOrders,
        pendingOrders,
        activeProjects,
        totalRevenue,
        totalClients,
        totalEmployees,
        totalServices,
        recentOrders,
        recentModRequests,
      });
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  // === MODIFICATION REQUESTS API ===
  app.get("/api/modification-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const requests = user.role === "admin"
      ? await storage.getModificationRequests()
      : await storage.getModificationRequests(String(user.id));
    res.json(requests);
  });

  app.post("/api/modification-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { title, description, projectId, orderId, priority, attachments } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "العنوان والوصف مطلوبان" });
    }
    const request = await storage.createModificationRequest({
      userId: String(user.id),
      title,
      description,
      projectId,
      orderId,
      priority,
      attachments,
    });
    res.status(201).json(request);
  });

  app.patch("/api/modification-requests/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    try {
      if (user.role === "admin") {
        const updated = await storage.updateModificationRequest(req.params.id, req.body);
        return res.json(updated);
      }
      const existing = await storage.getModificationRequests(String(user.id));
      const own = existing.find(r => r.id === req.params.id);
      if (!own) return res.sendStatus(404);
      if (own.status !== "pending") {
        return res.status(400).json({ error: "لا يمكن تعديل هذا الطلب" });
      }
      const { title, description, projectId, orderId, priority, attachments } = req.body;
      const updated = await storage.updateModificationRequest(req.params.id, {
        title, description, projectId, orderId, priority, attachments,
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  app.delete("/api/modification-requests/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    await storage.deleteModificationRequest(req.params.id);
    res.sendStatus(204);
  });

  // === PAYPAL ROUTES === (blueprint:javascript_paypal)
  app.get("/paypal/client-id", (req, res) => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    if (!clientId) return res.status(503).json({ error: "بوابة الدفع PayPal غير مفعّلة حالياً" });
    res.json({ clientId });
  });

  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // === QIROX PRODUCTS / DEVICES ===
  app.get("/api/products", async (req, res) => {
    const { category, serviceSlug } = req.query as any;
    const products = await storage.getQiroxProducts({ category, serviceSlug, active: true });
    res.json(products);
  });

  app.get("/api/admin/products", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { category, serviceSlug } = req.query as any;
    const products = await storage.getQiroxProducts({ category, serviceSlug });
    res.json(products);
  });

  app.post("/api/admin/products", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const product = await storage.createQiroxProduct(req.body);
    res.status(201).json(product);
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const product = await storage.updateQiroxProduct(req.params.id, req.body);
    res.json(product);
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    await storage.deleteQiroxProduct(req.params.id);
    res.sendStatus(204);
  });

  // === CART ===
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = String((req.user as any).id);
    const cart = await storage.getCart(userId);
    res.json(cart || { items: [], discountAmount: 0 });
  });

  app.post("/api/cart/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = String((req.user as any).id);
    const cart = await storage.upsertCartItem(userId, req.body);
    res.json(cart);
  });

  app.delete("/api/cart/items/:itemId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = String((req.user as any).id);
    const cart = await storage.removeCartItem(userId, req.params.itemId);
    res.json(cart);
  });

  app.patch("/api/cart/items/:itemId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = String((req.user as any).id);
    const cart = await storage.updateCartItem(userId, req.params.itemId, req.body.qty);
    res.json(cart);
  });

  app.delete("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = String((req.user as any).id);
    await storage.clearCart(userId);
    res.sendStatus(204);
  });

  app.post("/api/cart/coupon", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = String((req.user as any).id);
    const { couponCode, discount } = req.body;
    const cart = await storage.applyCoupon(userId, couponCode, discount);
    res.json(cart);
  });

  // === ORDER SPECS (for employees to fill / clients to view) ===
  app.get("/api/admin/orders/:id/specs", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const specs = await storage.getOrderSpecs(req.params.id);
    res.json(specs || {});
  });

  app.put("/api/admin/orders/:id/specs", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const specs = await storage.upsertOrderSpecs(req.params.id, req.body);
    res.json(specs);
  });

  // Client can view specs for their own orders
  app.get("/api/orders/:id/specs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const order = await storage.getOrderWithUser(req.params.id);
    if (!order) return res.sendStatus(404);
    // Clients can only see their own order specs
    if (user.role === "client" && String(order.userId?._id || order.userId) !== String(user.id)) {
      return res.sendStatus(403);
    }
    const specs = await storage.getOrderSpecs(req.params.id);
    res.json(specs || {});
  });

  // ═══════════════════════════════════════════════════════════
  // === OTP / FORGOT PASSWORD / RESET PASSWORD ===
  // ═══════════════════════════════════════════════════════════
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
      const { OtpModel, UserModel } = await import("./models");
      const user = await UserModel.findOne({ email: String(email).toLowerCase().trim().trim() });
      if (!user) return res.status(404).json({ error: "لا يوجد حساب مرتبط بهذا البريد الإلكتروني" });
      // Invalidate previous forgot-password OTPs for this email only
      await OtpModel.updateMany({ email: String(email).toLowerCase().trim(), used: false, type: "forgot_password" }, { used: true });
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await OtpModel.create({ email: String(email).toLowerCase().trim(), code, expiresAt, type: "forgot_password" });
      const emailSent = await sendOtpEmail(email, user.fullName || user.username, code);
      if (emailSent) {
        console.log(`[OTP] ✅ Code for ${email}: ${code} (expires in 10 min)`);
      } else {
        console.error(`[OTP] ❌ Failed to send email to ${email} — Code: ${code}`);
      }
      res.json({ ok: true, emailSent });
    } catch (err) {
      console.error("[OTP] forgot-password error:", err);
      res.status(500).json({ error: "حدث خطأ، حاول مجدداً" });
    }
  });

  // Dev-only: get latest OTP for testing (remove in production)
  if (process.env.NODE_ENV !== "production") {
    app.get("/api/auth/dev-otp/:email", async (req, res) => {
      const { OtpModel } = await import("./models");
      const otp = await OtpModel.findOne({ email: String(req.params.email).toLowerCase().trim(), used: false, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
      if (!otp) return res.status(404).json({ error: "لا يوجد رمز نشط" });
      res.json({ code: (otp as any).code, expiresAt: (otp as any).expiresAt });
    });
  }

  // Verify email OTP (after registration)
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ error: "البريد والرمز مطلوبان" });
      const { OtpModel, UserModel } = await import("./models");
      const cleanCode = String(code).replace(/\s/g, "").trim();
      const cleanEmail = String(email).toLowerCase().trim();

      // Find valid OTP
      const otp = await OtpModel.findOne({
        email: cleanEmail,
        code: cleanCode,
        used: false,
        type: "email_verify",
        expiresAt: { $gt: new Date() }
      });

      if (!otp) {
        // Debug: show what OTPs exist for this email (non-sensitive)
        const anyOtp = await OtpModel.findOne({ email: cleanEmail, type: "email_verify" }).sort({ createdAt: -1 });
        console.log(`[OTP] verify-email FAILED for ${cleanEmail} — entered: "${cleanCode}" — latest in DB: "${anyOtp?.code || 'none'}" used:${anyOtp?.used} expired:${anyOtp ? anyOtp.expiresAt < new Date() : 'N/A'}`);
        return res.status(400).json({ error: "الرمز غير صحيح أو منتهي الصلاحية" });
      }

      // Mark OTP as used
      await OtpModel.updateOne({ _id: otp._id }, { used: true });

      // Update user emailVerified in MongoDB
      const user = await UserModel.findOneAndUpdate(
        { email: cleanEmail },
        { $set: { emailVerified: true } },
        { new: true }
      );

      if (!user) {
        console.error(`[OTP] verify-email: user not found for email=${cleanEmail}`);
        // Still return success since OTP was valid — user session will handle auth
        res.json({ ok: true, verified: true });
        return;
      }

      const userName = (user as any).fullName || (user as any).username || "عميل";
      sendWelcomeEmail(cleanEmail, userName).catch(e => console.error("[Email] welcome failed:", e));
      res.json({ ok: true, verified: true });
    } catch (err) {
      console.error("[OTP] verify-email exception:", err);
      res.status(500).json({ error: "حدث خطأ، حاول مجدداً" });
    }
  });

  // Resend email verification OTP
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const user = req.user as any;
      if (!req.isAuthenticated() || !user?.email) return res.status(400).json({ error: "غير مسجّل الدخول" });
      const { OtpModel } = await import("./models");
      const cleanUserEmail = String(user.email).toLowerCase().trim();
      await OtpModel.updateMany({ email: cleanUserEmail, used: false, type: "email_verify" }, { used: true });
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await OtpModel.create({ email: cleanUserEmail, code, expiresAt, type: "email_verify" });
      await sendEmailVerificationEmail(user.email, user.fullName || user.username, code);
      console.log(`[EMAIL-VERIFY RESEND] Code for ${user.email}: ${code}`);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "حدث خطأ، حاول مجدداً" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ error: "البريد والرمز مطلوبان" });
      const { OtpModel } = await import("./models");
      const otp = await OtpModel.findOne({ email: String(email).toLowerCase().trim(), code, used: false, type: "forgot_password", expiresAt: { $gt: new Date() } });
      if (!otp) return res.status(400).json({ error: "الرمز غير صحيح أو منتهي الصلاحية" });
      res.json({ valid: true });
    } catch (err) {
      res.status(500).json({ error: "حدث خطأ، حاول مجدداً" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) return res.status(400).json({ error: "جميع الحقول مطلوبة" });
      if (newPassword.length < 6) return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      const { OtpModel, UserModel } = await import("./models");
      const otp = await OtpModel.findOne({ email: String(email).toLowerCase().trim(), code, used: false, type: "forgot_password", expiresAt: { $gt: new Date() } });
      if (!otp) return res.status(400).json({ error: "الرمز غير صحيح أو منتهي الصلاحية" });
      const hashed = await hashPassword(newPassword);
      await UserModel.updateOne({ email: String(email).toLowerCase().trim() }, { password: hashed });
      await OtpModel.updateOne({ _id: otp._id }, { used: true });
      res.json({ ok: true });
    } catch (err) {
      console.error("[OTP] reset-password error:", err);
      res.status(500).json({ error: "حدث خطأ، حاول مجدداً" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // === NOTIFICATIONS ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { NotificationModel } = await import("./models");
    const notifs = await NotificationModel.find({ userId: (req.user as any).id }).sort({ createdAt: -1 }).limit(50);
    res.json(notifs);
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { NotificationModel } = await import("./models");
    const count = await NotificationModel.countDocuments({ userId: (req.user as any).id, read: false });
    res.json({ count });
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { NotificationModel } = await import("./models");
    await NotificationModel.updateOne({ _id: req.params.id, userId: (req.user as any).id }, { read: true });
    res.json({ ok: true });
  });

  app.patch("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { NotificationModel } = await import("./models");
    await NotificationModel.updateMany({ userId: (req.user as any).id, read: false }, { read: true });
    res.json({ ok: true });
  });

  // ═══════════════════════════════════════════════════════════
  // === INBOX MESSAGES ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/inbox", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { InboxMessageModel } = await import("./models");
    const uid = (req.user as any).id;
    const msgs = await InboxMessageModel.find({ $or: [{ fromUserId: uid }, { toUserId: uid }] })
      .populate("fromUserId", "username fullName role")
      .populate("toUserId", "username fullName role")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(msgs);
  });

  app.get("/api/inbox/unread-count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { InboxMessageModel } = await import("./models");
    const count = await InboxMessageModel.countDocuments({ toUserId: (req.user as any).id, read: false });
    res.json({ count });
  });

  app.get("/api/inbox/thread/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { InboxMessageModel } = await import("./models");
    const me = (req.user as any).id;
    const other = req.params.userId;
    const msgs = await InboxMessageModel.find({
      $or: [{ fromUserId: me, toUserId: other }, { fromUserId: other, toUserId: me }]
    }).populate("fromUserId", "username fullName role").sort({ createdAt: 1 }).limit(200);
    // Mark as read
    await InboxMessageModel.updateMany({ fromUserId: other, toUserId: me, read: false }, { read: true });
    res.json(msgs);
  });

  app.post("/api/inbox", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { InboxMessageModel, NotificationModel, UserModel } = await import("./models");
    const { toUserId, body, orderId } = req.body;
    if (!toUserId || !body?.trim()) return res.status(400).json({ error: "المستقبل والرسالة مطلوبان" });
    const me = req.user as any;
    const msg = await InboxMessageModel.create({ fromUserId: me.id, toUserId, body: body.trim(), orderId: orderId || undefined });
    // Create notification for receiver
    await NotificationModel.create({ userId: toUserId, type: 'message', title: `رسالة من ${me.fullName || me.username}`, body: body.slice(0, 100), link: '/inbox', icon: '💬' });
    // Send email if recipient has one
    const toUser = await UserModel.findById(toUserId).select("email fullName username");
    if (toUser?.email) {
      sendMessageNotificationEmail(toUser.email, toUser.fullName || toUser.username, me.fullName || me.username, body).catch(console.error);
    }
    const populated = await InboxMessageModel.findById(msg._id).populate("fromUserId", "username fullName role").populate("toUserId", "username fullName role");
    res.status(201).json(populated);
  });

  // Admin can get all users to send messages to
  app.get("/api/inbox/contacts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { UserModel, InboxMessageModel } = await import("./models");
    const me = req.user as any;
    // Find all users who have had conversations with me
    const msgs = await InboxMessageModel.find({ $or: [{ fromUserId: me.id }, { toUserId: me.id }] }).select("fromUserId toUserId");
    const userIds = new Set<string>();
    for (const m of msgs) {
      const fid = String(m.fromUserId);
      const tid = String(m.toUserId);
      if (fid !== String(me.id)) userIds.add(fid);
      if (tid !== String(me.id)) userIds.add(tid);
    }
    const users = await UserModel.find({ _id: { $in: [...userIds] } }).select("username fullName role id");
    res.json(users);
  });

  // ═══════════════════════════════════════════════════════════
  // === INVOICES ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { InvoiceModel } = await import("./models");
    const user = req.user as any;
    const query = user.role === "client" ? { userId: user.id } : {};
    const invoices = await InvoiceModel.find(query).populate("userId", "username fullName email").populate("orderId", "projectType sector").sort({ createdAt: -1 });
    res.json(invoices);
  });

  app.post("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { InvoiceModel } = await import("./models");
    const invNum = `INV-${Date.now().toString(36).toUpperCase()}`;
    const vatAmount = (req.body.amount || 0) * 0.15;
    const invoice = await InvoiceModel.create({ ...req.body, invoiceNumber: invNum, vatAmount, totalAmount: (req.body.amount || 0) + vatAmount });
    res.status(201).json(invoice);
  });

  app.patch("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { InvoiceModel } = await import("./models");
    const invoice = await InvoiceModel.findByIdAndUpdate(req.params.id, { ...req.body, ...(req.body.status === 'paid' ? { paidAt: new Date() } : {}) }, { new: true });
    res.json(invoice);
  });

  app.get("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { InvoiceModel } = await import("./models");
    const invoice = await InvoiceModel.findById(req.params.id)
      .populate("userId", "username fullName email whatsappNumber country")
      .populate("orderId", "projectType sector services");
    if (!invoice) return res.sendStatus(404);
    res.json(invoice);
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { InvoiceModel } = await import("./models");
    await InvoiceModel.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });

  // Send invoice by email
  app.post("/api/invoices/:id/send-email", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    try {
      const { InvoiceModel, UserModel } = await import("./models");
      const invoice = await InvoiceModel.findById(req.params.id).populate("userId", "fullName email username");
      if (!invoice) return res.status(404).json({ error: "الفاتورة غير موجودة" });
      const user = (invoice as any).userId;
      if (!user?.email) return res.status(400).json({ error: "البريد الإلكتروني للعميل غير موجود" });
      const { sendInvoiceEmail } = await import("./email");
      await sendInvoiceEmail(user.email, user.fullName || user.username, {
        invoiceNumber: (invoice as any).invoiceNumber,
        amount: (invoice as any).amount,
        vatAmount: (invoice as any).vatAmount,
        totalAmount: (invoice as any).totalAmount,
        status: (invoice as any).status,
        dueDate: (invoice as any).dueDate,
        notes: (invoice as any).notes,
        items: (invoice as any).items,
        createdAt: (invoice as any).createdAt,
      });
      res.json({ ok: true, message: "تم إرسال الفاتورة بنجاح" });
    } catch (err) {
      console.error("[INVOICE EMAIL]", err);
      res.status(500).json({ error: "فشل إرسال البريد" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // === RECEIPT VOUCHERS (سندات القبض) ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/receipts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { ReceiptVoucherModel } = await import("./models");
    const user = req.user as any;
    const query = user.role === "client" ? { userId: user.id } : {};
    const receipts = await ReceiptVoucherModel.find(query)
      .populate("userId", "username fullName email")
      .populate("invoiceId", "invoiceNumber")
      .sort({ createdAt: -1 });
    res.json(receipts);
  });

  app.get("/api/receipts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { ReceiptVoucherModel } = await import("./models");
    const receipt = await ReceiptVoucherModel.findById(req.params.id)
      .populate("userId", "username fullName email whatsappNumber country")
      .populate("invoiceId", "invoiceNumber amount totalAmount")
      .populate("orderId", "projectType sector");
    if (!receipt) return res.sendStatus(404);
    res.json(receipt);
  });

  app.post("/api/receipts", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    try {
      const { ReceiptVoucherModel } = await import("./models");
      const rcptNum = `RCV-${Date.now().toString(36).toUpperCase()}`;
      const receipt = await ReceiptVoucherModel.create({ ...req.body, receiptNumber: rcptNum });
      // Auto mark invoice as paid if linked
      if (req.body.invoiceId) {
        const { InvoiceModel } = await import("./models");
        await InvoiceModel.findByIdAndUpdate(req.body.invoiceId, { status: 'paid', paidAt: new Date() });
      }
      res.status(201).json(receipt);
    } catch (err) {
      res.status(500).json({ error: "فشل إنشاء السند" });
    }
  });

  app.patch("/api/receipts/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { ReceiptVoucherModel } = await import("./models");
    const receipt = await ReceiptVoucherModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(receipt);
  });

  app.delete("/api/receipts/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { ReceiptVoucherModel } = await import("./models");
    await ReceiptVoucherModel.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });

  // Send receipt by email
  app.post("/api/receipts/:id/send-email", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    try {
      const { ReceiptVoucherModel } = await import("./models");
      const receipt = await ReceiptVoucherModel.findById(req.params.id).populate("userId", "fullName email username");
      if (!receipt) return res.status(404).json({ error: "السند غير موجود" });
      const user = (receipt as any).userId;
      if (!user?.email) return res.status(400).json({ error: "البريد الإلكتروني للعميل غير موجود" });
      const { sendReceiptEmail } = await import("./email");
      await sendReceiptEmail(user.email, user.fullName || user.username, {
        receiptNumber: (receipt as any).receiptNumber,
        amount: (receipt as any).amount,
        amountInWords: (receipt as any).amountInWords,
        paymentMethod: (receipt as any).paymentMethod,
        description: (receipt as any).description,
        createdAt: (receipt as any).createdAt,
      });
      res.json({ ok: true, message: "تم إرسال السند بنجاح" });
    } catch (err) {
      console.error("[RECEIPT EMAIL]", err);
      res.status(500).json({ error: "فشل إرسال البريد" });
    }
  });

  app.get("/api/admin/finance/summary", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { InvoiceModel, OrderModel, UserModel } = await import("./models");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // build last 6 months range
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [totalRevenue, monthRevenue, unpaidTotal, cancelledTotal, totalOrders, activeClients, monthlyRaw] = await Promise.all([
      InvoiceModel.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      InvoiceModel.aggregate([{ $match: { status: 'paid', paidAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      InvoiceModel.aggregate([{ $match: { status: 'unpaid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      InvoiceModel.aggregate([{ $match: { status: 'cancelled' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      OrderModel.countDocuments({ status: { $nin: ['cancelled', 'rejected'] } }),
      UserModel.countDocuments({ role: 'client' }),
      InvoiceModel.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } }, total: { $sum: '$totalAmount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const arMonths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    const monthlyMap: Record<string, number> = {};
    for (const r of monthlyRaw) {
      monthlyMap[`${r._id.year}-${r._id.month}`] = r.total;
    }
    const monthlyBreakdown = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      return { name: arMonths[d.getMonth()], value: monthlyMap[key] || 0 };
    });

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      monthRevenue: monthRevenue[0]?.total || 0,
      unpaidTotal: unpaidTotal[0]?.total || 0,
      cancelledTotal: cancelledTotal[0]?.total || 0,
      totalOrders,
      activeClients,
      monthlyBreakdown,
    });
  });

  // ═══════════════════════════════════════════════════════════
  // === EMAIL TEST (Admin only) ===
  // ═══════════════════════════════════════════════════════════
  app.post("/api/admin/test-email", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const { type = "test", to } = req.body;
    const user = req.user as any;
    const targetEmail = to || user.email;
    if (!targetEmail) return res.status(400).json({ error: "لا يوجد بريد إلكتروني للإرسال إليه" });
    let ok = false;
    const name = user.fullName || "مدير";
    if (type === "test") ok = await sendTestEmail(targetEmail, name);
    else if (type === "welcome") ok = await sendWelcomeEmail(targetEmail, name);
    else if (type === "otp") ok = await sendOtpEmail(targetEmail, name, "123456");
    else if (type === "order") ok = await sendOrderConfirmationEmail(targetEmail, name, "TEST001", ["خدمة اختبارية", "إضافة تجريبية"]);
    else if (type === "status") ok = await sendOrderStatusEmail(targetEmail, name, "TEST001", "approved");
    else if (type === "message") ok = await sendMessageNotificationEmail(targetEmail, name, "فريق Qirox", "هذا اختبار لنظام الرسائل");
    else if (type === "project") ok = await sendProjectUpdateEmail(targetEmail, name, "نظام إدارة المخزون", "in_progress", 65, "تم الانتهاء من تصميم قاعدة البيانات");
    else if (type === "task") ok = await sendTaskAssignedEmail(targetEmail, name, "تصميم واجهة المستخدم", "تطبيق الجوال", "high");
    if (ok) res.json({ ok: true, message: `تم إرسال البريد التجريبي بنجاح إلى ${targetEmail}` });
    else res.status(500).json({ error: "فشل إرسال البريد — تحقق من إعدادات SMTP2GO" });
  });

  // === ADMIN DIRECT EMAIL ===
  app.post("/api/admin/send-email", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const { to, toName, subject, body } = req.body;
    if (!to || !subject || !body) return res.status(400).json({ error: "البريد الإلكتروني والعنوان والمحتوى مطلوبة" });
    const ok = await sendDirectEmail(to, toName || to, subject, body);
    if (ok) res.json({ ok: true, message: `تم إرسال البريد بنجاح إلى ${to}` });
    else res.status(500).json({ error: "فشل إرسال البريد — تحقق من إعدادات SMTP2GO" });
  });

  // === ADMIN EMAIL RECIPIENTS (users with emails) ===
  app.get("/api/admin/email-recipients", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const { UserModel } = await import("./models");
    const users = await UserModel.find({ email: { $exists: true, $ne: "" } }).select("email fullName username role").limit(200);
    res.json(users.map((u: any) => ({ id: u._id, email: u.email, name: u.fullName || u.username, role: u.role })));
  });

  // === EMPLOYEE SEND EMAIL (all non-client roles) ===
  app.post("/api/employee/send-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role === "client") return res.sendStatus(403);
    const { to, toName, subject, body } = req.body;
    if (!to || !subject || !body) return res.status(400).json({ error: "البريد الإلكتروني والعنوان والمحتوى مطلوبة" });
    const senderName = user.fullName || user.username;
    const fullBody = `من: ${senderName}\n\n${body}`;
    const ok = await sendDirectEmail(to, toName || to, subject, fullBody);
    if (ok) res.json({ ok: true });
    else res.status(500).json({ error: "فشل إرسال البريد" });
  });

  // === EMAIL RECIPIENTS FOR EMPLOYEES ===
  app.get("/api/employee/email-recipients", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role === "client") return res.sendStatus(403);
    const { UserModel } = await import("./models");
    const users = await UserModel.find({ email: { $exists: true, $ne: "" } }).select("email fullName username role").limit(200);
    res.json(users.map((u: any) => ({ id: u._id, email: u.email, name: u.fullName || u.username, role: u.role })));
  });

  // ═══════════════════════════════════════════════════════════
  // === EMPLOYEE: CREATE CLIENT ACCOUNT + ORDER ===
  // ═══════════════════════════════════════════════════════════
  app.post("/api/employee/create-client-order", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const actor = req.user as any;
    if (actor.role === "client") return res.sendStatus(403);
    try {
      const { UserModel } = await import("./models");
      const {
        // Client info
        fullName, email, phone, username, password,
        businessType, country,
        // Order info
        projectType, sector, idea, services, totalAmount, notes,
      } = req.body;

      if (!fullName || !email || !username || !password) {
        return res.status(400).json({ error: "يجب إدخال الاسم الكامل والبريد والمستخدم وكلمة المرور" });
      }

      const normalizedEmail = String(email).toLowerCase().trim().trim();

      // Check if username already taken
      const existingByUsername = await UserModel.findOne({ username: username.toLowerCase().trim() });
      if (existingByUsername) return res.status(409).json({ error: "اسم المستخدم مستخدم من قبل" });

      // Check if email already taken
      const existingByEmail = await UserModel.findOne({ email: normalizedEmail });
      if (existingByEmail) return res.status(409).json({ error: "البريد الإلكتروني مسجّل من قبل" });

      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(password);

      const newClient = await UserModel.create({
        username: username.toLowerCase().trim(),
        password: hashedPassword,
        fullName,
        email: normalizedEmail,
        phone: phone || "",
        role: "client",
        businessType: businessType || "",
        country: country || "",
      });

      // Send welcome email with credentials
      sendWelcomeWithCredentialsEmail(normalizedEmail, fullName, username, password).catch(console.error);
      // Notify admin
      sendAdminNewClientEmail(
        "info@qiroxstudio.online",
        fullName, normalizedEmail, phone || "",
        actor.fullName || actor.username
      ).catch(console.error);

      let createdOrder = null;
      if (projectType || idea || (services && services.length > 0)) {
        const serviceNames: string[] = (services || []).map((s: any) => s.nameAr || s.name || s).filter(Boolean);
        const orderData = {
          userId: String(newClient._id),
          projectType: projectType || "طلب من موظف",
          sector: sector || "عام",
          notes: idea ? `الفكرة: ${idea}${notes ? `\n${notes}` : ""}` : (notes || ""),
          totalAmount: totalAmount || 0,
          status: "pending",
          paymentMethod: "bank",
          items: services || [],
          adminNotes: `أُنشئ بواسطة الموظف: ${actor.fullName || actor.username}`,
        };
        createdOrder = await storage.createOrder(orderData);

        // Confirm order to client
        sendOrderConfirmationEmail(normalizedEmail, fullName, String(createdOrder.id), serviceNames).catch(console.error);
        // Notify admin about order
        sendAdminNewOrderEmail(
          "info@qiroxstudio.online",
          fullName, normalizedEmail,
          String(createdOrder.id),
          serviceNames,
          totalAmount
        ).catch(console.error);
      }

      res.status(201).json({
        client: { id: String(newClient._id), username: newClient.username, fullName: newClient.fullName, email: newClient.email },
        order: createdOrder,
      });
    } catch (err: any) {
      console.error("[employee/create-client-order]", err);
      res.status(500).json({ error: err.message || "حدث خطأ أثناء الإنشاء" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // === ACTIVITY LOG ===
  // ═══════════════════════════════════════════════════════════
  async function logActivity(userId: any, action: string, entity: string, entityId?: string, details?: any, ip?: string) {
    try {
      const { ActivityLogModel } = await import("./models");
      await ActivityLogModel.create({ userId, action, entity, entityId, details, ip });
    } catch (e) {}
  }

  app.get("/api/admin/activity-log", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { ActivityLogModel } = await import("./models");
    const logs = await ActivityLogModel.find()
      .sort({ createdAt: -1 }).limit(200)
      .populate("userId", "fullName role username");
    res.json(logs);
  });

  // ═══════════════════════════════════════════════════════════
  // === ADVANCED ANALYTICS ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/admin/analytics", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    try {
      const { OrderModel, UserModel, AttendanceModel } = await import("./models");
      const now = new Date();
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }) };
      });
      const monthlyData = await Promise.all(months.map(async ({ year, month, label }) => {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const ords = await (OrderModel as any).find({ createdAt: { $gte: start, $lte: end } });
        const revenue = ords.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
        return { label, orders: ords.length, revenue };
      }));
      const [totalUsers, totalEmployees, totalOrders, pendingOrders] = await Promise.all([
        (UserModel as any).countDocuments({ role: 'client' }),
        (UserModel as any).countDocuments({ role: { $ne: 'client' } }),
        (OrderModel as any).countDocuments(),
        (OrderModel as any).countDocuments({ status: 'pending' }),
      ]);
      const allOrders = await (OrderModel as any).find().select('totalAmount');
      const totalRevenue = allOrders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const attendanceSummary = await (AttendanceModel as any).aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, checkOut: { $ne: null } } },
        { $group: { _id: '$userId', totalHours: { $sum: '$workHours' }, days: { $sum: 1 } } },
      ]);
      const statusDist = await (OrderModel as any).aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      res.json({ monthlyData, stats: { totalUsers, totalEmployees, totalOrders, pendingOrders, totalRevenue }, attendanceSummary, statusDist });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ═══════════════════════════════════════════════════════════
  // === SUPPORT TICKETS ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/support-tickets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { SupportTicketModel } = await import("./models");
    const isAdmin = (req.user as any).role !== 'client';
    const query = isAdmin ? {} : { userId: (req.user as any)._id || (req.user as any).id };
    const tickets = await (SupportTicketModel as any).find(query)
      .sort({ createdAt: -1 }).populate('userId', 'fullName email username');
    res.json(tickets);
  });

  app.post("/api/support-tickets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { SupportTicketModel } = await import("./models");
    const { subject, category, body, priority } = req.body;
    if (!subject || !body) return res.status(400).json({ error: 'الموضوع والمحتوى مطلوبان' });
    const ticket = await (SupportTicketModel as any).create({
      userId: (req.user as any)._id || (req.user as any).id,
      subject, category: category || 'general', body, priority: priority || 'medium',
    });
    await logActivity((req.user as any)._id, 'create_ticket', 'support_ticket', ticket._id?.toString(), { subject }, req.ip);
    res.json(ticket);
  });

  app.patch("/api/admin/support-tickets/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { SupportTicketModel } = await import("./models");
    const { adminReply, status } = req.body;
    const update: any = {};
    if (status) update.status = status;
    if (adminReply) { update.adminReply = adminReply; update.repliedAt = new Date(); }
    if (status === 'closed' || status === 'resolved') update.closedAt = new Date();
    const ticket = await (SupportTicketModel as any).findByIdAndUpdate(req.params.id, update, { new: true });
    await logActivity((req.user as any)._id, 'update_ticket', 'support_ticket', req.params.id, { status, hasReply: !!adminReply }, req.ip);
    res.json(ticket);
  });

  // ═══════════════════════════════════════════════════════════
  // === EMPLOYEE PROFILE ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/employee/profile", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { EmployeeProfileModel } = await import("./models");
    const uid = (req.user as any)._id || (req.user as any).id;
    let profile = await (EmployeeProfileModel as any).findOne({ userId: uid });
    if (!profile) profile = await (EmployeeProfileModel as any).create({ userId: uid });
    res.json(profile);
  });

  app.patch("/api/employee/profile", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { EmployeeProfileModel } = await import("./models");
    const uid = (req.user as any)._id || (req.user as any).id;
    const allowed = ['bio', 'skills', 'bankName', 'bankAccount', 'bankIBAN', 'nationalId', 'hireDate', 'jobTitle'];
    const update: any = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const profile = await (EmployeeProfileModel as any).findOneAndUpdate({ userId: uid }, update, { new: true, upsert: true });
    res.json(profile);
  });

  app.get("/api/admin/employee-profiles", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { EmployeeProfileModel } = await import("./models");
    const profiles = await (EmployeeProfileModel as any).find().populate('userId', 'fullName email role username');
    res.json(profiles);
  });

  app.patch("/api/admin/employee-profiles/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { EmployeeProfileModel } = await import("./models");
    const allowed = ['hourlyRate', 'vacationDays', 'vacationUsed', 'bio', 'skills', 'bankName', 'bankAccount', 'bankIBAN', 'nationalId', 'hireDate', 'jobTitle'];
    const update: any = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const profile = await (EmployeeProfileModel as any).findByIdAndUpdate(req.params.id, update, { new: true });
    await logActivity((req.user as any)._id, 'update_employee_profile', 'employee_profile', req.params.id, update, req.ip);
    res.json(profile);
  });

  // ═══════════════════════════════════════════════════════════
  // === PAYROLL ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/admin/payroll", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { PayrollRecordModel } = await import("./models");
    const records = await (PayrollRecordModel as any).find()
      .sort({ year: -1, month: -1 })
      .populate('userId', 'fullName email role username');
    res.json(records);
  });

  app.post("/api/admin/payroll/generate", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { PayrollRecordModel, AttendanceModel, EmployeeProfileModel, UserModel } = await import("./models");
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'الشهر والسنة مطلوبان' });
    const employees = await (UserModel as any).find({ role: { $ne: 'client' } });
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const results = await Promise.all(employees.map(async (emp: any) => {
      const exists = await (PayrollRecordModel as any).findOne({ userId: emp._id, month, year });
      if (exists) return exists;
      const atts = await (AttendanceModel as any).find({ userId: emp._id, checkIn: { $gte: startDate, $lte: endDate }, checkOut: { $ne: null } });
      const workHours = atts.reduce((acc: number, a: any) => acc + (a.workHours || 0), 0);
      const profile = await (EmployeeProfileModel as any).findOne({ userId: emp._id });
      const hourlyRate = profile?.hourlyRate || 0;
      const baseSalary = workHours * hourlyRate;
      return (PayrollRecordModel as any).create({ userId: emp._id, month, year, workHours, hourlyRate, baseSalary, netSalary: baseSalary });
    }));
    await logActivity((req.user as any)._id, 'generate_payroll', 'payroll', undefined, { month, year }, req.ip);
    res.json(results);
  });

  app.patch("/api/admin/payroll/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { PayrollRecordModel } = await import("./models");
    const rec = await (PayrollRecordModel as any).findById(req.params.id);
    if (!rec) return res.sendStatus(404);
    const { bonuses, deductions, status, notes } = req.body;
    if (bonuses !== undefined) rec.bonuses = bonuses;
    if (deductions !== undefined) rec.deductions = deductions;
    if (notes !== undefined) rec.notes = notes;
    rec.netSalary = (rec.baseSalary + (rec.bonuses || 0)) - (rec.deductions || 0);
    if (status) { rec.status = status; if (status === 'paid') rec.paidAt = new Date(); }
    await rec.save();
    await logActivity((req.user as any)._id, 'update_payroll', 'payroll', req.params.id, { status }, req.ip);
    res.json(rec);
  });

  app.get("/api/employee/payroll", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { PayrollRecordModel } = await import("./models");
    const records = await (PayrollRecordModel as any).find({ userId: (req.user as any)._id || (req.user as any).id }).sort({ year: -1, month: -1 });
    res.json(records);
  });

  // ═══════════════════════════════════════════════════════════
  // === GLOBAL SEARCH ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const q = ((req.query.q as string) || '').trim();
    if (!q || q.length < 2) return res.json({ orders: [], projects: [] });
    const { OrderModel, ProjectModel } = await import("./models");
    const regex = new RegExp(q, 'i');
    const uid = (req.user as any)._id || (req.user as any).id;
    const isAdmin = (req.user as any).role !== 'client';
    const orderQ = isAdmin
      ? { $or: [{ projectType: regex }, { sector: regex }, { adminNotes: regex }, { status: regex }] }
      : { userId: uid, $or: [{ projectType: regex }, { sector: regex }, { status: regex }] };
    const [orders, projects] = await Promise.all([
      (OrderModel as any).find(orderQ).limit(6).select('projectType sector status totalAmount createdAt'),
      (ProjectModel as any).find(isAdmin ? { $or: [{ status: regex }] } : { clientId: uid }).limit(6).select('status progress startDate deadline'),
    ]);
    res.json({ orders, projects });
  });

  // ═══════════════════════════════════════════════════════════
  // === CLIENT PAYMENT HISTORY ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/client/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { OrderModel, InvoiceModel } = await import("./models");
    const uid = (req.user as any)._id || (req.user as any).id;
    const [orders, invoices] = await Promise.all([
      (OrderModel as any).find({ userId: uid }).sort({ createdAt: -1 }).select('projectType sector totalAmount isDepositPaid paymentMethod status createdAt'),
      (InvoiceModel as any).find({ userId: uid }).sort({ createdAt: -1 }),
    ]);
    res.json({ orders, invoices });
  });

  // ═══════════════════════════════════════════════════════════
  // === PWA PUSH NOTIFICATIONS ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/push/vapid-key", (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { PushSubscriptionModel } = await import("./models");
      const user = req.user as any;
      const { endpoint, keys, userAgent } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) return res.status(400).json({ error: "بيانات الاشتراك غير كاملة" });
      await PushSubscriptionModel.findOneAndUpdate(
        { endpoint },
        { userId: user._id || user.id, endpoint, keys, userAgent: userAgent || req.headers["user-agent"] || "" },
        { upsert: true, new: true }
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "فشل الاشتراك" });
    }
  });

  app.delete("/api/push/unsubscribe", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { PushSubscriptionModel } = await import("./models");
      const { endpoint } = req.body;
      if (endpoint) await PushSubscriptionModel.deleteOne({ endpoint });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "فشل إلغاء الاشتراك" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // === DEVELOPER CHECKLIST ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/checklist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ChecklistItemModel } = await import("./models");
      const user = req.user as any;
      const items = await (ChecklistItemModel as any).find({ userId: user._id || user.id }).sort({ order: 1, createdAt: -1 });
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "خطأ في تحميل القائمة" });
    }
  });

  app.post("/api/checklist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ChecklistItemModel } = await import("./models");
      const user = req.user as any;
      const { title, description, priority, category, projectId, dueDate } = req.body;
      if (!title) return res.status(400).json({ error: "العنوان مطلوب" });
      const item = await (ChecklistItemModel as any).create({
        userId: user._id || user.id,
        title, description, priority: priority || "medium",
        category: category || "عام",
        ...(projectId && { projectId }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      });
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ error: "فشل إنشاء المهمة" });
    }
  });

  app.patch("/api/checklist/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ChecklistItemModel } = await import("./models");
      const user = req.user as any;
      const item = await (ChecklistItemModel as any).findOneAndUpdate(
        { _id: req.params.id, userId: user._id || user.id },
        { $set: req.body },
        { new: true }
      );
      if (!item) return res.status(404).json({ error: "العنصر غير موجود" });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "فشل التحديث" });
    }
  });

  app.delete("/api/checklist/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ChecklistItemModel } = await import("./models");
      const user = req.user as any;
      await (ChecklistItemModel as any).findOneAndDelete({ _id: req.params.id, userId: user._id || user.id });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "فشل الحذف" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // === BANK SETTINGS (Admin only to write, public to read) ===
  // ═══════════════════════════════════════════════════════════

  // Public: get bank settings (for OrderFlow payment step)
  app.get("/api/bank-settings", async (_req, res) => {
    try {
      const { BankSettingsModel } = await import("./models");
      let settings = await BankSettingsModel.findOne({ key: "main" });
      if (!settings) {
        settings = await BankSettingsModel.create({ key: "main" });
      }
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: "فشل تحميل إعدادات البنك" });
    }
  });

  // Admin: update bank settings
  app.put("/api/admin/bank-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const allowedRoles = ["admin", "manager", "accountant"];
    if (!allowedRoles.includes(user.role)) return res.sendStatus(403);
    try {
      const { BankSettingsModel } = await import("./models");
      const { bankName, beneficiaryName, iban, accountNumber, swiftCode, currency, notes } = req.body;
      const settings = await BankSettingsModel.findOneAndUpdate(
        { key: "main" },
        { $set: { bankName, beneficiaryName, iban, accountNumber, swiftCode, currency, notes } },
        { new: true, upsert: true }
      );
      await logActivity(user._id, 'update_bank_settings', 'bank_settings', 'main', req.body, req.ip);
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: "فشل تحديث إعدادات البنك" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // === SEGMENT PRICING ===
  // ═══════════════════════════════════════════════════════════

  // Public: get all segment pricings
  app.get("/api/segment-pricing", async (_req, res) => {
    try {
      const { SegmentPricingModel } = await import("./models");
      const plans = await SegmentPricingModel.find({ isActive: true }).sort({ sortOrder: 1 });
      res.json(plans);
    } catch (err) {
      res.status(500).json({ error: "فشل تحميل الأسعار" });
    }
  });

  // Admin: get all (including inactive)
  app.get("/api/admin/segment-pricing", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { SegmentPricingModel } = await import("./models");
      const plans = await SegmentPricingModel.find().sort({ sortOrder: 1 });
      res.json(plans);
    } catch (err) {
      res.status(500).json({ error: "فشل تحميل الأسعار" });
    }
  });

  // Admin: create segment pricing
  app.post("/api/admin/segment-pricing", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { SegmentPricingModel } = await import("./models");
      const plan = await SegmentPricingModel.create(req.body);
      res.status(201).json(plan);
    } catch (err: any) {
      if (err.code === 11000) return res.status(400).json({ error: "مفتاح القطاع موجود مسبقاً" });
      res.status(500).json({ error: "فشل الإنشاء" });
    }
  });

  // Admin: update segment pricing
  app.put("/api/admin/segment-pricing/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { SegmentPricingModel } = await import("./models");
      const plan = await SegmentPricingModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
      if (!plan) return res.status(404).json({ error: "غير موجود" });
      res.json(plan);
    } catch (err) {
      res.status(500).json({ error: "فشل التحديث" });
    }
  });

  // Admin: delete segment pricing
  app.delete("/api/admin/segment-pricing/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { SegmentPricingModel } = await import("./models");
      await SegmentPricingModel.findByIdAndDelete(req.params.id);
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ error: "فشل الحذف" });
    }
  });

  // Admin: set/update client subscription
  app.post("/api/admin/users/:id/subscription", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { UserModel } = await import("./models");
      const { segmentId, segmentNameAr, period, startDate, expiresAt } = req.body;
      const user = await UserModel.findByIdAndUpdate(
        req.params.id,
        { $set: {
          subscriptionSegmentId: segmentId,
          subscriptionSegmentNameAr: segmentNameAr,
          subscriptionPeriod: period,
          subscriptionStartDate: new Date(startDate),
          subscriptionExpiresAt: new Date(expiresAt),
          subscriptionStatus: "active",
        }},
        { new: true }
      );
      if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });
      res.json(sanitizeUser(user));
    } catch (err) {
      res.status(500).json({ error: "فشل تعيين الاشتراك" });
    }
  });

  // Admin: get all client subscriptions
  app.get("/api/admin/subscriptions", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","accountant"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { UserModel } = await import("./models");
      const users = await UserModel.find({ role: "client", subscriptionStatus: { $in: ["active","expired"] } })
        .select("fullName email subscriptionSegmentNameAr subscriptionPeriod subscriptionStartDate subscriptionExpiresAt subscriptionStatus");
      // Auto-update expired subscriptions
      const now = new Date();
      const toExpire = users.filter(u => (u as any).subscriptionExpiresAt && new Date((u as any).subscriptionExpiresAt) < now && (u as any).subscriptionStatus === "active");
      if (toExpire.length > 0) {
        await UserModel.updateMany({ _id: { $in: toExpire.map(u => u._id) } }, { $set: { subscriptionStatus: "expired" } });
      }
      const refreshed = await UserModel.find({ role: "client", subscriptionStatus: { $in: ["active","expired"] } })
        .select("fullName email subscriptionSegmentNameAr subscriptionPeriod subscriptionStartDate subscriptionExpiresAt subscriptionStatus");
      res.json(refreshed);
    } catch (err) {
      res.status(500).json({ error: "فشل تحميل الاشتراكات" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // === SUB-SERVICE REQUESTS ===
  // ═══════════════════════════════════════════════════════════

  // Client: submit sub-service request
  app.post("/api/client/sub-service-request", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "client") return res.sendStatus(403);
    try {
      const { SubServiceRequestModel } = await import("./models");
      const { projectId, projectLabel, serviceType, notes } = req.body;
      if (!serviceType) return res.status(400).json({ error: "نوع الخدمة مطلوب" });
      const request = await SubServiceRequestModel.create({
        clientId: user.id || user._id,
        projectId: projectId || null,
        projectLabel: projectLabel || "",
        serviceType,
        notes: notes || "",
      });
      res.status(201).json(request);
    } catch (err) {
      res.status(500).json({ error: "فشل إرسال الطلب" });
    }
  });

  // Client: get my sub-service requests
  app.get("/api/client/sub-service-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    try {
      const { SubServiceRequestModel } = await import("./models");
      const requests = await SubServiceRequestModel.find({ clientId: user.id || user._id?.toString() }).sort({ createdAt: -1 });
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: "فشل تحميل الطلبات" });
    }
  });

  // Admin: get all sub-service requests
  app.get("/api/admin/sub-service-requests", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { SubServiceRequestModel } = await import("./models");
      const requests = await SubServiceRequestModel.find().sort({ createdAt: -1 });
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: "فشل تحميل الطلبات" });
    }
  });

  // Admin: update sub-service request status
  app.patch("/api/admin/sub-service-requests/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { SubServiceRequestModel } = await import("./models");
      const request = await SubServiceRequestModel.findByIdAndUpdate(
        req.params.id,
        { $set: { status: req.body.status, adminNotes: req.body.adminNotes || "" } },
        { new: true }
      );
      if (!request) return res.status(404).json({ error: "غير موجود" });
      res.json(request);
    } catch (err) {
      res.status(500).json({ error: "فشل التحديث" });
    }
  });

  // Initialize seed data
  await seedDatabase();

  return httpServer;
}

// Seed data function to be called from index.ts if needed
export async function seedDatabase() {
  // Initial Admin Account
  const adminUsername = "qadmin";
  const adminEmail = "info@qiroxstudio.online";
  const { setupAuth } = await import("./auth");
  const { hashPassword } = setupAuth({ use: () => {}, get: () => "development", set: () => {} } as any);

  // Migrate old admin username if exists
  const oldAdmin = await storage.getUserByUsername("admin_qirox");
  if (oldAdmin) {
    const { UserModel } = await import("./models");
    const newPw = await hashPassword("qadmin");
    await UserModel.updateOne({ username: "admin_qirox" }, { $set: { username: "qadmin", password: newPw } });
    console.log("Admin account migrated: admin_qirox → qadmin");
  }

  const { UserModel } = await import("./models");
  const existingAdmin = await storage.getUserByUsername(adminUsername);
  if (!existingAdmin) {
    const hashedPassword = await hashPassword("qadmin");
    await storage.createUser({
      username: adminUsername,
      password: hashedPassword,
      email: adminEmail,
      role: "admin",
      fullName: "System Admin",
    });
    console.log("Admin account created: admin@qirox.tech");
  } else {
    const hashedPassword = await hashPassword("qadmin");
    await UserModel.updateOne({ username: adminUsername }, { $set: { password: hashedPassword, role: "admin", email: adminEmail } });
    console.log(`Admin credentials reset: qadmin/qadmin — email: ${adminEmail}`);
  }

  const existingServices = await storage.getServices();
  if (existingServices.length === 0) {
    await storage.createService({
      title: "نظام المطاعم والكافيهات",
      description: "حل رقمي متكامل لمطاعم وكافيهات مع قائمة رقمية وطلب QR ونظام نقطة البيع.",
      category: "restaurants",
      priceMin: 1199,
      priceMax: 1199,
      estimatedDuration: "2-4 أسابيع",
      features: ["قائمة رقمية", "طلب QR", "نقطة البيع POS", "شاشة المطبخ"],
      icon: "Utensils"
    });
    await storage.createService({
      title: "المتجر الإلكتروني",
      description: "متجر إلكتروني متكامل مع بوابة دفع وإدارة مخزون وأدوات تسويق.",
      category: "stores",
      priceMin: 1000,
      priceMax: 1000,
      estimatedDuration: "3-6 أسابيع",
      features: ["بوابة الدفع", "إدارة المخزون", "تطبيق جوال", "SEO"],
      icon: "ShoppingBag"
    });
    await storage.createService({
      title: "منصة الشركات والمؤسسات",
      description: "حضور رقمي احترافي للمؤسسات مع أنظمة داخلية وبوابات آمنة. السعر يُحدد بعد مناقشة تفاصيل المشروع.",
      category: "institutions",
      priceMin: 0,
      priceMax: 0,
      estimatedDuration: "4-8 أسابيع",
      features: ["بوابة الموظفين", "إدارة المستندات", "تسجيل دخول آمن", "لوحة التحليلات"],
      icon: "Building2"
    });
    console.log("3 services reseeded with updated pricing");
  }

  // Clean repoUrl from existing templates (migration)
  try {
    const { SectorTemplateModel } = await import("./models");
    await SectorTemplateModel.collection.updateMany({}, { $unset: { repoUrl: "" } });
  } catch (e) {}

  // Seed Sector Templates
  const existingTemplates = await storage.getSectorTemplates();
  const firstEduTemplate = existingTemplates.find((t: any) => t.slug === "quran-academy");
  const templatesNeedReseed = existingTemplates.length === 0 || (firstEduTemplate && (firstEduTemplate as any).priceMin !== 2200);
  if (templatesNeedReseed) {
    for (const t of existingTemplates) {
      await storage.deleteSectorTemplate((t as any).id);
    }
    const templates = [
      {
        name: "Quran Academy System",
        nameAr: "نظام أكاديميات تحفيظ القرآن",
        slug: "quran-academy",
        description: "Complete digital platform for Quran memorization academies with student tracking, teacher management, and progress reports.",
        descriptionAr: "منصة رقمية متكاملة لأكاديميات تحفيظ القرآن مع تتبع الطلاب وإدارة المعلمين وتقارير التقدم.",
        category: "education",
        icon: "BookOpen",
        features: ["Student Progress Tracking", "Teacher Dashboard", "Quran Memorization Plans", "Parent Portal", "Attendance System"],
        featuresAr: ["تتبع تقدم الطلاب", "لوحة تحكم المعلمين", "خطط حفظ القرآن", "بوابة أولياء الأمور", "نظام الحضور"],
        tags: ["education", "quran", "academy"],
        priceMin: 2200,
        priceMax: 2200,
        currency: "SAR",
        estimatedDuration: "3-5 أسابيع",
        status: "active" as const,
        sortOrder: 1,
        heroColor: "#1a5c2e",
      },
      {
        name: "Education Platform",
        nameAr: "منصة تعليمية متكاملة",
        slug: "education-platform",
        description: "Modern e-learning platform with course management, live classes, quizzes, and student analytics.",
        descriptionAr: "منصة تعليم إلكتروني حديثة مع إدارة الدورات والفصول المباشرة والاختبارات وتحليلات الطلاب.",
        category: "education",
        icon: "GraduationCap",
        features: ["Course Builder", "Live Classes", "Quiz Engine", "Certificates", "Student Analytics"],
        featuresAr: ["منشئ الدورات", "فصول مباشرة", "محرك اختبارات", "شهادات", "تحليلات الطلاب"],
        tags: ["education", "e-learning", "courses"],
        priceMin: 2200,
        priceMax: 2200,
        currency: "SAR",
        estimatedDuration: "4-6 أسابيع",
        status: "active" as const,
        sortOrder: 2,
        heroColor: "#2563eb",
      },
      {
        name: "Exam & Assessment System",
        nameAr: "منظومة اختبارات وتقييم",
        slug: "exam-system",
        description: "Professional exam management system with question banks, auto-grading, analytics, and anti-cheat measures.",
        descriptionAr: "نظام إدارة اختبارات احترافي مع بنوك أسئلة وتصحيح تلقائي وتحليلات ومنع الغش.",
        category: "education",
        icon: "ClipboardCheck",
        features: ["Question Banks", "Auto Grading", "Timer System", "Analytics Dashboard", "Anti-Cheat"],
        featuresAr: ["بنوك الأسئلة", "تصحيح تلقائي", "نظام المؤقت", "لوحة التحليلات", "منع الغش"],
        tags: ["education", "exams", "assessment"],
        priceMin: 2200,
        priceMax: 2200,
        currency: "SAR",
        estimatedDuration: "3-5 أسابيع",
        status: "active" as const,
        sortOrder: 3,
        heroColor: "#7c3aed",
      },
      {
        name: "Fitness & Gym Platform",
        nameAr: "منصة اللياقة البدنية",
        slug: "fitness-platform",
        description: "Complete fitness website with workout plans, nutrition tracking, membership management, and trainer profiles.",
        descriptionAr: "موقع لياقة بدنية متكامل مع خطط التمارين وتتبع التغذية وإدارة العضويات وملفات المدربين.",
        category: "health",
        icon: "Dumbbell",
        features: ["Workout Plans", "Nutrition Tracker", "Membership System", "Trainer Profiles", "Progress Photos"],
        featuresAr: ["خطط التمارين", "تتبع التغذية", "نظام العضويات", "ملفات المدربين", "صور التقدم"],
        tags: ["fitness", "health", "gym"],
        priceMin: 1199,
        priceMax: 1199,
        currency: "SAR",
        estimatedDuration: "2-4 أسابيع",
        status: "active" as const,
        sortOrder: 4,
        heroColor: "#dc2626",
      },
      {
        name: "Professional Resume/CV",
        nameAr: "موقع السيرة الذاتية الاحترافية",
        slug: "resume-cv",
        description: "Personal professional portfolio and resume website with modern design, project showcase, and contact forms.",
        descriptionAr: "موقع محفظة شخصية احترافية وسيرة ذاتية بتصميم حديث وعرض المشاريع ونماذج الاتصال.",
        category: "personal",
        icon: "User",
        features: ["Responsive Design", "Project Showcase", "Skills Section", "Contact Form", "Downloadable CV"],
        featuresAr: ["تصميم متجاوب", "عرض المشاريع", "قسم المهارات", "نموذج اتصال", "تحميل السيرة الذاتية"],
        tags: ["personal", "resume", "portfolio"],
        priceMin: 999,
        priceMax: 999,
        currency: "SAR",
        estimatedDuration: "1-2 أسابيع",
        status: "active" as const,
        sortOrder: 5,
        heroColor: "#0d9488",
      },
      {
        name: "Charity & NGO Platform",
        nameAr: "منصة المؤسسات الخيرية",
        slug: "charity-ngo",
        description: "Non-profit organization website with donation management, volunteer tracking, campaigns, and transparency reports.",
        descriptionAr: "موقع منظمات غير ربحية مع إدارة التبرعات وتتبع المتطوعين والحملات وتقارير الشفافية.",
        category: "institutional",
        icon: "Heart",
        features: ["Donation System", "Volunteer Management", "Campaign Tracker", "Impact Reports", "Event Calendar"],
        featuresAr: ["نظام التبرعات", "إدارة المتطوعين", "تتبع الحملات", "تقارير الأثر", "تقويم الفعاليات"],
        tags: ["charity", "ngo", "nonprofit"],
        priceMin: 2200,
        priceMax: 2200,
        currency: "SAR",
        estimatedDuration: "3-5 أسابيع",
        status: "active" as const,
        sortOrder: 6,
        heroColor: "#ea580c",
      },
      {
        name: "E-Commerce Store",
        nameAr: "متجر إلكتروني متكامل",
        slug: "ecommerce-store",
        description: "Full-featured e-commerce platform with product management, cart, checkout, payment gateways, and order tracking.",
        descriptionAr: "منصة تجارة إلكترونية متكاملة مع إدارة المنتجات وسلة التسوق والدفع وتتبع الطلبات.",
        category: "commerce",
        icon: "ShoppingCart",
        features: ["Product Catalog", "Shopping Cart", "Payment Gateway", "Order Tracking", "Inventory Management"],
        featuresAr: ["كتالوج المنتجات", "سلة التسوق", "بوابة الدفع", "تتبع الطلبات", "إدارة المخزون"],
        tags: ["ecommerce", "shop", "store"],
        priceMin: 1000,
        priceMax: 1000,
        currency: "SAR",
        estimatedDuration: "4-6 أسابيع",
        status: "active" as const,
        sortOrder: 7,
        heroColor: "#ca8a04",
      },
      {
        name: "Cafe & Restaurant System",
        nameAr: "نظام الكافيهات والمطاعم",
        slug: "cafe-restaurant",
        description: "Smart restaurant management system with digital menu, QR ordering, kitchen display, and real-time analytics.",
        descriptionAr: "نظام إدارة مطاعم ذكي مع قائمة رقمية وطلب عبر QR وشاشة المطبخ وتحليلات مباشرة.",
        category: "food",
        icon: "Coffee",
        features: ["Digital Menu", "QR Ordering", "Kitchen Display", "Table Management", "Real-time Analytics"],
        featuresAr: ["قائمة رقمية", "طلب QR", "شاشة المطبخ", "إدارة الطاولات", "تحليلات مباشرة"],
        tags: ["restaurant", "cafe", "food"],
        priceMin: 1199,
        priceMax: 1199,
        currency: "SAR",
        estimatedDuration: "2-4 أسابيع",
        status: "active" as const,
        sortOrder: 8,
        heroColor: "#92400e",
      },
    ];

    for (const t of templates) {
      await storage.createSectorTemplate(t);
    }
    console.log("8 sector templates seeded successfully");
  }

  // Seed Pricing Plans — Segment × Tier system (v5)
  const existingPlans = await storage.getPricingPlans();
  const restaurantLite = existingPlans.find((p: any) => p.slug === "restaurant-lite");
  const needsReseed =
    !restaurantLite ||
    !(restaurantLite as any).segment ||
    existingPlans.some((p: any) => p.slug === "ecommerce" || p.slug === "lite");

  if (needsReseed) {
    for (const p of existingPlans) {
      await storage.deletePricingPlan((p as any).id);
    }

    type PlanDef = {
      slug: string; name: string; nameAr: string; segment: string;
      tier: string; descriptionAr: string;
      monthlyPrice: number; sixMonthPrice: number; annualPrice: number; lifetimePrice: number;
      featuresAr: string[]; isPopular: boolean; isCustom: boolean; sortOrder: number;
    };

    const SEGMENTS = [
      {
        segment: "restaurant",
        plans: [
          { tier: "lite", monthly: 199, sixmo: 380, annual: 699, lifetime: 3499, popular: false,
            featuresAr: ["موقع مطعم احترافي", "قائمة طعام رقمية", "نموذج حجز طاولة", "ربط خرائط Google", "ربط سوشيال ميديا", "SSL مجاني", "دعم فني شهر واحد"] },
          { tier: "pro",     monthly: 349, sixmo: 650, annual: 1199, lifetime: 5999, popular: true,
            featuresAr: ["كل مزايا لايت", "طلب عبر QR Code", "إدارة الطاولات", "نظام الطلبات والمطبخ", "تقارير المبيعات", "إشعارات فورية", "دعم توصيل واستلام", "دعم فني 6 أشهر", "دومين مجاني سنة"] },
          { tier: "infinite", monthly: 599, sixmo: 1100, annual: 1999, lifetime: 9999, popular: false,
            featuresAr: ["كل مزايا برو", "تطبيق جوال للمطعم", "بوابة دفع إلكتروني", "نظام ولاء ونقاط", "تكامل POS", "لوحة تحليلات متقدمة", "دعم أولوية 24/7", "مدير حساب مخصص"] },
        ]
      },
      {
        segment: "ecommerce",
        plans: [
          { tier: "lite", monthly: 299, sixmo: 550, annual: 999, lifetime: 4999, popular: false,
            featuresAr: ["متجر إلكتروني أساسي", "حتى 100 منتج", "سلة تسوق", "إدارة الطلبات", "ربط سوشيال ميديا", "SSL مجاني", "دعم فني شهرين"] },
          { tier: "pro",     monthly: 499, sixmo: 950, annual: 1699, lifetime: 7999, popular: true,
            featuresAr: ["كل مزايا لايت", "منتجات غير محدودة", "تكامل بوابات الدفع", "إدارة المخزون", "كوبونات وخصومات", "تقارير المبيعات", "SEO احترافي", "دعم فني 6 أشهر", "دومين مجاني سنة"] },
          { tier: "infinite", monthly: 899, sixmo: 1700, annual: 2999, lifetime: 14999, popular: false,
            featuresAr: ["كل مزايا برو", "تطبيق جوال iOS وAndroid", "نظام ولاء ونقاط", "تكامل ERP", "تقارير متقدمة", "دعم متعدد العملات", "دعم أولوية 24/7", "مدير حساب مخصص"] },
        ]
      },
      {
        segment: "education",
        plans: [
          { tier: "lite", monthly: 399, sixmo: 750, annual: 1299, lifetime: 5999, popular: false,
            featuresAr: ["منصة تعليمية أساسية", "حتى 5 كورسات", "إدارة الطلاب", "اختبارات بسيطة", "شهادات إتمام", "SSL مجاني", "دعم فني شهرين"] },
          { tier: "pro",     monthly: 699, sixmo: 1300, annual: 2299, lifetime: 10999, popular: true,
            featuresAr: ["كل مزايا لايت", "كورسات غير محدودة", "فصول مباشرة Live", "نظام تقييم متقدم", "بوابة أولياء الأمور", "تقارير تفصيلية", "دعم فني 6 أشهر", "دومين مجاني سنة"] },
          { tier: "infinite", monthly: 1199, sixmo: 2300, annual: 3999, lifetime: 19999, popular: false,
            featuresAr: ["كل مزايا برو", "تطبيق جوال", "بوابة دفع إلكتروني", "نظام منح ومنح دراسية", "تكامل Zoom/Meet", "لوحة تحليلات تعليمية", "دعم أولوية 24/7", "مدير حساب مخصص"] },
        ]
      },
      {
        segment: "corporate",
        plans: [
          { tier: "lite", monthly: 499, sixmo: 950, annual: 1699, lifetime: 7999, popular: false,
            featuresAr: ["موقع شركة احترافي", "صفحات تعريفية", "نموذج تواصل", "خريطة المكاتب", "SSL مجاني", "دعم فني شهرين"] },
          { tier: "pro",     monthly: 999, sixmo: 1900, annual: 3299, lifetime: 15999, popular: true,
            featuresAr: ["كل مزايا لايت", "لوحة تحكم متكاملة", "إدارة الفريق", "بوابة العملاء", "مدونة الشركة", "SEO احترافي", "تقارير شهرية", "دعم فني 6 أشهر", "دومين مجاني سنة"] },
          { tier: "infinite", monthly: 1999, sixmo: 3800, annual: 6599, lifetime: 29999, popular: false,
            featuresAr: ["كل مزايا برو", "تطبيق جوال", "نظام ERP مبسط", "API مخصص", "تكاملات خارجية", "تقارير متقدمة", "دعم أولوية 24/7", "تدريب الفريق", "مدير حساب مخصص"] },
        ]
      },
      {
        segment: "realestate",
        plans: [
          { tier: "lite", monthly: 299, sixmo: 550, annual: 999, lifetime: 4999, popular: false,
            featuresAr: ["موقع عقاري احترافي", "قوائم العقارات", "بحث وفلترة", "نموذج تواصل", "خرائط تفاعلية", "SSL مجاني", "دعم فني شهرين"] },
          { tier: "pro",     monthly: 499, sixmo: 950, annual: 1699, lifetime: 7999, popular: true,
            featuresAr: ["كل مزايا لايت", "إدارة العقارات غير محدودة", "جدولة المعاينات", "حاسبة التقسيط", "بوابة المالك", "تقارير السوق", "دعم فني 6 أشهر", "دومين مجاني سنة"] },
          { tier: "infinite", monthly: 899, sixmo: 1700, annual: 2999, lifetime: 14999, popular: false,
            featuresAr: ["كل مزايا برو", "تطبيق جوال", "نظام CRM عقاري", "تكامل موالشي/إيجار", "تحليلات السوق", "دعم أولوية 24/7", "مدير حساب مخصص"] },
        ]
      },
      {
        segment: "healthcare",
        plans: [
          { tier: "lite", monthly: 299, sixmo: 550, annual: 999, lifetime: 4999, popular: false,
            featuresAr: ["موقع عيادة احترافي", "صفحة الأطباء", "حجز مواعيد بسيط", "معلومات الخدمات", "SSL مجاني", "دعم فني شهرين"] },
          { tier: "pro",     monthly: 499, sixmo: 950, annual: 1699, lifetime: 7999, popular: true,
            featuresAr: ["كل مزايا لايت", "نظام حجز متكامل", "ملف المريض", "إشعارات المواعيد", "تقارير العيادة", "بوابة المريض", "دعم فني 6 أشهر", "دومين مجاني سنة"] },
          { tier: "infinite", monthly: 899, sixmo: 1700, annual: 2999, lifetime: 14999, popular: false,
            featuresAr: ["كل مزايا برو", "تطبيق جوال", "سجل طبي إلكتروني", "وصفة طبية رقمية", "تكامل مختبرات", "دعم أولوية 24/7", "مدير حساب مخصص"] },
        ]
      },
    ];

    const TIER_NAME: Record<string, { name: string; nameAr: string }> = {
      lite:     { name: "Lite",     nameAr: "لايت" },
      pro:      { name: "Pro",      nameAr: "برو" },
      infinite: { name: "Infinite", nameAr: "إنفينتي" },
    };
    const TIER_DESC: Record<string, string> = {
      lite:     "الباقة الأساسية — كل ما تحتاجه للبداية",
      pro:      "الباقة المتكاملة — للأعمال المتنامية",
      infinite: "الباقة الشاملة — بلا حدود وبميزات حصرية",
    };
    const TIER_ORDER: Record<string, number> = { lite: 1, pro: 2, infinite: 3 };

    const allPlans: PlanDef[] = [];
    SEGMENTS.forEach(({ segment, plans }) => {
      plans.forEach(({ tier, monthly, sixmo, annual, lifetime, popular, featuresAr }) => {
        allPlans.push({
          slug: `${segment}-${tier}`,
          name: TIER_NAME[tier].name,
          nameAr: TIER_NAME[tier].nameAr,
          segment,
          tier,
          descriptionAr: TIER_DESC[tier],
          monthlyPrice: monthly,
          sixMonthPrice: sixmo,
          annualPrice: annual,
          lifetimePrice: lifetime,
          featuresAr,
          isPopular: popular,
          isCustom: false,
          sortOrder: TIER_ORDER[tier],
        });
      });
    });

    for (const p of allPlans) {
      await storage.createPricingPlan({
        ...p,
        price: p.lifetimePrice,
        billingCycle: "lifetime",
        currency: "SAR",
        status: "active",
      } as any);
    }
    console.log(`${allPlans.length} segment-tier plans seeded (v5)`);
  }
}
