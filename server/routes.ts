import type { Express } from "express";
import type { Server } from "http";
import { setupAuth } from "./auth";
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

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

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
      cb(new Error("File type not allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const { hashPassword } = setupAuth(app);

  app.use("/uploads", express.static(uploadsDir));

  app.post("/api/upload", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "File too large (max 20MB)" });
        return res.status(400).json({ error: err.message });
      }
      if (err) return res.status(400).json({ error: err.message || "Upload failed" });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.originalname, size: req.file.size });
    });
  });

  app.post("/api/upload/multiple", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    upload.array("files", 10)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "File too large (max 20MB)" });
        return res.status(400).json({ error: err.message });
      }
      if (err) return res.status(400).json({ error: err.message || "Upload failed" });
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });
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
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // If registering as admin or employee via the standard route, force to client
      // unless it's a specific internal registration flow (which we'll handle by role-based validation)
      const role = req.body.role || "client";
      
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        role,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
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
    res.json(users);
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
        return res.status(400).json({ error: "Missing required fields" });
      }
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
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
      res.status(201).json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create user" });
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
        return res.status(400).json({ error: "Invalid role" });
      }
      if (sanitized.password) {
        if (sanitized.password.length < 6) {
          return res.status(400).json({ error: "Password must be at least 6 characters" });
        }
        sanitized.password = await hashPassword(sanitized.password);
      }
      const user = await storage.updateUser(req.params.id, sanitized);
      if (!user) return res.sendStatus(404);
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update user" });
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
        return res.status(400).json({ error: "Cannot delete admin users" });
      }
      await storage.deleteUser(req.params.id);
      res.sendStatus(204);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete user" });
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
          if (!user) return res.status(401).send("Invalid credentials");
          req.login(user, (err: any) => {
            if (err) return next(err);
            res.status(200).json(user);
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
    res.json(req.user);
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
      return res.status(400).send("No active session found");
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

  // === ADMIN ORDERS API ===
  app.get("/api/admin/orders", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") {
      return res.sendStatus(403);
    }
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.patch("/api/admin/orders/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") {
      return res.sendStatus(403);
    }
    const order = await storage.updateOrder(req.params.id, req.body);
    res.json(order);
  });

  // === ORDERS API ===
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const orders = await storage.getOrders(String((req.user as User).id));
    res.json(orders);
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const order = await storage.createOrder({ ...req.body, userId: String((req.user as User).id) });
    res.status(201).json(order);
  });

  // === PROJECTS API ===
  app.get(api.projects.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const projects = await storage.getProjects(String(user.id), user.role);
    res.json(projects);
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
    const project = await storage.updateProject(req.params.id, input);
    res.json(project);
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
  });

  app.patch(api.tasks.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.tasks.update.input.parse(req.body);
    const task = await storage.updateTask(req.params.id, input);
    res.json(task);
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
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.patch("/api/admin/news/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const news = await storage.updateNews(req.params.id, req.body);
      res.json(news);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/admin/news/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      await storage.deleteNews(req.params.id);
      res.sendStatus(204);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
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
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.patch("/api/admin/jobs/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const job = await storage.updateJob(req.params.id, req.body);
      res.json(job);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/admin/jobs/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      await storage.deleteJob(req.params.id);
      res.sendStatus(204);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
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
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // === ADMIN CUSTOMERS API ===
  app.get("/api/admin/customers", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const users = await storage.getUsers();
    res.json(users.filter((u: any) => u.role === "client"));
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
      res.status(500).json({ error: err.message || "Failed to fetch stats" });
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
      return res.status(400).json({ error: "Title and description are required" });
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
        return res.status(400).json({ error: "Can only edit pending requests" });
      }
      const { title, description, projectId, orderId, priority, attachments } = req.body;
      const updated = await storage.updateModificationRequest(req.params.id, {
        title, description, projectId, orderId, priority, attachments,
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update request" });
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
    if (!clientId) return res.status(503).json({ error: "PayPal not configured" });
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

  // Initialize seed data
  await seedDatabase();

  return httpServer;
}

// Seed data function to be called from index.ts if needed
export async function seedDatabase() {
  // Initial Admin Account
  const adminUsername = "admin_qirox";
  const adminEmail = "admin@qirox.tech";
  const existingAdmin = await storage.getUserByUsername(adminUsername);
  
  if (!existingAdmin) {
    const { setupAuth } = await import("./auth");
    const { hashPassword } = setupAuth({ use: () => {}, get: () => "development", set: () => {} } as any);
    const hashedPassword = await hashPassword("admin13579");
    
    await storage.createUser({
      username: adminUsername,
      password: hashedPassword,
      email: adminEmail,
      role: "admin",
      fullName: "System Admin",
    });
    console.log("Admin account created: admin@qirox.tech");
  }

  const existingServices = await storage.getServices();
  const restaurantService = existingServices.find((s: any) => s.category === "restaurants");
  const servicesNeedReseed = existingServices.length === 0 || (restaurantService && (restaurantService as any).priceMin !== 1199);
  if (servicesNeedReseed) {
    for (const s of existingServices) {
      await storage.deleteService((s as any).id);
    }
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

  // Seed Pricing Plans — always re-seed to keep pricing current
  const existingPlans = await storage.getPricingPlans();
  const ecommercePlan = existingPlans.find((p: any) => p.slug === "ecommerce");
  const educationPlan = existingPlans.find((p: any) => p.slug === "education");
  const needsReseed =
    existingPlans.length < 4 ||
    !ecommercePlan ||
    (ecommercePlan as any).price !== 1000 ||
    !(ecommercePlan as any).originalPrice ||
    !(ecommercePlan as any).addonsAr?.length ||
    !educationPlan ||
    !(educationPlan as any).featuresAr?.includes("أي تصميم في ذهنك — ننفذه");
  if (needsReseed) {
    for (const p of existingPlans) {
      await storage.deletePricingPlan((p as any).id);
    }
    const plans = [
      {
        name: "E-Commerce Store",
        nameAr: "باقة المتاجر الإلكترونية",
        slug: "ecommerce",
        description: "Complete e-commerce solution with all essentials",
        descriptionAr: "حل متجر إلكتروني متكامل يشمل كل ما تحتاجه",
        price: 1000,
        originalPrice: 1500,
        offerLabel: "وفر 33%",
        currency: "SAR",
        billingCycle: "yearly" as const,
        featuresAr: [
          "متجر إلكتروني احترافي كامل",
          "لوحة تحكم متقدمة",
          "تكامل بوابات الدفع",
          "إدارة المخزون والطلبات",
          "متجاوب مع جميع الأجهزة",
          "6 أشهر مجاناً فوق السنة",
          "بزنس إيميل لمدة شهرين مجاناً",
          "خدمة بريد لمدة 3 أشهر مجاناً",
        ],
        addonsAr: [
          "دومين سعودي .sa — 100 ر.س (بدلاً من 150)",
          "دومين عالمي .com — 45 ر.س (بدلاً من 60)",
        ],
        isPopular: true,
        isCustom: false,
        status: "active" as const,
        sortOrder: 1,
      },
      {
        name: "Education Platform",
        nameAr: "المنصة التعليمية",
        slug: "education",
        description: "Full e-learning platform for academies and institutions",
        descriptionAr: "منصة تعليمية متكاملة — أي تصميم في ذهنك ننفذه، ولو أعجبك موقع معين نبنيه لك",
        price: 2200,
        currency: "SAR",
        billingCycle: "one_time" as const,
        featuresAr: [
          "منصة تعليمية احترافية متكاملة",
          "إدارة الطلاب والمعلمين",
          "دورات وفصول مباشرة",
          "نظام اختبارات وتقييم",
          "شهادات إتمام تلقائية",
          "تحليلات وتقارير شاملة",
          "بوابة أولياء الأمور",
          "أي تصميم في ذهنك — ننفذه",
          "أعجبك موقع معين؟ نبنيه لك",
        ],
        addonsAr: [
          "دومين سعودي .sa — 100 ر.س (بدلاً من 150)",
          "دومين عالمي .com — 45 ر.س (بدلاً من 60)",
        ],
        isPopular: false,
        isCustom: false,
        status: "active" as const,
        sortOrder: 2,
      },
      {
        name: "Restaurants & Cafes",
        nameAr: "المطاعم والمقاهي",
        slug: "restaurant",
        description: "Smart restaurant management system with digital menu and QR ordering",
        descriptionAr: "نظام مطاعم ذكي مع قائمة رقمية وطلب عبر QR",
        price: 1199,
        currency: "SAR",
        billingCycle: "one_time" as const,
        featuresAr: [
          "قائمة طعام رقمية تفاعلية",
          "طلب عبر QR Code",
          "إدارة الطاولات والحجوزات",
          "نظام الطلبات والمطبخ",
          "تقارير المبيعات اليومية",
          "إشعارات فورية للطلبات",
          "دعم التوصيل والاستلام",
          "تصميم يعكس هوية المطعم",
        ],
        addonsAr: [
          "دومين سعودي .sa — 100 ر.س (بدلاً من 150)",
          "دومين عالمي .com — 45 ر.س (بدلاً من 60)",
        ],
        isPopular: false,
        isCustom: false,
        status: "active" as const,
        sortOrder: 3,
      },
      {
        name: "Companies & Institutions",
        nameAr: "الشركات والمؤسسات",
        slug: "enterprise",
        description: "Custom enterprise solution — pricing after discussing your needs",
        descriptionAr: "حل مؤسسي مخصص يُبنى حسب متطلباتك — السعر بعد مناقشة التفاصيل",
        price: 0,
        currency: "SAR",
        billingCycle: "one_time" as const,
        featuresAr: [
          "أي تصميم في ذهنك ننفذه",
          "نبني موقعاً مثل أي موقع تعجبك",
          "لا قيود على الميزات والتصميم",
          "تكامل مع أنظمة الشركة الحالية",
          "API مخصص وحلول تقنية متقدمة",
          "دعم مخصص وأولوية في التنفيذ",
          "تدريب الفريق واستلام المشروع",
          "ضمان ما بعد التسليم",
        ],
        addonsAr: [],
        isPopular: false,
        isCustom: true,
        status: "active" as const,
        sortOrder: 4,
      },
    ];

    for (const p of plans) {
      await storage.createPricingPlan(p);
    }
    console.log("4 pricing plans seeded successfully (v3)");
  }
}
