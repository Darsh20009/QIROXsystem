// @ts-nocheck
import type { Express } from "express";
import type { Server } from "http";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { setupAuth, hashPassword, invalidateUserCache } from "./auth";
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
import rateLimit from "express-rate-limit";
import { cache, CACHE_TTL } from "./cache";

// ── Rate limiters ────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "محاولات كثيرة جداً، حاول مجدداً بعد 15 دقيقة" },
});
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "تجاوزت الحد المسموح، حاول مجدداً بعد ساعة" },
});
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "رسائل كثيرة جداً، حاول مجدداً لاحقاً" },
});
import { sendWelcomeEmail, sendOtpEmail, sendEmailVerificationEmail, sendLoginOtpEmail, sendOrderConfirmationEmail, sendOrderStatusEmail, sendMessageNotificationEmail, sendProjectUpdateEmail, sendTaskAssignedEmail, sendTaskCompletedEmail, sendDirectEmail, sendTestEmail, sendAdminNewClientEmail, sendAdminNewOrderEmail, sendWelcomeWithCredentialsEmail, sendConsultationConfirmationEmail, sendConsultationNotificationEmail, sendShipmentUpdateEmail, sendFeaturesEmail } from "./email";
import { pushNotification, broadcastNotification } from "./ws";
import { sendPushToUser, VAPID_PUBLIC } from "./push";

const pending2FA = new Map<string, { userId: string; methods: string[]; expiresAt: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of pending2FA) { if (v.expiresAt < now) pending2FA.delete(k); }
}, 60_000);

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function sanitizeUser(user: any): any {
  if (!user) return user;
  if (Array.isArray(user)) return user.map(sanitizeUser);
  const obj = typeof user.toJSON === "function" ? user.toJSON() : { ...user };
  delete obj.password;
  delete obj.walletPin;
  delete obj.walletCardNumber;
  return obj;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
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
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|mp4|mov|avi|mp3|wav|webm|ogg|oga|weba|m4a|aac|opus)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مسموح به"));
    }
  },
});

const uploadLarge = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = crypto.randomBytes(16).toString("hex");
      cb(null, `${name}${ext}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|mp4|mov|avi|webm|mkv|mp3|wav|ogg|m4a|jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مسموح به"));
    }
  },
});

// ── Atomic Wallet Helpers ────────────────────────────────────────────────────
// Uses MongoDB document-level atomicity ($inc with condition) — safe without Replica Set

async function atomicWalletCredit(userId: string, amount: number): Promise<void> {
  const { UserModel } = await import("./models");
  await UserModel.findByIdAndUpdate(userId, { $inc: { walletBalance: amount } });
}

async function atomicWalletDebit(userId: string, amount: number): Promise<boolean> {
  const { UserModel } = await import("./models");
  const result = await UserModel.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: amount - 0.005 } },
    { $inc: { walletBalance: -amount } }
  );
  return !!result;
}

async function getWalletBalance(userId: string): Promise<number> {
  const { UserModel } = await import("./models");
  const user = await UserModel.findById(userId).select("walletBalance");
  return Math.max(0, (user as any)?.walletBalance ?? 0);
}

// ────────────────────────────────────────────────────────────────────────────

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const { hashPassword } = setupAuth(app);

  // ─── Google OAuth ───────────────────────────────────────────────────────────
  {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const GOOGLE_ENABLED = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

    if (GOOGLE_ENABLED) {
      const { Strategy: GoogleStrategy } = await import("passport-google-oauth20");
      const passport = (await import("passport")).default;
      // In dev, use Replit domain if available so OAuth redirect works in the browser
      const devDomain = process.env.REPLIT_DEV_DOMAIN;
      const CALLBACK_URL =
        process.env.NODE_ENV === "production"
          ? "https://qiroxstudio.online/api/auth/google/callback"
          : devDomain
          ? `https://${devDomain}/api/auth/google/callback`
          : `http://localhost:5000/api/auth/google/callback`;

      passport.use(
        new GoogleStrategy(
          { clientID: GOOGLE_CLIENT_ID!, clientSecret: GOOGLE_CLIENT_SECRET!, callbackURL: CALLBACK_URL },
          async (_accessToken, _refreshToken, profile, done) => {
            try {
              const { UserModel } = await import("./models");
              const email = profile.emails?.[0]?.value?.toLowerCase().trim();
              if (!email) return done(new Error("لم يتم الحصول على البريد الإلكتروني من Google"));

              // Try to find by googleId first, then by email
              let user = await UserModel.findOne({ googleId: profile.id });
              if (!user) {
                user = await UserModel.findOne({ email });
              }

              if (user) {
                // Link google account if not already linked
                if (!user.googleId) {
                  user.googleId = profile.id;
                  user.googleAvatarUrl = profile.photos?.[0]?.value || "";
                  user.emailVerified = true;
                  await user.save();
                }
                return done(null, user);
              }

              // Create new user from Google profile
              const { randomBytes } = await import("crypto");
              const rawUsername = (email.split("@")[0] + randomBytes(2).toString("hex")).replace(/[^a-z0-9_]/gi, "").slice(0, 20) || `user${randomBytes(4).toString("hex")}`;
              let username = rawUsername;
              let suffix = 1;
              while (await UserModel.findOne({ username })) {
                username = `${rawUsername}${suffix++}`;
              }
              const randomPw = await hashPassword(randomBytes(32).toString("hex"));
              const newUser = await UserModel.create({
                username,
                password: randomPw,
                email,
                fullName: profile.displayName || email.split("@")[0],
                googleId: profile.id,
                googleAvatarUrl: profile.photos?.[0]?.value || "",
                emailVerified: true,
                role: "client",
              });
              return done(null, newUser);
            } catch (err: any) {
              return done(err);
            }
          }
        )
      );
    }

    // Route: start Google OAuth flow
    app.get("/api/auth/google", async (req, res, next) => {
      if (!GOOGLE_ENABLED) return res.status(503).json({ error: "تسجيل الدخول بـ Google غير مفعّل حالياً" });
      const passport = (await import("passport")).default;
      passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
    });

    // Route: Google OAuth callback
    app.get("/api/auth/google/callback", async (req, res, next) => {
      if (!GOOGLE_ENABLED) return res.redirect("/login?error=google_disabled");
      const passport = (await import("passport")).default;
      const { DeviceTokenModel } = await import("./models");
      const { randomBytes, createHash } = await import("crypto");

      passport.authenticate("google", { failureRedirect: "/login?error=google_failed" }, async (err: any, user: any) => {
        if (err || !user) return res.redirect("/login?error=google_failed");
        req.login(user, async (loginErr) => {
          if (loginErr) return res.redirect("/login?error=google_failed");
          // Issue device token (trusted device — Google already verified identity)
          const plainToken = randomBytes(48).toString("hex");
          const tokenHash = createHash("sha256").update(plainToken).digest("hex");
          const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
          await DeviceTokenModel.create({ userId: user._id, tokenHash, userAgent: req.headers["user-agent"] || "", expiresAt });
          const MGMT_ROLES = ["admin", "manager"];
          const redirectPath = user.role === "client"
            ? "/dashboard"
            : MGMT_ROLES.includes(user.role)
              ? "/admin"
              : "/employee/role-dashboard";
          // Pass device token via /login?googleToken=... so client can store it, then navigates
          res.redirect(`/login?googleToken=${encodeURIComponent(plainToken)}&next=${encodeURIComponent(redirectPath)}`);
        });
      })(req, res, next);
    });

    // Route: check if google is enabled
    app.get("/api/auth/google/status", (_req, res) => res.json({ enabled: GOOGLE_ENABLED }));
  }
  // ────────────────────────────────────────────────────────────────────────────
  // === GITHUB OAUTH ===
  {
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
    const GITHUB_ENABLED = !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);

    if (GITHUB_ENABLED) {
      const { Strategy: GitHubStrategy } = await import("passport-github2");
      const passport = (await import("passport")).default;
      const devDomain = process.env.REPLIT_DEV_DOMAIN;
      const CALLBACK_URL =
        process.env.NODE_ENV === "production"
          ? "https://qiroxstudio.online/api/auth/github/callback"
          : devDomain
          ? `https://${devDomain}/api/auth/github/callback`
          : `http://localhost:5000/api/auth/github/callback`;

      passport.use(
        new GitHubStrategy(
          { clientID: GITHUB_CLIENT_ID!, clientSecret: GITHUB_CLIENT_SECRET!, callbackURL: CALLBACK_URL, scope: ["user:email"] },
          async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
            try {
              const { UserModel } = await import("./models");
              const email = (profile.emails?.[0]?.value || "").toLowerCase().trim()
                || `github_${profile.id}@noemail.qirox`;

              let user = await UserModel.findOne({ githubId: profile.id });
              if (!user && email && !email.includes("@noemail.qirox")) {
                user = await UserModel.findOne({ email });
              }

              if (user) {
                if (!user.githubId) {
                  user.githubId = profile.id;
                  user.githubAvatarUrl = profile.photos?.[0]?.value || "";
                  if (!email.includes("@noemail.qirox")) user.emailVerified = true;
                  await user.save();
                }
                return done(null, user);
              }

              const { randomBytes } = await import("crypto");
              const rawUsername = ((profile.username || email.split("@")[0]) + randomBytes(2).toString("hex"))
                .replace(/[^a-z0-9_]/gi, "").slice(0, 20) || `user${randomBytes(4).toString("hex")}`;
              let username = rawUsername;
              let suffix = 1;
              while (await UserModel.findOne({ username })) username = `${rawUsername}${suffix++}`;

              const randomPw = await hashPassword(randomBytes(32).toString("hex"));
              const newUser = await UserModel.create({
                username,
                password: randomPw,
                email,
                fullName: profile.displayName || profile.username || username,
                githubId: profile.id,
                githubAvatarUrl: profile.photos?.[0]?.value || "",
                emailVerified: !email.includes("@noemail.qirox"),
                role: "client",
              });
              return done(null, newUser);
            } catch (err: any) {
              return done(err);
            }
          }
        )
      );
    }

    app.get("/api/auth/github", async (req, res, next) => {
      if (!GITHUB_ENABLED) return res.status(503).json({ error: "تسجيل الدخول بـ GitHub غير مفعّل حالياً" });
      const passport = (await import("passport")).default;
      passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
    });

    app.get("/api/auth/github/callback", async (req, res, next) => {
      if (!GITHUB_ENABLED) return res.redirect("/login?error=github_disabled");
      const passport = (await import("passport")).default;
      const { DeviceTokenModel } = await import("./models");
      const { randomBytes, createHash } = await import("crypto");

      passport.authenticate("github", { failureRedirect: "/login?error=github_failed" }, async (err: any, user: any) => {
        if (err || !user) return res.redirect("/login?error=github_failed");
        req.login(user, async (loginErr) => {
          if (loginErr) return res.redirect("/login?error=github_failed");
          const plainToken = randomBytes(48).toString("hex");
          const tokenHash = createHash("sha256").update(plainToken).digest("hex");
          const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
          await DeviceTokenModel.create({ userId: user._id, tokenHash, userAgent: req.headers["user-agent"] || "", expiresAt });
          const MGMT_ROLES = ["admin", "manager"];
          const redirectPath = user.role === "client"
            ? "/dashboard"
            : MGMT_ROLES.includes(user.role)
              ? "/admin"
              : "/employee/role-dashboard";
          res.redirect(`/login?githubToken=${encodeURIComponent(plainToken)}&next=${encodeURIComponent(redirectPath)}`);
        });
      })(req, res, next);
    });

    app.get("/api/auth/github/status", (_req, res) => res.json({ enabled: GITHUB_ENABLED }));
  }
  // ────────────────────────────────────────────────────────────────────────────

  app.use("/uploads", express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".weba") res.setHeader("Content-Type", "audio/webm");
      else if (ext === ".oga") res.setHeader("Content-Type", "audio/ogg");
      else if (ext === ".m4a") res.setHeader("Content-Type", "audio/mp4");
      else if (ext === ".opus") res.setHeader("Content-Type", "audio/ogg; codecs=opus");
    },
  }));

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

  app.post("/api/upload/large", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!["admin", "manager", "employee"].includes((req.user as any).role)) return res.sendStatus(403);
    uploadLarge.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "حجم الملف كبير جداً (الحد الأقصى 500 ميغابايت)" });
        return res.status(400).json({ error: translateError(err) });
      }
      if (err) return res.status(400).json({ error: translateError(err) });
      if (!req.file) return res.status(400).json({ error: "لم يتم اختيار أي ملف" });
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.originalname, size: req.file.size });
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

      // Check if phone already exists
      const incomingPhone = req.body.phone ? String(req.body.phone).trim() : "";
      if (incomingPhone) {
        const { UserModel: UModel } = await import("./models");
        const existingByPhone = await UModel.findOne({ phone: incomingPhone });
        if (existingByPhone) {
          return res.status(400).json({ error: "رقم الجوال مستخدم من قبل" });
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
          sendAdminNewClientEmail("info@qiroxstudio.online", user.fullName || user.username, user.email, (user as any).phone || "", "التسجيل الذاتي").catch(console.error);
          sendAdminNewClientEmail("qiroxsystem@gmail.com", user.fullName || user.username, user.email, (user as any).phone || "", "التسجيل الذاتي").catch(console.error);
        }
        res.status(201).json({ ...sanitizeUser(user), emailVerified: false, needsVerification: true });
      });
    } catch (err) {
      next(err);
    }
  });

  // Admin users list (Only for admin)
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    const { UserModel } = await import("./models");
    const page = parseInt(req.query.page as string) || 0;
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
    const search = (req.query.search as string || "").trim();
    const roleFilter = req.query.role as string;
    if (page > 0) {
      const filter: any = {};
      if (search) filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
      if (roleFilter && roleFilter !== 'all') filter.role = roleFilter;
      const total = await UserModel.countDocuments(filter);
      const docs = await UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      return res.json({ data: sanitizeUser(docs), total, page, totalPages: Math.ceil(total / limit) });
    }
    const users = await storage.getUsers();
    res.json(sanitizeUser(users));
  });

  const allowedRoles = ["manager", "accountant", "sales_manager", "sales", "developer", "designer", "support", "client"];
  const userFieldsWhitelist = ["username", "password", "email", "fullName", "role", "phone", "avatarUrl", "instagram", "twitter", "linkedin", "snapchat", "tiktok", "youtube", "jobTitle", "bio"];

  app.post("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) {
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
      const { UserModel: UM2 } = await import("./models");
      const normPhone = phone ? String(phone).trim() : "";
      if (normPhone) {
        const dupPhone = await UM2.findOne({ phone: normPhone });
        if (dupPhone) return res.status(400).json({ error: "رقم الجوال مستخدم من قبل" });
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username: String(username).trim(),
        password: hashedPassword,
        email: String(email).trim(),
        fullName: String(fullName).trim(),
        role,
        phone: normPhone || undefined,
      });
      res.status(201).json(sanitizeUser(user));
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) {
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
      if (sanitized.phone) {
        const { UserModel: UM3 } = await import("./models");
        const mongoose = await import("mongoose");
        const dupPhone = await UM3.findOne({ phone: sanitized.phone, _id: { $ne: new mongoose.Types.ObjectId(req.params.id) } });
        if (dupPhone) return res.status(400).json({ error: "رقم الجوال مستخدم من قبل" });
      }
      const user = await storage.updateUser(req.params.id, sanitized);
      if (!user) return res.sendStatus(404);
      invalidateUserCache(req.params.id);
      res.json(sanitizeUser(user));
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  app.post("/api/admin/users/:id/avatar", (req, res, next) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    upload.single("file")(req, res, async (err) => {
      if (err instanceof multer.MulterError) return res.status(400).json({ error: "حجم الملف كبير جداً" });
      if (err) return res.status(400).json({ error: translateError(err) });
      if (!req.file) return res.status(400).json({ error: "لم يتم اختيار ملف" });
      try {
        const avatarUrl = `/uploads/${req.file.filename}`;
        const user = await storage.updateUser(req.params.id, { avatarUrl });
        if (!user) return res.sendStatus(404);
        res.json({ avatarUrl, user: sanitizeUser(user) });
      } catch (e: any) {
        res.status(500).json({ error: translateError(e) });
      }
    });
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const callerRole = (req.user as any).role;
    const allowedRoles = ["admin", "manager", "employee", "accountant", "support"];
    if (!allowedRoles.includes(callerRole)) return res.sendStatus(403);
    try {
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) return res.sendStatus(404);
      if (targetUser.role === "admin") {
        return res.status(400).json({ error: "لا يمكن حذف حساب المدير" });
      }
      // Non-admin staff can only delete clients
      if (callerRole !== "admin" && targetUser.role !== "client") {
        return res.status(403).json({ error: "يُسمح فقط بحذف حسابات العملاء" });
      }
      await storage.deleteUser(req.params.id);
      res.sendStatus(204);
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  // Admin reset password for any user → auto-generate + send email + return to admin
  app.post("/api/admin/users/:id/reset-password", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) return res.sendStatus(404);
      const rawPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase() + "@Q";
      const hashed = await hashPassword(rawPassword);
      await storage.updateUser(req.params.id, { password: hashed });
      invalidateUserCache(req.params.id);
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

  app.post(api.auth.login.path, loginLimiter, (req, res, next) => {
    import("passport").then((passport) => {
      passport.default.authenticate("local", async (err: any, user: any) => {
        if (err) return next(err);
        if (!user) return res.status(401).send("اسم المستخدم أو كلمة المرور غير صحيحة");
        try {
          const { UserModel } = await import("./models");
          const dbUser = await UserModel.findById(user._id || user.id).select("+totpSecret +recoveryPassphrase totpEnabled emailOtpEnabled recoveryPassphraseEnabled email fullName username");
          const methods: string[] = [];
          if (dbUser?.totpEnabled) methods.push("totp");
          if (dbUser?.emailOtpEnabled) methods.push("email");
          if (dbUser?.recoveryPassphraseEnabled) methods.push("passphrase");
          if (methods.length > 0) {
            const tempToken = crypto.randomBytes(32).toString("hex");
            pending2FA.set(tempToken, { userId: String(dbUser!._id), methods, expiresAt: Date.now() + 10 * 60 * 1000 });
            return res.status(200).json({ requires2FA: true, methods, tempToken });
          }
          req.login(user, (loginErr: any) => {
            if (loginErr) return next(loginErr);
            res.status(200).json(sanitizeUser(user));
          });
        } catch (e: any) {
          console.error("[2FA-check] Error during 2FA check:", e.message);
          return res.status(500).json({ error: "حدث خطأ أثناء التحقق من المصادقة الثنائية" });
        }
      })(req, res, next);
    });
  });

  app.post("/api/auth/verify-2fa", loginLimiter, async (req, res, next) => {
    try {
      const { tempToken, method, code } = req.body;
      if (!tempToken || !method) return res.status(400).json({ error: "بيانات ناقصة" });
      const session = pending2FA.get(tempToken);
      if (!session) return res.status(400).json({ error: "انتهت صلاحية الجلسة، أعد تسجيل الدخول" });
      if (session.expiresAt < Date.now()) { pending2FA.delete(tempToken); return res.status(400).json({ error: "انتهت صلاحية الجلسة، أعد تسجيل الدخول" }); }
      if (!session.methods.includes(method)) return res.status(400).json({ error: "طريقة التحقق غير متوفرة" });

      const { UserModel, OtpModel } = await import("./models");
      const dbUser = await UserModel.findById(session.userId).select("+totpSecret +recoveryPassphrase");
      if (!dbUser) return res.status(400).json({ error: "المستخدم غير موجود" });

      let verified = false;

      if (method === "totp") {
        if (!code || String(code).length !== 6) return res.status(400).json({ error: "أدخل رمز التحقق المكون من 6 أرقام" });
        const speakeasy = await import("speakeasy");
        verified = speakeasy.default.totp.verify({ secret: dbUser.totpSecret, encoding: "base32", token: String(code), window: 2 });
      } else if (method === "email") {
        if (!code || String(code).length !== 6) return res.status(400).json({ error: "أدخل رمز التحقق المكون من 6 أرقام" });
        const latestOtp = await OtpModel.findOne({ email: dbUser.email, type: "2fa_email", used: false }).sort({ createdAt: -1 });
        if (!latestOtp) return res.status(400).json({ error: "لم يتم إرسال رمز، أعد تسجيل الدخول" });
        if (latestOtp.expiresAt < new Date()) return res.status(400).json({ error: "انتهت صلاحية الرمز" });
        if (latestOtp.code !== String(code).trim()) return res.status(400).json({ error: "الرمز غير صحيح" });
        await OtpModel.updateOne({ _id: latestOtp._id }, { used: true });
        verified = true;
      } else if (method === "passphrase") {
        if (!code) return res.status(400).json({ error: "أدخل كلمة الاسترداد" });
        const bcrypt = await import("bcrypt");
        verified = await bcrypt.default.compare(String(code).trim(), dbUser.recoveryPassphrase || "");
      }

      if (!verified) return res.status(400).json({ error: "رمز التحقق غير صحيح" });

      pending2FA.delete(tempToken);
      const safeUser = await UserModel.findById(session.userId);
      if (!safeUser) return res.status(400).json({ error: "المستخدم غير موجود" });
      req.login(safeUser, (loginErr: any) => {
        if (loginErr) return next(loginErr);
        res.status(200).json(sanitizeUser(safeUser));
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/resend-2fa-email", otpLimiter, async (req, res) => {
    try {
      const { tempToken } = req.body;
      if (!tempToken) return res.status(400).json({ error: "بيانات ناقصة" });
      const session = pending2FA.get(tempToken);
      if (!session || !session.methods.includes("email")) return res.status(400).json({ error: "الجلسة غير صالحة" });
      if (session.expiresAt < Date.now()) { pending2FA.delete(tempToken); return res.status(400).json({ error: "انتهت صلاحية الجلسة، أعد تسجيل الدخول" }); }
      const { UserModel, OtpModel } = await import("./models");
      const user = await UserModel.findById(session.userId);
      if (!user?.email) return res.status(400).json({ error: "البريد غير متوفر" });
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await OtpModel.updateMany({ email: user.email, used: false, type: "2fa_email" }, { used: true });
      await OtpModel.create({ email: user.email, code, expiresAt, type: "2fa_email" });
      sendLoginOtpEmail(user.email, user.fullName || user.username, code, req.headers["user-agent"] as string).catch(console.error);
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
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
    const { ipAddress, location, checkInNotes } = req.body;
    const { AttendanceModel, UserModel, NotificationModel, EmployeeProfileModel } = await import("./models");
    const { pushToUser } = await import("./ws");
    const existing = await AttendanceModel.findOne({ userId: user.id, checkOut: null });
    if (existing) return res.status(400).json({ error: "لديك جلسة حضور نشطة بالفعل" });
    const attendance = await AttendanceModel.create({
      userId: user.id,
      checkIn: new Date(),
      ipAddress,
      location,
      checkInNotes: checkInNotes || "",
      locationHistory: location ? [{ ...location, timestamp: new Date() }] : [],
      lastActivityAt: new Date(),
    });
    // Notify admin and manager
    try {
      const empProfile = await EmployeeProfileModel.findOne({ userId: user.id });
      const managers = await UserModel.find({ role: { $in: ['admin', 'manager'] } });
      const fullUser = await UserModel.findById(user.id);
      const locationStr = location ? ` (${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)})` : '';
      for (const mgr of managers) {
        if (empProfile?.managerId && String(mgr._id) !== String(empProfile.managerId) && mgr.role !== 'admin') continue;
        await NotificationModel.create({
          userId: mgr._id,
          type: 'attendance',
          title: `تسجيل حضور: ${fullUser?.fullName || user.username}`,
          body: `سجّل حضوره في ${new Date().toLocaleTimeString('ar-SA')}${locationStr}`,
          link: '/admin/attendance',
          icon: '✅',
        });
        pushToUser(String(mgr._id), { type: 'notification', title: 'حضور موظف', body: `${fullUser?.fullName || user.username} سجّل حضوره` });
      }
    } catch {}
    res.json(attendance);
  });

  app.post("/api/attendance/check-out", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { checkOutNotes, achievements } = req.body;
    const { AttendanceModel, UserModel, NotificationModel, EmployeeProfileModel } = await import("./models");
    const { pushToUser } = await import("./ws");
    const latest = await AttendanceModel.findOne({ userId: user.id, checkOut: null });
    if (!latest) return res.status(400).json({ error: "لا توجد جلسة نشطة" });
    const checkOut = new Date();
    const workHours = (checkOut.getTime() - latest.checkIn.getTime()) / (1000 * 60 * 60);
    await AttendanceModel.updateOne({ _id: latest._id }, { $set: {
      checkOut,
      workHours: Number(workHours.toFixed(2)),
      checkOutNotes: checkOutNotes || "",
      achievements: achievements || "",
    }});
    const updated = await AttendanceModel.findById(latest._id);
    // Notify admin and manager
    try {
      const empProfile = await EmployeeProfileModel.findOne({ userId: user.id });
      const managers = await UserModel.find({ role: { $in: ['admin', 'manager'] } });
      const fullUser = await UserModel.findById(user.id);
      for (const mgr of managers) {
        if (empProfile?.managerId && String(mgr._id) !== String(empProfile.managerId) && mgr.role !== 'admin') continue;
        await NotificationModel.create({
          userId: mgr._id,
          type: 'attendance',
          title: `انصراف: ${fullUser?.fullName || user.username}`,
          body: `انصرف بعد ${workHours.toFixed(1)} ساعة${achievements ? ' — ' + achievements.slice(0, 60) : ''}`,
          link: '/admin/attendance',
          icon: '🔴',
        });
        pushToUser(String(mgr._id), { type: 'notification', title: 'انصراف موظف', body: `${fullUser?.fullName || user.username} انصرف` });
      }
    } catch {}
    res.json(updated);
  });

  app.post("/api/attendance/ping", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { location } = req.body;
    const { AttendanceModel } = await import("./models");
    const latest = await AttendanceModel.findOne({ userId: user.id, checkOut: null });
    if (!latest) return res.status(400).json({ error: "لا توجد جلسة نشطة" });
    const update: any = { lastActivityAt: new Date() };
    if (location?.lat && location?.lng) {
      update.$push = { locationHistory: { lat: location.lat, lng: location.lng, timestamp: new Date() } };
    }
    await AttendanceModel.updateOne({ _id: latest._id }, { $set: { lastActivityAt: new Date() }, ...(update.$push ? { $push: update.$push } : {}) });
    res.json({ ok: true });
  });

  app.get("/api/attendance/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { AttendanceModel } = await import("./models");
    const latest = await AttendanceModel.findOne({ userId: user.id }).sort({ createdAt: -1 });
    res.json(latest || null);
  });

  app.patch("/api/attendance/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    if (!['admin', 'manager'].includes(me.role)) return res.sendStatus(403);
    const { AttendanceModel } = await import("./models");
    const updated = await AttendanceModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(updated);
  });

  app.get("/api/admin/attendance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    if (!['admin', 'manager'].includes(me.role)) return res.sendStatus(403);
    const { AttendanceModel, UserModel, EmployeeProfileModel } = await import("./models");
    const nonClients = await UserModel.find({ role: { $ne: 'client' } }, 'id fullName username role avatarUrl email');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const result = await Promise.all(nonClients.map(async (u: any) => {
      const todayAtt = await AttendanceModel.findOne({ userId: u._id, checkIn: { $gte: today } }).sort({ createdAt: -1 });
      const recentRecords = await AttendanceModel.find({ userId: u._id }).sort({ createdAt: -1 }).limit(7);
      const profile = await EmployeeProfileModel.findOne({ userId: u._id });
      return { user: u, todayAttendance: todayAtt, recentRecords, profile };
    }));
    res.json(result);
  });

  // === SERVICES API ===
  app.get(api.services.list.path, async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  app.get(api.services.get.path, async (req, res) => {
    const service = await storage.getService(String(req.params.id));
    if (!service) return res.sendStatus(404);
    res.json(service);
  });

  // === ADMIN SERVICES API ===
  app.post("/api/admin/services", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    const service = await storage.createService(req.body);
    res.status(201).json(service);
  });

  app.patch("/api/admin/services/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    const service = await storage.updateService(req.params.id, req.body);
    res.json(service);
  });

  app.delete("/api/admin/services/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    await storage.deleteService(req.params.id);
    res.sendStatus(204);
  });

  // === CONTACT FORM ===
  app.post("/api/contact", contactLimiter, async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;
      if (!name || !email || !phone || !message) return res.status(400).json({ error: "يرجى تعبئة جميع الحقول المطلوبة" });
      const safeName = escapeHtml(String(name).trim().slice(0, 200));
      const safeEmail = escapeHtml(String(email).trim().slice(0, 200));
      const safePhone = escapeHtml(String(phone).trim().slice(0, 20));
      const safeSubject = escapeHtml(String(subject || "").trim().slice(0, 300));
      const safeMessage = escapeHtml(String(message).trim().slice(0, 5000));
      const { ContactMessageModel } = await import("./models");
      await ContactMessageModel.create({ name: safeName, email: safeEmail, phone: safePhone, subject: safeSubject, message: safeMessage });
      await sendDirectEmail("info@qiroxstudio.online", "QIROX", safeSubject || "رسالة جديدة من نموذج التواصل", `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#111;border-bottom:2px solid #eee;padding-bottom:12px;">رسالة جديدة من نموذج التواصل</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">الاسم:</td><td style="padding:8px 0;color:#111;">${safeName}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">البريد:</td><td style="padding:8px 0;color:#111;">${safeEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">الجوال:</td><td style="padding:8px 0;color:#111;" dir="ltr">${safePhone}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">الموضوع:</td><td style="padding:8px 0;color:#111;">${safeSubject || '—'}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;">
            <p style="color:#111;line-height:1.7;white-space:pre-wrap;">${safeMessage}</p>
          </div>
          <p style="color:#999;font-size:12px;margin-top:24px;">تم الإرسال من موقع QIROX Studio</p>
        </div>
      `);
      sendDirectEmail("qiroxsystem@gmail.com", "QIROX", safeSubject || "رسالة جديدة من نموذج التواصل", `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#111;border-bottom:2px solid #eee;padding-bottom:12px;">رسالة جديدة من نموذج التواصل</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">الاسم:</td><td style="padding:8px 0;color:#111;">${safeName}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">البريد:</td><td style="padding:8px 0;color:#111;">${safeEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">الجوال:</td><td style="padding:8px 0;color:#111;" dir="ltr">${safePhone}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold;">الموضوع:</td><td style="padding:8px 0;color:#111;">${safeSubject || '—'}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;">
            <p style="color:#111;line-height:1.7;white-space:pre-wrap;">${safeMessage}</p>
          </div>
          <p style="color:#999;font-size:12px;margin-top:24px;">تم الإرسال من موقع QIROX Studio</p>
        </div>
      `).catch(console.error);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: "فشل إرسال الرسالة، يرجى المحاولة مرة أخرى" }); }
  });

  // === ADMIN CONTACT MESSAGES ===
  app.get("/api/admin/contact-messages", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { ContactMessageModel } = await import("./models");
      const msgs = await ContactMessageModel.find().sort({ createdAt: -1 }).limit(500).lean();
      res.json(msgs.map((m: any) => ({ ...m, id: m._id?.toString() })));
    } catch (err) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/admin/contact-messages/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ error: "معرّف غير صالح" });
      const { ContactMessageModel } = await import("./models");
      const allowedStatuses = ["new", "read", "replied", "archived"];
      const update: any = {};
      if (req.body.read !== undefined) { update.read = !!req.body.read; if (req.body.read) update.status = "read"; }
      if (req.body.status) {
        if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ error: "حالة غير صالحة" });
        update.status = req.body.status;
      }
      if (req.body.adminReply && typeof req.body.adminReply === "string") {
        update.adminReply = String(req.body.adminReply).trim().slice(0, 5000);
        update.repliedAt = new Date();
        update.status = "replied";
      }
      const doc = await ContactMessageModel.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!doc) return res.status(404).json({ error: "الرسالة غير موجودة" });
      res.json(doc);
    } catch (err) { res.status(500).json({ error: translateError(err) }); }
  });

  app.delete("/api/admin/contact-messages/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ error: "معرّف غير صالح" });
      const { ContactMessageModel } = await import("./models");
      await ContactMessageModel.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: translateError(err) }); }
  });

  // === ADMIN ORDERS API ===
  app.get("/api/admin/orders", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") {
      return res.sendStatus(403);
    }
    const { OrderModel } = await import("./models");
    const page = parseInt(req.query.page as string) || 0;
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
    const search = (req.query.search as string || "").trim();
    const statusFilter = req.query.status as string;
    const filter: any = {};
    if (search) filter.$or = [
      { businessName: { $regex: search, $options: 'i' } },
      { serviceType: { $regex: search, $options: 'i' } },
      { planTier: { $regex: search, $options: 'i' } },
    ];
    if (statusFilter && statusFilter !== 'all') filter.status = statusFilter;
    if (page > 0) {
      const total = await OrderModel.countDocuments(filter);
      const docs = await OrderModel.find(filter)
        .populate('userId', 'fullName email phone username')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      const data = docs.map((o: any) => ({ ...o, id: o._id.toString(), client: o.userId }));
      return res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
    }
    // Backward-compat: no page param → return array (capped at 500)
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

  // ═══════════════════════════════════════════════
  // === ORDER EXPENSES & PROFIT TRACKING ===
  // ═══════════════════════════════════════════════
  app.get("/api/admin/orders/:id/expenses", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { OrderExpenseModel } = await import("./models");
    const expenses = await (OrderExpenseModel as any).find({ orderId: req.params.id }).populate("addedBy", "fullName username").sort({ createdAt: -1 });
    res.json(expenses);
  });

  app.post("/api/admin/orders/:id/expenses", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { OrderExpenseModel } = await import("./models");
    const { category, description, amount, currency } = req.body;
    if (!description || !amount) return res.status(400).json({ error: "الوصف والمبلغ مطلوبان" });
    const expense = await (OrderExpenseModel as any).create({
      orderId: req.params.id,
      category: category || "other",
      description,
      amount: Number(amount),
      currency: currency || "SAR",
      addedBy: (req.user as any)._id,
    });
    res.status(201).json(expense);
  });

  app.delete("/api/admin/expenses/:expenseId", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager", "accountant"].includes((req.user as any).role)) return res.sendStatus(403);
    const { OrderExpenseModel } = await import("./models");
    await (OrderExpenseModel as any).findByIdAndDelete(req.params.expenseId);
    res.json({ ok: true });
  });

  app.get("/api/admin/profit-report", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { OrderExpenseModel, OrderModel } = await import("./models");
    const completedOrders = await (OrderModel as any).find({
      status: { $in: ["completed", "in_progress", "approved"] },
      totalAmount: { $gt: 0 },
    }).populate("userId", "fullName username businessName").sort({ createdAt: -1 });

    const result = await Promise.all(completedOrders.map(async (order: any) => {
      const expenses = await (OrderExpenseModel as any).find({ orderId: order._id });
      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      const revenue = order.totalAmount || 0;
      const netProfit = revenue - totalExpenses;
      const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      return {
        orderId: order.id,
        orderCreatedAt: order.createdAt,
        status: order.status,
        client: order.userId,
        businessName: order.businessName || order.userId?.fullName,
        serviceType: order.serviceType,
        revenue,
        totalExpenses,
        netProfit,
        margin: Math.round(margin * 10) / 10,
        expenseCount: expenses.length,
        expenses,
      };
    }));

    const totals = result.reduce((acc, r) => ({
      revenue: acc.revenue + r.revenue,
      expenses: acc.expenses + r.totalExpenses,
      netProfit: acc.netProfit + r.netProfit,
    }), { revenue: 0, expenses: 0, netProfit: 0 });

    res.json({ orders: result, totals });
  });

  // === EMPLOYEE LIST (for assignment dropdowns) ===
  app.get("/api/employees", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const allUsers = await storage.getUsers();
    const employees = allUsers.filter((u: any) => u.role !== "client");
    res.json(employees.map((u: any) => ({ id: u.id, fullName: u.fullName, username: u.username, role: u.role })));
  });

  app.get("/api/users/clients", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const allUsers = await storage.getUsers();
    const clients = allUsers.filter((u: any) => u.role === "client");
    res.json(clients.map((u: any) => ({ id: u.id, fullName: u.fullName, username: u.username, email: u.email })));
  });

  app.get("/api/admin/employees", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const allUsers = await storage.getUsers();
    let employees = allUsers.filter((u: any) => u.role !== "client");
    const rolesParam = (req.query.roles as string);
    if (rolesParam) {
      const allowed = rolesParam.split(",").map((r: string) => r.trim());
      employees = employees.filter((u: any) => allowed.includes(u.role));
    }
    res.json(employees.map((u: any) => ({ id: u.id, fullName: u.fullName, username: u.username, role: u.role, email: u.email })));
  });

  app.get("/api/public/team", async (_req, res) => {
    try {
      const { UserModel } = await import("./models");
      const team = await UserModel.find({ role: { $nin: ["client", "customer"] } })
        .select("fullName role jobTitle avatarUrl instagram twitter linkedin snapchat tiktok youtube bio")
        .lean();
      res.json(team);
    } catch { res.status(500).json([]); }
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

    // ── Server-side totalAmount validation from cart ─────────────
    const { CartModel, UserModel, WalletTransactionModel } = await import("./models");
    const cart = await CartModel.findOne({ userId: String(user.id) }).lean();
    let serverTotal: number | null = null;
    if (cart && Array.isArray(cart.items) && cart.items.length > 0) {
      const subtotal = cart.items.reduce((s: number, i: any) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
      const discount = Number(cart.discountAmount) || 0;
      const afterDiscount = Math.max(0, subtotal - discount);
      serverTotal = parseFloat(afterDiscount.toFixed(2));
      const clientTotal = parseFloat(Number(req.body.totalAmount || 0).toFixed(2));
      if (Math.abs(clientTotal - serverTotal) > 1.5) {
        return res.status(400).json({ error: `إجمالي الطلب غير مطابق. المتوقع: ${serverTotal.toLocaleString()} ر.س` });
      }
    }

    // ── Wallet validation BEFORE creating order ───────────────────
    const orderTotal = serverTotal ?? parseFloat(Number(req.body.totalAmount || 0).toFixed(2));
    let walletAmountUsed = Number(req.body.walletAmountUsed || 0);
    const walletPayPin = req.body.walletPayPin as string | undefined;
    let walletDeducted = 0;

    // Cap walletAmountUsed to order total — prevent over-deduction
    if (walletAmountUsed > orderTotal + 0.01) {
      walletAmountUsed = orderTotal;
    }

    if (walletAmountUsed > 0) {
      const bcrypt = await import("bcrypt");
      // PIN validation: if card has a PIN set, it must be provided and correct
      const dbUser = await UserModel.findById(String(user.id)).select("+walletPin");
      if (dbUser?.walletPin) {
        if (!walletPayPin) {
          return res.status(400).json({ error: "wallet_pin_required", message: "يجب إدخال كلمة مرور المحفظة للدفع بها" });
        }
        const pinOk = await bcrypt.compare(String(walletPayPin), dbUser.walletPin);
        if (!pinOk) {
          return res.status(400).json({ error: "wallet_pin_invalid", message: "كلمة مرور المحفظة غير صحيحة" });
        }
      }
      const available = await getWalletBalance(String(user.id));
      if (walletAmountUsed > available + 0.01) {
        return res.status(400).json({ error: `الرصيد غير كافٍ في المحفظة. الرصيد المتاح: ${available.toLocaleString()} ر.س` });
      }
      walletDeducted = walletAmountUsed;
    }

    const ALLOWED_ORDER_FIELDS = [
      "serviceId","serviceType","planTier","planPeriod","planSegment",
      "businessName","phone","notes","items",
      "projectType","sector","competitors","visualStyle","favoriteExamples",
      "requiredFunctions","requiredSystems","siteLanguage",
      "whatsappIntegration","socialIntegration","hasLogo","needsLogoDesign",
      "hasHosting","hasDomain",
      "logoUrl","brandIdentityUrl","filesUrl","contentUrl","imagesUrl",
      "videoUrl","accessCredentials","files","requirements",
      "paymentMethod","paymentProofUrl","totalAmount","walletAmountUsed",
    ];
    const safeBody: Record<string, unknown> = {};
    for (const key of ALLOWED_ORDER_FIELDS) {
      if (key in req.body) safeBody[key] = req.body[key];
    }

    // Auto-mark deposit as paid for instant payment methods (PayPal captured, wallet, mixed wallet+paypal)
    const instantPayMethods = ["paypal", "wallet", "mixed"];
    if (instantPayMethods.includes(safeBody.paymentMethod as string)) {
      safeBody.isDepositPaid = true;
      safeBody.paidAt = new Date();
    }

    const order = await storage.createOrder({ ...safeBody, userId: String(user.id), status: "pending" } as any);

    // Deduct wallet atomically after order creation
    if (walletDeducted > 0) {
      try {
        const debitAmt = parseFloat(walletDeducted.toFixed(2));
        const ok = await atomicWalletDebit(String(user.id), debitAmt);
        if (ok) {
          await WalletTransactionModel.create({
            userId: String(user.id), type: 'debit', amount: debitAmt,
            description: `دفع طلب #${String(order.id)} من محفظة كيروكس باي`,
            orderId: String(order.id), addedBy: String(user.id), note: 'wallet_payment',
          });
        } else {
          await storage.updateOrder(String(order.id), { notes: ((order as any).notes || '') + ' [تحذير: رصيد المحفظة غير كافٍ — يرجى مراجعة الدفع]' } as any).catch(() => {});
        }
      } catch (wErr) {
        console.error("[wallet-deduct]", wErr);
        await storage.updateOrder(String(order.id), { notes: ((order as any).notes || '') + ' [تحذير: فشل خصم المحفظة تلقائياً — يرجى المراجعة]' } as any).catch(() => {});
      }
    }
    const items: string[] = (req.body.items || []).map((i: any) => i.nameAr || i.name || "عنصر").filter(Boolean);
    if ((user as any).email) {
      sendOrderConfirmationEmail((user as any).email, (user as any).fullName || (user as any).username, String(order.id), items).catch(console.error);
      const { NotificationModel } = await import("./models");
      await NotificationModel.create({ userId: user.id, type: 'order', title: 'تم استلام طلبك', body: `تم استلام طلبك بنجاح، سنتواصل معك قريباً.`, link: '/dashboard', icon: '📦' });
    }
    const _clientName = (user as any).fullName || (user as any).username;
    const _clientEmail = (user as any).email || "";
    sendAdminNewOrderEmail("info@qiroxstudio.online", _clientName, _clientEmail, String(order.id), items, req.body.totalAmount).catch(console.error);
    sendAdminNewOrderEmail("qiroxsystem@gmail.com", _clientName, _clientEmail, String(order.id), items, req.body.totalAmount).catch(console.error);

    // Auto-create shipment for each physical product item
    try {
      const { DeviceShipmentModel, NotificationModel } = await import("./models");
      const physicalTypes = ["product", "gift"];
      const physicalItems = (req.body.items || []).filter((it: any) => physicalTypes.includes(it.type));
      for (const item of physicalItems) {
        const shipping = item.config?.shipping || {};
        await DeviceShipmentModel.create({
          cartOrderId: String(order.id),
          clientId: user.id,
          clientName: _clientName,
          clientEmail: _clientEmail,
          clientPhone: shipping.phone || (user as any).phone || "",
          productId: item.refId || item.id || new (await import("mongoose")).default.Types.ObjectId(),
          productName: item.nameAr || item.name || "منتج",
          quantity: item.qty || 1,
          totalPrice: (item.price || 0) * (item.qty || 1),
          shippingAddress: {
            name: shipping.recipientName || _clientName,
            phone: shipping.phone || "",
            city: shipping.city || "",
            district: shipping.district || "",
            street: shipping.address || "",
            postalCode: shipping.postalCode || "",
            country: "SA",
          },
          status: "pending",
        });
      }
      if (physicalItems.length > 0) {
        await NotificationModel.create({
          userId: user.id,
          type: 'order',
          title: 'تم إنشاء طلب شحن',
          body: `تم إنشاء طلب شحن لـ ${physicalItems.length} منتج. سيتم التواصل معك قريباً.`,
          link: '/devices',
          icon: '🚚',
        });
      }
    } catch (shipErr) {
      console.error("[auto-shipment]", shipErr);
    }

    res.status(201).json(order);
  });

  // Client: attach payment proof to own order
  app.patch("/api/orders/:id/proof", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const { paymentProofUrl } = req.body;
    if (!paymentProofUrl) return res.status(400).json({ error: "رابط الإيصال مطلوب" });
    try {
      const { OrderModel, NotificationModel } = await import("./models");
      const order = await OrderModel.findById(req.params.id);
      if (!order) return res.status(404).json({ error: "الطلب غير موجود" });
      if (String(order.userId) !== String(user.id)) return res.sendStatus(403);
      order.paymentProofUrl = paymentProofUrl;
      await order.save();
      // Notify admins — use forAdmins flag (userId: "admin" is invalid ObjectId)
      await NotificationModel.create({
        forAdmins: true,
        type: "payment",
        title: "إيصال دفع جديد",
        body: `أرفق العميل ${user.fullName || user.username} إيصال التحويل للطلب #${req.params.id}`,
        link: `/admin/orders/${req.params.id}`,
        icon: "🧾",
      }).catch(console.error);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "فشل رفع الإيصال" });
    }
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
      // Notify client that their project has been created
      try {
        if ((project as any).clientId) {
          const { NotificationModel } = await import("./models");
          await NotificationModel.create({
            userId: String((project as any).clientId), type: 'project',
            title: 'تم إنشاء مشروعك 🚀',
            body: `بدأ العمل على مشروع "${(project as any).name || 'مشروعك الجديد'}" — يمكنك تتبع التقدم الآن`,
            link: `/projects/${(project as any)._id}`, icon: '🚀',
          });
        }
      } catch (_) {}
      res.status(201).json(project);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.get(api.projects.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const project = await storage.getProject(String(req.params.id));
    if (!project) return res.sendStatus(404);
    res.json(project);
  });

  app.patch(api.projects.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.projects.update.input.parse(req.body);
    const oldProject = await storage.getProject(String(req.params.id));
    const project = await storage.updateProject(String(req.params.id), input);
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

    // ── Auto-start subscription when project reaches "delivery" status ──
    try {
      const statusChanged = input.status && oldProject?.status !== input.status;
      if (statusChanged && input.status === "delivery" && (project as any).clientId) {
        const { UserModel, NotificationModel } = await import("./models");
        const client = await UserModel.findById((project as any).clientId);
        if (client && (client as any).subscriptionPeriod && !(client as any).subscriptionStartDate) {
          // Calculate duration based on plan
          const period = (client as any).subscriptionPeriod as string;
          const durationDays = period === "monthly" ? 30 : period === "6months" ? 180 : 365;
          const startDate = new Date();
          const expiresAt = new Date(startDate.getTime() + durationDays * 86400000);
          await UserModel.findByIdAndUpdate(client._id, {
            $set: { subscriptionStartDate: startDate, subscriptionExpiresAt: expiresAt, subscriptionStatus: "active" },
          });
          console.log(`[Subscription] Auto-started for client ${client._id} on project delivery. Expires: ${expiresAt.toISOString()}`);
          // Notify all managers/admins
          const staff = await UserModel.find({ role: { $in: ["admin","manager"] } }).select("_id").lean();
          const clientName = (client as any).fullName || (client as any).username || "العميل";
          const projectName = (project as any).name || "المشروع";
          for (const emp of staff) {
            await NotificationModel.create({
              userId: String(emp._id), type: 'subscription',
              title: `🚀 بدأ اشتراك ${clientName}`,
              body: `تم تسليم مشروع "${projectName}" — بدأ العد التنازلي للاشتراك (${durationDays} يوم)`,
              link: '/admin/subscription-plans', icon: '📅',
            }).catch(() => {});
            pushNotification(String(emp._id), {
              title: `بدأ اشتراك ${clientName}`,
              body: `تم تسليم "${projectName}" — ينتهي الاشتراك: ${expiresAt.toLocaleDateString("ar-SA")}`,
              icon: '📅', link: '/admin/subscription-plans',
            });
          }
        }
      }
    } catch (e) { console.error("[Subscription] auto-start error:", e); }
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

  // ── Admin: set/update usage guide for a project ──
  app.patch("/api/admin/projects/:id/usage-guide", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const role = (req.user as any).role;
    if (role === "client") return res.sendStatus(403);
    const { ProjectModel } = await import("./models");
    const { title, description, files } = req.body;
    const guide: any = { updatedAt: new Date() };
    if (title !== undefined) guide.title = title || "شرح استخدام النظام";
    if (description !== undefined) guide.description = description;
    if (Array.isArray(files)) guide.files = files;
    const project = await ProjectModel.findByIdAndUpdate(
      req.params.id,
      { $set: { usageGuide: { ...guide } } },
      { new: true }
    ).lean();
    if (!project) return res.sendStatus(404);
    res.json({ success: true, usageGuide: (project as any).usageGuide });
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
    if ((req.user as any).role === "client") return res.sendStatus(403);
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

  // === PROJECT FEATURES API ===
  app.get("/api/projects/:projectId/features", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { ProjectFeatureModel } = await import("./models");
    try {
      const features = await ProjectFeatureModel.find({ projectId: req.params.projectId })
        .populate('assignedTo', 'fullName username role')
        .populate('startedBy', 'fullName username')
        .populate('completedBy', 'fullName username')
        .sort({ order: 1, createdAt: 1 }).lean();
      res.json(features);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.post("/api/projects/:projectId/features", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    if (me.role === 'client') return res.sendStatus(403);
    const { ProjectFeatureModel } = await import("./models");
    try {
      const count = await ProjectFeatureModel.countDocuments({ projectId: req.params.projectId });
      const feature = await ProjectFeatureModel.create({ ...req.body, projectId: req.params.projectId, order: count });
      res.status(201).json(feature);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/projects/:projectId/features/:fid", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { ProjectFeatureModel } = await import("./models");
    try {
      const me = req.user as any;
      const feature = await ProjectFeatureModel.findById(req.params.fid);
      if (!feature) return res.sendStatus(404);
      const updates: any = { ...req.body };
      if (updates.status === 'in_progress' && feature.status !== 'in_progress') {
        updates.startedAt = new Date();
        updates.startedBy = me.id;
      }
      if (updates.status === 'completed' && feature.status !== 'completed') {
        updates.completedAt = new Date();
        updates.completedBy = me.id;
      }
      const updated = await ProjectFeatureModel.findByIdAndUpdate(req.params.fid, updates, { new: true })
        .populate('assignedTo', 'fullName username role')
        .populate('startedBy', 'fullName username')
        .populate('completedBy', 'fullName username');
      res.json(updated);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.delete("/api/projects/:projectId/features/:fid", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    if (me.role === 'client') return res.sendStatus(403);
    const { ProjectFeatureModel } = await import("./models");
    try {
      await ProjectFeatureModel.findByIdAndDelete(req.params.fid);
      res.sendStatus(204);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.post("/api/projects/:projectId/features/reorder", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    if (me.role === 'client') return res.sendStatus(403);
    const { ProjectFeatureModel } = await import("./models");
    try {
      const { ids } = req.body as { ids: string[] };
      await Promise.all(ids.map((id, idx) => ProjectFeatureModel.findByIdAndUpdate(id, { order: idx })));
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.post("/api/projects/:projectId/features/send-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    if (me.role === 'client') return res.sendStatus(403);
    const { ProjectFeatureModel, ProjectModel, UserModel } = await import("./models");
    try {
      const project = await ProjectModel.findById(req.params.projectId).lean() as any;
      if (!project) return res.sendStatus(404);
      const client = await UserModel.findById(project.clientId).lean() as any;
      if (!client?.email) return res.status(400).json({ error: "لا يوجد بريد إلكتروني للعميل" });
      const features = await ProjectFeatureModel.find({ projectId: req.params.projectId }).sort({ order: 1 }).lean() as any[];
      const sent = await sendFeaturesEmail(client.email, client.fullName || client.username, req.body.projectName || project.stagingUrl || `مشروع #${String(project._id).slice(-6)}`, features);
      if (sent) res.json({ ok: true });
      else res.status(500).json({ error: "فشل إرسال البريد" });
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.get("/api/projects/:projectId/features/print", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { ProjectFeatureModel, ProjectModel } = await import("./models");
    try {
      const project = await ProjectModel.findById(req.params.projectId).lean() as any;
      const features = await ProjectFeatureModel.find({ projectId: req.params.projectId })
        .populate('assignedTo', 'fullName username')
        .sort({ order: 1 }).lean() as any[];
      const projectName = req.query.name as string || `مشروع #${String(project?._id).slice(-6)}`;
      const statusLabel = (s: string) => ({ pending: "قيد الانتظار", in_progress: "جارٍ التنفيذ", completed: "مكتملة", cancelled: "ملغاة" }[s] || s);
      const priorityLabel = (p: string) => ({ low: "منخفضة", medium: "متوسطة", high: "عالية", critical: "حرجة" }[p] || p);
      const categoryLabel = (c: string) => ({ feature: "ميزة", design: "تصميم", development: "تطوير", integration: "تكامل", security: "أمان", performance: "أداء", content: "محتوى", other: "أخرى" }[c] || c);
      const completed = features.filter((f: any) => f.status === 'completed').length;
      const pct = features.length > 0 ? Math.round((completed / features.length) * 100) : 0;
      const rows = features.map((f: any, i: number) => `
        <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
          <td class="num">${i + 1}</td>
          <td><strong>${f.title}</strong>${f.description ? `<br><small>${f.description}</small>` : ''}</td>
          <td>${categoryLabel(f.category)}</td>
          <td>${priorityLabel(f.priority)}</td>
          <td>${f.assignedTo?.fullName || f.assignedTo?.username || '—'}</td>
          <td><span class="badge badge-${f.status}">${statusLabel(f.status)}</span></td>
          ${f.completedAt ? `<td>${new Date(f.completedAt).toLocaleDateString('ar-SA')}</td>` : '<td>—</td>'}
        </tr>`).join('');
      const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <title>ملف مميزات ${projectName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', sans-serif; background: #fff; color: #111; padding: 30px; font-size: 13px; direction: rtl; }
    .header { text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #000; }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; margin-bottom: 4px; }
    .project-name { font-size: 18px; font-weight: 700; color: #333; }
    .date { font-size: 11px; color: #888; margin-top: 4px; }
    .summary { display: flex; gap: 20px; margin-bottom: 24px; }
    .stat { flex: 1; background: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px 16px; text-align: center; }
    .stat-val { font-size: 28px; font-weight: 900; color: #000; }
    .stat-lbl { font-size: 11px; color: #666; margin-top: 2px; }
    .progress-bar { height: 8px; background: #e5e5e5; border-radius: 4px; margin: 16px 0; overflow: hidden; }
    .progress-fill { height: 100%; background: #000; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #000; color: #fff; padding: 10px 12px; text-align: right; font-size: 12px; }
    td { padding: 9px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    tr.even td { background: #fafafa; }
    td.num { font-weight: 700; color: #888; width: 36px; }
    td small { color: #666; font-size: 11px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .badge-completed { background: #dcfce7; color: #166534; }
    .badge-in_progress { background: #fef9c3; color: #713f12; }
    .badge-pending { background: #f1f5f9; color: #475569; }
    .badge-cancelled { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #aaa; padding-top: 16px; border-top: 1px solid #eee; }
    @media print { body { padding: 10px; } @page { margin: 12mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">QIROX Studio</div>
    <div class="project-name">ملف مميزات: ${projectName}</div>
    <div class="date">${new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>
  <div class="summary">
    <div class="stat"><div class="stat-val">${features.length}</div><div class="stat-lbl">إجمالي المميزات</div></div>
    <div class="stat"><div class="stat-val">${completed}</div><div class="stat-lbl">مكتملة</div></div>
    <div class="stat"><div class="stat-val">${features.filter((f: any) => f.status === 'in_progress').length}</div><div class="stat-lbl">جارٍ التنفيذ</div></div>
    <div class="stat"><div class="stat-val">${pct}%</div><div class="stat-lbl">نسبة الإنجاز</div></div>
  </div>
  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
  <table>
    <thead><tr><th>#</th><th>الميزة</th><th>الفئة</th><th>الأولوية</th><th>المسؤول</th><th>الحالة</th><th>تاريخ الإنجاز</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">QIROX Studio — وثيقة مميزات المشروع — ${new Date().toLocaleDateString('ar-SA')}</div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // === PROJECT ISSUES API ===
  app.get("/api/projects/:projectId/issues", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { ProjectIssueModel } = await import("./models");
    try {
      const issues = await ProjectIssueModel.find({ projectId: req.params.projectId })
        .populate('fromUserId', 'fullName username role profilePhotoUrl avatarConfig')
        .populate('toUserId', 'fullName username role profilePhotoUrl avatarConfig')
        .sort({ createdAt: -1 }).lean();
      res.json(issues);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.post("/api/projects/:projectId/issues", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { ProjectIssueModel, ProjectModel, ProjectMemberModel, UserModel } = await import("./models");
    try {
      const me = req.user as any;
      const project = await ProjectModel.findById(req.params.projectId).lean() as any;
      if (!project) return res.sendStatus(404);
      let toUserId = req.body.toUserId;
      if (!toUserId) {
        if (me.role === 'client') {
          const members = await ProjectMemberModel.find({ projectId: req.params.projectId }).lean() as any[];
          if (members.length > 0) toUserId = members[0].userId;
          else if (project.managerId) toUserId = project.managerId;
        } else {
          toUserId = project.clientId;
        }
      }
      const issue = await ProjectIssueModel.create({ ...req.body, projectId: req.params.projectId, fromUserId: me.id, toUserId });
      res.status(201).json(issue);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/projects/:projectId/issues/:iid", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { ProjectIssueModel } = await import("./models");
    try {
      const updates: any = { ...req.body };
      if (updates.status === 'resolved') updates.resolvedAt = new Date();
      const updated = await ProjectIssueModel.findByIdAndUpdate(req.params.iid, updates, { new: true })
        .populate('fromUserId', 'fullName username role profilePhotoUrl avatarConfig')
        .populate('toUserId', 'fullName username role profilePhotoUrl avatarConfig');
      res.json(updated);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // === PROJECT MEETINGS API ===
  app.get("/api/projects/:projectId/meetings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { MeetingRequestModel } = await import("./models");
    try {
      const meetings = await MeetingRequestModel.find({ projectId: req.params.projectId })
        .populate('clientId', 'fullName username email')
        .populate('employeeId', 'fullName username role')
        .sort({ createdAt: -1 }).lean();
      res.json(meetings);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.post("/api/projects/:projectId/meetings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { MeetingRequestModel, ProjectModel, ProjectMemberModel } = await import("./models");
    try {
      const me = req.user as any;
      const project = await ProjectModel.findById(req.params.projectId).lean() as any;
      if (!project) return res.sendStatus(404);
      let employeeId = req.body.employeeId;
      if (!employeeId) {
        const members = await ProjectMemberModel.find({ projectId: req.params.projectId }).lean() as any[];
        if (members.length > 0) employeeId = members[0].userId;
        else if (project.managerId) employeeId = project.managerId;
      }
      const meeting = await MeetingRequestModel.create({
        ...req.body,
        projectId: req.params.projectId,
        clientId: me.role === 'client' ? me.id : project.clientId,
        employeeId,
      });
      res.status(201).json(meeting);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/projects/:projectId/meetings/:mid", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { MeetingRequestModel } = await import("./models");
    try {
      const updated = await MeetingRequestModel.findByIdAndUpdate(req.params.mid, req.body, { new: true })
        .populate('clientId', 'fullName username email')
        .populate('employeeId', 'fullName username role');
      res.json(updated);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // === WALLET API ===
  app.get("/api/wallet", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { WalletTransactionModel } = await import("./models");
    const userId = user.role === 'client' ? String(user.id) : req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 30));
    const total = await WalletTransactionModel.countDocuments({ userId });
    const txs = await WalletTransactionModel.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const balance = await getWalletBalance(userId);
    // Compute aggregated stats across all transactions (not just paginated)
    // Must cast userId string to ObjectId since aggregate() bypasses Mongoose auto-casting
    const mongoose = await import("mongoose");
    let userObjectId: any;
    try { userObjectId = new mongoose.default.Types.ObjectId(userId); } catch { userObjectId = null; }
    const statsAgg = userObjectId ? await WalletTransactionModel.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } }
    ]) : [];
    const totalCredit = statsAgg.find((a: any) => a._id === 'credit')?.total || 0;
    const totalDebit  = statsAgg.find((a: any) => a._id === 'debit')?.total  || 0;
    const outstanding = parseFloat(Math.max(0, totalDebit - totalCredit).toFixed(2));
    res.json({ transactions: txs, balance, totalDebit, totalCredit, outstanding, total, page, totalPages: Math.ceil(total / limit) });
  });

  app.get("/api/admin/wallet/clients", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { UserModel } = await import("./models");
    const clients = await UserModel.find({ role: 'client' }, 'fullName username email createdAt').sort({ createdAt: -1 });
    res.json(clients);
  });

  app.get("/api/admin/wallet/topup-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as User;
    if ((me as any).role === 'client') return res.sendStatus(403);
    const { WalletTopupModel } = await import("./models");
    const requests = await WalletTopupModel.find().sort({ createdAt: -1 }).populate('userId', 'fullName email username');
    res.json(requests);
  });

  app.post("/api/admin/wallet/topup-approve/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as User;
    if ((me as any).role === 'client') return res.sendStatus(403);
    const { WalletTopupModel, WalletTransactionModel, UserModel } = await import("./models");
    const { sendWalletTopupStatusEmail } = await import("./email");
    const topup = await WalletTopupModel.findById(req.params.id);
    if (!topup) return res.sendStatus(404);
    if (topup.status !== 'pending') return res.status(400).json({ error: "الطلب تمت معالجته بالفعل" });
    await WalletTopupModel.findByIdAndUpdate(req.params.id, {
      status: 'approved', approvedBy: String(me.id), approvedAt: new Date(),
    });
    await WalletTransactionModel.create({
      userId: topup.userId, type: 'credit', amount: topup.amount,
      description: `شحن محفظة Qirox Pay - ${topup.bankName || 'تحويل بنكي'}`,
      addedBy: String(me.id), note: `المرجع: ${topup.bankRef || '-'}`,
    });
    await atomicWalletCredit(String(topup.userId), topup.amount);
    const owner = await UserModel.findById(topup.userId);
    if (owner) await sendWalletTopupStatusEmail(owner.email, owner.fullName, topup.amount, 'approved');
    res.json({ success: true });
  });

  app.post("/api/admin/wallet/topup-reject/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as User;
    if ((me as any).role === 'client') return res.sendStatus(403);
    const { WalletTopupModel, UserModel } = await import("./models");
    const { sendWalletTopupStatusEmail } = await import("./email");
    const topup = await WalletTopupModel.findById(req.params.id);
    if (!topup) return res.sendStatus(404);
    if (topup.status !== 'pending') return res.status(400).json({ error: "الطلب تمت معالجته بالفعل" });
    await WalletTopupModel.findByIdAndUpdate(req.params.id, {
      status: 'rejected', rejectionReason: req.body.reason || '',
    });
    const owner = await UserModel.findById(topup.userId);
    if (owner) await sendWalletTopupStatusEmail(owner.email, owner.fullName, topup.amount, 'rejected', req.body.reason);
    res.json({ success: true });
  });

  app.get("/api/admin/wallet/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { WalletTransactionModel } = await import("./models");
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const total = await WalletTransactionModel.countDocuments({ userId: req.params.userId });
    const txs = await WalletTransactionModel.find({ userId: req.params.userId })
      .populate('addedBy', 'fullName username')
      .populate('orderId', 'serviceType planTier')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const balance = await getWalletBalance(req.params.userId);
    res.json({ transactions: txs, balance, total, page, totalPages: Math.ceil(total / limit) });
  });

  app.post("/api/admin/wallet/transaction", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as User;
    if ((me as any).role === 'client') return res.sendStatus(403);
    const { WalletTransactionModel } = await import("./models");
    const { userId, type, amount, description, orderId, note } = req.body;
    if (!userId || !type || !amount || !description) return res.status(400).json({ error: "بيانات ناقصة" });
    const tx = await WalletTransactionModel.create({
      userId, type, amount: Number(amount), description, orderId: orderId || undefined,
      addedBy: String(me.id), note: note || '',
    });
    if (type === 'credit') await atomicWalletCredit(String(userId), Number(amount));
    else if (type === 'debit') await atomicWalletDebit(String(userId), Number(amount));
    // Notify client about wallet change
    try {
      const { NotificationModel } = await import("./models");
      await NotificationModel.create({
        userId: String(userId), type: 'payment',
        title: type === 'credit' ? `💰 تم إضافة رصيد للمحفظة` : `📤 تم خصم رصيد من المحفظة`,
        body: `${type === 'credit' ? '+' : '-'}${Number(amount).toLocaleString('ar-SA')} ريال — ${description}`,
        link: '/wallet', icon: type === 'credit' ? '💰' : '📤',
      });
    } catch (_) {}
    res.status(201).json(tx);
  });

  app.patch("/api/admin/wallet/transaction/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as User;
    if ((me as any).role === 'client') return res.sendStatus(403);
    const { WalletTransactionModel } = await import("./models");
    const tx = await WalletTransactionModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tx) return res.sendStatus(404);
    res.json(tx);
  });

  app.delete("/api/admin/wallet/transaction/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as User;
    if ((me as any).role === 'client') return res.sendStatus(403);
    const { WalletTransactionModel } = await import("./models");
    await WalletTransactionModel.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  });

  app.post("/api/wallet/pay", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { WalletTransactionModel } = await import("./models");
    const { amount, orderId, description } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: "المبلغ غير صحيح" });
    const debitAmt = parseFloat(Number(amount).toFixed(2));
    const ok = await atomicWalletDebit(String(user.id), debitAmt);
    if (!ok) {
      const available = await getWalletBalance(String(user.id));
      return res.status(400).json({ error: "الرصيد غير كافٍ", available });
    }
    const tx = await WalletTransactionModel.create({
      userId: String(user.id), type: 'debit', amount: debitAmt,
      description: description || `دفع من المحفظة الإلكترونية`,
      orderId: orderId || undefined, addedBy: String(user.id), note: 'wallet_payment',
    });
    const newAvailable = await getWalletBalance(String(user.id));
    res.status(201).json({ success: true, amountUsed: debitAmt, remainingBalance: newAvailable, transactionId: tx._id });
  });

  // === QIROX PAY CARD ROUTES ===
  // Get card info
  app.get("/api/wallet/card", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { UserModel } = await import("./models");
    const dbUser = await UserModel.findById(String(user.id)).select("+walletCardNumber +walletPin +walletCardActive");
    if (!dbUser) return res.sendStatus(404);
    const balance = await getWalletBalance(String(user.id));
    res.json({
      cardNumber: dbUser.walletCardNumber || null,
      cardActive: dbUser.walletCardActive || false,
      hasPin: !!dbUser.walletPin,
      holderName: dbUser.fullName,
      balance,
    });
  });

  // Initialize card (generate card number)
  app.post("/api/wallet/card/init", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { UserModel } = await import("./models");
    const dbUser = await UserModel.findById(String(user.id)).select("+walletCardNumber +walletCardActive");
    if (!dbUser) return res.sendStatus(404);
    if (dbUser.walletCardNumber) return res.json({ cardNumber: dbUser.walletCardNumber, cardActive: dbUser.walletCardActive });
    // Generate unique 16-digit card number prefixed with 4747
    let cardNumber: string;
    let exists = true;
    do {
      const rand = Math.floor(Math.random() * 1_000_000_000_000).toString().padStart(12, '0');
      cardNumber = `4747${rand}`;
      const existing = await UserModel.findOne({ walletCardNumber: cardNumber });
      exists = !!existing;
    } while (exists);
    await UserModel.findByIdAndUpdate(String(user.id), { walletCardNumber: cardNumber, walletCardActive: true });
    res.json({ cardNumber, cardActive: true });
  });

  // Set/Change payment password
  app.post("/api/wallet/card/set-pin", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { UserModel } = await import("./models");
    const bcrypt = await import("bcrypt");
    const { pin, currentPin } = req.body;
    if (!pin || String(pin).length < 4 || String(pin).length > 32) {
      return res.status(400).json({ error: "كلمة المرور يجب أن تكون بين 4 و 32 حرفاً" });
    }
    const dbUser = await UserModel.findById(String(user.id)).select("+walletPin");
    if (!dbUser) return res.sendStatus(404);
    if (dbUser.walletPin) {
      if (!currentPin) return res.status(400).json({ error: "يجب إدخال كلمة المرور الحالية" });
      const valid = await bcrypt.compare(String(currentPin), dbUser.walletPin);
      if (!valid) return res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
    }
    const hashed = await bcrypt.hash(String(pin), 10);
    await UserModel.findByIdAndUpdate(String(user.id), { walletPin: hashed });
    res.json({ success: true });
  });

  // Pay with card (own card — payment password required)
  app.post("/api/wallet/card/pay", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { UserModel, WalletTransactionModel } = await import("./models");
    const bcrypt = await import("bcrypt");
    const { amount, description, pin, orderId } = req.body;
    if (!pin || !amount || Number(amount) <= 0) return res.status(400).json({ error: "بيانات ناقصة" });
    const dbUser = await UserModel.findById(String(user.id)).select("+walletPin +walletCardNumber +walletCardActive");
    if (!dbUser) return res.sendStatus(404);
    if (!dbUser.walletCardNumber || !dbUser.walletCardActive) return res.status(400).json({ error: "البطاقة غير مفعّلة — يرجى إنشاء بطاقة Qirox Pay أولاً" });
    if (!dbUser.walletPin) return res.status(400).json({ error: "يجب تعيين كلمة مرور الدفع أولاً" });
    const validPin = await bcrypt.compare(String(pin), dbUser.walletPin);
    if (!validPin) return res.status(400).json({ error: "كلمة مرور الدفع غير صحيحة" });
    const txs = await WalletTransactionModel.find({ userId: String(user.id) });
    const totalDebit = txs.filter((t: any) => t.type === 'debit').reduce((s: number, t: any) => s + t.amount, 0);
    const totalCredit = txs.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + t.amount, 0);
    const balance = Math.max(0, totalCredit - totalDebit);
    if (Number(amount) > balance) return res.status(400).json({ error: "الرصيد غير كافٍ", balance });
    const tx = await WalletTransactionModel.create({
      userId: String(user.id), type: 'debit', amount: Number(amount),
      description: description || 'دفع بـ Qirox Pay',
      orderId: orderId || undefined,
      addedBy: String(user.id), note: 'qirox_pay_card',
    });
    res.status(201).json({ success: true, transactionId: tx._id, remainingBalance: balance - Number(amount) });
  });

  // External pay: request OTP (someone else pays with your card number)
  app.post("/api/wallet/card/request-otp", async (req, res) => {
    const { cardNumber, amount, description } = req.body;
    if (!cardNumber || !amount || Number(amount) <= 0) return res.status(400).json({ error: "بيانات ناقصة" });
    const { UserModel, WalletPayOtpModel, WalletTransactionModel } = await import("./models");
    const { sendWalletPayOtpEmail } = await import("./email");
    const owner = await UserModel.findOne({ walletCardNumber: cardNumber, walletCardActive: true }).select("+walletCardNumber +walletPin");
    if (!owner) return res.status(404).json({ error: "البطاقة غير موجودة أو غير مفعّلة" });
    if (!owner.walletPin) return res.status(400).json({ error: "البطاقة لم يتم تفعيلها بعد" });
    // Check balance
    const txs = await WalletTransactionModel.find({ userId: String(owner._id) });
    const totalDebit = txs.filter((t: any) => t.type === 'debit').reduce((s: number, t: any) => s + t.amount, 0);
    const totalCredit = txs.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + t.amount, 0);
    const balance = Math.max(0, totalCredit - totalDebit);
    if (Number(amount) > balance) return res.status(400).json({ error: "رصيد البطاقة غير كافٍ" });
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await WalletPayOtpModel.create({
      cardOwnerId: owner._id, amount: Number(amount),
      description: description || 'دفع خارجي بـ Qirox Pay',
      otp, expiresAt,
    });
    try {
      await sendWalletPayOtpEmail(owner.email, owner.fullName, otp, Number(amount), description || 'دفع خارجي');
    } catch (emailErr: any) {
      console.error("[Wallet OTP] Failed to send OTP email:", emailErr?.message);
      // OTP was saved; email failed — return error so user knows email wasn't delivered
      return res.status(500).json({ error: "تم إنشاء رمز OTP لكن فشل إرساله بالبريد الإلكتروني. يرجى المحاولة لاحقاً أو التواصل مع الدعم." });
    }
    res.json({ success: true, ownerName: owner.fullName, maskedEmail: owner.email.replace(/(.{2}).+(@.+)/, '$1***$2') });
  });

  // External pay: verify OTP and deduct — credits the requester's wallet
  app.post("/api/wallet/card/verify-otp", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const requester = req.user as User;
    const { cardNumber, otp, amount, description } = req.body;
    if (!cardNumber || !otp || !amount) return res.status(400).json({ error: "بيانات ناقصة" });
    const { UserModel, WalletPayOtpModel, WalletTransactionModel } = await import("./models");
    const owner = await UserModel.findOne({ walletCardNumber: cardNumber, walletCardActive: true }).select("+walletCardNumber +walletPin");
    if (!owner) return res.status(404).json({ error: "البطاقة غير موجودة" });
    // Cannot charge from your own card via external flow
    if (String(owner._id) === String(requester.id)) return res.status(400).json({ error: "لا يمكنك شحن محفظتك من بطاقتك الخاصة" });
    const pending = await WalletPayOtpModel.findOne({
      cardOwnerId: owner._id, otp, used: false,
      expiresAt: { $gt: new Date() },
      amount: Number(amount),
    });
    if (!pending) return res.status(400).json({ error: "رمز OTP غير صحيح أو منتهي الصلاحية" });
    // Verify balance atomically (deduct first, then create record)
    const finalAmount = parseFloat(Number(amount).toFixed(2));
    const label = description || pending.description || 'شحن من بطاقة Qirox Pay';
    // Mark OTP as used
    await WalletPayOtpModel.findByIdAndUpdate(pending._id, { used: true });
    // Atomic debit owner
    const ownerOk = await atomicWalletDebit(String(owner._id), finalAmount);
    if (!ownerOk) {
      await WalletPayOtpModel.findByIdAndUpdate(pending._id, { used: false });
      return res.status(400).json({ error: "الرصيد غير كافٍ" });
    }
    await WalletTransactionModel.create({
      userId: String(owner._id), type: 'debit', amount: finalAmount,
      description: `${label} — تحويل إلى ${(requester as any).fullName || requester.username}`,
      addedBy: String(requester.id), note: 'qirox_pay_external_out',
    });
    // Atomic credit requester
    await atomicWalletCredit(String(requester.id), finalAmount);
    const creditTx = await WalletTransactionModel.create({
      userId: String(requester.id), type: 'credit', amount: finalAmount,
      description: `${label} — من بطاقة ${owner.fullName || owner.username}`,
      addedBy: String(requester.id), note: 'qirox_pay_external_in',
    });
    res.json({ success: true, transactionId: creditTx._id });
  });

  // Topup request (client submits bank transfer)
  app.post("/api/wallet/topup-request", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { WalletTopupModel } = await import("./models");
    const { amount, bankName, bankRef, note } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: "المبلغ غير صحيح" });
    const topup = await WalletTopupModel.create({
      userId: String(user.id), amount: Number(amount), bankName, bankRef, note,
    });
    res.status(201).json(topup);
  });

  // Get my topup requests
  app.get("/api/wallet/topup-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { WalletTopupModel } = await import("./models");
    const requests = await WalletTopupModel.find({ userId: String(user.id) }).sort({ createdAt: -1 });
    res.json(requests);
  });


  // === CLIENT DATA REQUESTS ===

  app.post("/api/data-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as User;
    if ((me as any).role === 'client') return res.sendStatus(403);
    const { ClientDataRequestModel, UserModel } = await import("./models");
    const { sendDataRequestEmail } = await import("./email");
    const { clientId, orderId, projectId, title, description, priority, dueDate, requestItems } = req.body;
    if (!clientId || !title) return res.status(400).json({ error: "clientId والعنوان مطلوبان" });
    const dr = await ClientDataRequestModel.create({
      clientId, orderId: orderId || undefined, projectId: projectId || undefined,
      requestedBy: String(me.id), title, description, priority: priority || 'normal',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      requestItems: requestItems || [],
      status: 'pending',
    });
    const client = await UserModel.findById(clientId);
    if (client) {
      await sendDataRequestEmail(client.email, client.fullName, title, description || '', priority || 'normal');
    }
    res.status(201).json(dr);
  });

  app.get("/api/data-requests/mine", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as User;
    const { ClientDataRequestModel } = await import("./models");
    const requests = await ClientDataRequestModel.find({ clientId: String(me.id) })
      .populate('requestedBy', 'fullName username avatarUrl')
      .sort({ createdAt: -1 });
    res.json(requests);
  });

  app.get("/api/admin/data-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as User;
    if ((me as any).role === 'client') return res.sendStatus(403);
    const { ClientDataRequestModel } = await import("./models");
    const filter: any = {};
    if (req.query.orderId) filter.orderId = req.query.orderId;
    if (req.query.clientId) filter.clientId = req.query.clientId;
    if (req.query.status) filter.status = req.query.status;
    const requests = await ClientDataRequestModel.find(filter)
      .populate('clientId', 'fullName username email avatarUrl')
      .populate('requestedBy', 'fullName username avatarUrl')
      .sort({ createdAt: -1 });
    res.json(requests);
  });

  app.post("/api/data-requests/:id/submit", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as User;
    const { ClientDataRequestModel } = await import("./models");
    const dr = await ClientDataRequestModel.findById(req.params.id);
    if (!dr) return res.sendStatus(404);
    if (String(dr.clientId) !== String(me.id)) return res.sendStatus(403);
    const { items, notes } = req.body;
    await ClientDataRequestModel.findByIdAndUpdate(req.params.id, {
      status: 'submitted',
      response: { items: items || [], notes: notes || '', submittedAt: new Date() },
    });
    res.json({ success: true });
  });

  app.patch("/api/admin/data-requests/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as User;
    if ((me as any).role === 'client') return res.sendStatus(403);
    const { ClientDataRequestModel } = await import("./models");
    const { status, adminNote } = req.body;
    const allowed = ['pending', 'submitted', 'approved', 'revision_needed'];
    if (!allowed.includes(status)) return res.status(400).json({ error: "حالة غير صالحة" });
    const dr = await ClientDataRequestModel.findByIdAndUpdate(req.params.id, { status, adminNote }, { new: true });
    if (!dr) return res.sendStatus(404);
    res.json(dr);
  });

  app.delete("/api/admin/data-requests/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as User;
    if ((me as any).role === 'client') return res.sendStatus(403);
    const { ClientDataRequestModel } = await import("./models");
    await ClientDataRequestModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });

  // ═══════════════════════════════════════════════════════════
  // === SWITCH REMINDER (تذكير التحويل) ===
  // ═══════════════════════════════════════════════════════════

  const switchReminderLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: "تجاوزت الحد المسموح به. حاول بعد ساعة." } });

  // Public submit (anyone — logged in or not)
  app.post("/api/switch-reminder", switchReminderLimiter, async (req, res) => {
    const { SwitchReminderModel } = await import("./models");
    const { name, phone, email, currentProvider, serviceType, subscriptionEndDate, notes } = req.body;
    if (!name?.trim() || !phone?.trim() || !currentProvider?.trim() || !subscriptionEndDate) {
      return res.status(400).json({ error: "الاسم والجوال واسم الشركة الحالية وتاريخ انتهاء الاشتراك مطلوبة" });
    }
    const endDate = new Date(subscriptionEndDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (isNaN(endDate.getTime()) || endDate < today) {
      return res.status(400).json({ error: "تاريخ انتهاء الاشتراك يجب أن يكون اليوم أو في المستقبل" });
    }
    try {
      const userId = req.isAuthenticated() ? String((req.user as any)._id || (req.user as any).id) : null;
      const reminder = await SwitchReminderModel.create({
        name: name.trim(), phone: phone.trim(), email: (email || "").trim(),
        currentProvider: currentProvider.trim(), serviceType: (serviceType || "").trim(),
        subscriptionEndDate: endDate, notes: (notes || "").trim(), userId,
      });
      res.status(201).json({ success: true, id: reminder.id });
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  // Admin create reminder (no rate limit — trusted admin/employee context)
  app.post("/api/admin/switch-reminders", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","employee","sales"].includes((req.user as any).role)) return res.sendStatus(403);
    const { SwitchReminderModel } = await import("./models");
    const { name, phone, email, currentProvider, serviceType, subscriptionEndDate, notes } = req.body;
    if (!name?.trim() || !currentProvider?.trim() || !subscriptionEndDate) {
      return res.status(400).json({ error: "الاسم واسم الشركة الحالية وتاريخ انتهاء الاشتراك مطلوبة" });
    }
    const endDate = new Date(subscriptionEndDate);
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "تاريخ انتهاء الاشتراك غير صالح" });
    }
    try {
      const actor = req.user as any;
      const reminder = await SwitchReminderModel.create({
        name: name.trim(),
        phone: (phone || "").trim(),
        email: (email || "").trim(),
        currentProvider: currentProvider.trim(),
        serviceType: (serviceType || "").trim(),
        subscriptionEndDate: endDate,
        notes: (notes || "").trim(),
        userId: String(actor._id || actor.id),
        adminNotes: `أُنشئ من صفحة الاستشارات بواسطة: ${actor.fullName || actor.username}`,
      });
      res.status(201).json(reminder.toJSON());
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  // Admin list — sorted by soonest expiry
  app.get("/api/admin/switch-reminders", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { SwitchReminderModel } = await import("./models");
    const { status } = req.query as any;
    const filter: any = status && status !== "all" ? { status } : {};
    const reminders = await SwitchReminderModel.find(filter).sort({ subscriptionEndDate: 1 }).limit(500);
    res.json(reminders);
  });

  // Admin update (status, notes)
  app.patch("/api/admin/switch-reminders/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { SwitchReminderModel } = await import("./models");
    const { status, adminNotes } = req.body;
    try {
      const doc = await SwitchReminderModel.findById(req.params.id);
      if (!doc) return res.sendStatus(404);
      if (status) doc.status = status;
      if (adminNotes !== undefined) doc.adminNotes = adminNotes;
      if (status === "contacted" && !doc.contactedAt) doc.contactedAt = new Date();
      await doc.save();
      res.json(doc.toJSON());
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  // Admin delete
  app.delete("/api/admin/switch-reminders/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { SwitchReminderModel } = await import("./models");
    await SwitchReminderModel.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  });

  // ═══════════════════════════════════════════════════════════
  // === CLIENT API KEYS SYSTEM ===
  // ═══════════════════════════════════════════════════════════

  // Helper: validate Bearer API key and return { clientId, scopes, keyDoc }
  async function resolveApiKey(req: any, res: any): Promise<{ clientId: string; scopes: string[]; keyDoc: any } | null> {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer qrx_")) {
      res.status(401).json({ error: "Missing or invalid Authorization header. Use: Bearer qrx_live_..." });
      return null;
    }
    const rawKey = auth.slice(7);
    const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const { ClientApiKeyModel } = await import("./models");
    const keyDoc = await ClientApiKeyModel.findOne({ keyHash: hash });
    if (!keyDoc) { res.status(401).json({ error: "API key not found" }); return null; }
    if (!keyDoc.isActive) { res.status(403).json({ error: "API key is disabled" }); return null; }
    if (keyDoc.expiresAt && keyDoc.expiresAt < new Date()) { res.status(403).json({ error: "API key has expired" }); return null; }
    // Update usage stats (non-blocking)
    ClientApiKeyModel.findByIdAndUpdate(keyDoc._id, { $set: { lastUsedAt: new Date() }, $inc: { requestCount: 1 } }).exec().catch(() => {});
    return { clientId: String(keyDoc.clientId), scopes: keyDoc.scopes, keyDoc };
  }

  function requireScope(scopes: string[], scope: string, res: any): boolean {
    if (!scopes.includes(scope)) {
      res.status(403).json({ error: `Forbidden: key does not have '${scope}' scope` });
      return false;
    }
    return true;
  }

  // ── Client: list own API keys ──
  app.get("/api/my-api-keys", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    const { ClientApiKeyModel } = await import("./models");
    const keys = await ClientApiKeyModel.find({ clientId: me._id || me.id }).sort({ createdAt: -1 });
    res.json(keys);
  });

  // ── Client: create API key ──
  app.post("/api/my-api-keys", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    const { ClientApiKeyModel } = await import("./models");
    const { name, projectName, scopes, expiresAt, allowedOrigins } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "اسم المفتاح مطلوب" });

    // Limit 10 active keys per client
    const count = await ClientApiKeyModel.countDocuments({ clientId: me._id || me.id, isActive: true });
    if (count >= 10) return res.status(400).json({ error: "الحد الأقصى 10 مفاتيح نشطة" });

    const VALID_SCOPES = ["orders", "projects", "invoices", "stats", "wallet", "customers"];
    const cleanScopes = Array.isArray(scopes) ? scopes.filter((s: string) => VALID_SCOPES.includes(s)) : ["orders", "projects", "invoices", "stats"];
    if (cleanScopes.length === 0) return res.status(400).json({ error: "يجب اختيار صلاحية واحدة على الأقل" });

    const rawKey = "qrx_live_" + crypto.randomBytes(28).toString("hex");
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 16) + "...";

    try {
      const doc = await ClientApiKeyModel.create({
        clientId: me._id || me.id,
        name: name.trim(),
        projectName: (projectName || "").trim(),
        keyHash, keyPrefix,
        scopes: cleanScopes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        allowedOrigins: Array.isArray(allowedOrigins) ? allowedOrigins.map((o: string) => o.trim()).filter(Boolean) : [],
      });
      res.status(201).json({ ...doc.toJSON(), rawKey }); // rawKey shown ONCE
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  // ── Client: update key (name, active, scopes, allowedOrigins) ──
  app.patch("/api/my-api-keys/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    const { ClientApiKeyModel } = await import("./models");
    const doc = await ClientApiKeyModel.findOne({ _id: req.params.id, clientId: me._id || me.id });
    if (!doc) return res.sendStatus(404);
    const { name, isActive, scopes, allowedOrigins, projectName } = req.body;
    if (name !== undefined) doc.name = name;
    if (projectName !== undefined) doc.projectName = projectName;
    if (isActive !== undefined) doc.isActive = isActive;
    if (scopes !== undefined) doc.scopes = scopes;
    if (allowedOrigins !== undefined) doc.allowedOrigins = allowedOrigins;
    await doc.save();
    res.json(doc.toJSON());
  });

  // ── Client: delete/revoke key ──
  app.delete("/api/my-api-keys/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    const { ClientApiKeyModel } = await import("./models");
    await ClientApiKeyModel.findOneAndDelete({ _id: req.params.id, clientId: me._id || me.id });
    res.sendStatus(204);
  });

  // ── Client: preview data for a linked API project ──
  app.get("/api/my-api-keys/:id/preview", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    const cid = me._id || me.id;
    const { ClientApiKeyModel, OrderModel, ProjectModel, InvoiceModel } = await import("./models");
    const key = await ClientApiKeyModel.findOne({ _id: req.params.id, clientId: cid }).lean();
    if (!key) return res.sendStatus(404);
    const scopes: string[] = (key as any).scopes || [];

    const [recentOrders, recentProjects, recentInvoices, statsData] = await Promise.all([
      scopes.includes("orders")
        ? (OrderModel as any).find({ clientId: cid }).sort({ createdAt: -1 }).limit(5).lean()
        : Promise.resolve([]),
      scopes.includes("projects")
        ? (ProjectModel as any).find({ clientId: cid }).sort({ createdAt: -1 }).limit(5).lean()
        : Promise.resolve([]),
      scopes.includes("invoices")
        ? (InvoiceModel as any).find({ clientId: cid }).sort({ createdAt: -1 }).limit(5).lean()
        : Promise.resolve([]),
      (scopes.includes("stats") || scopes.includes("orders") || scopes.includes("projects"))
        ? Promise.all([
            (OrderModel as any).countDocuments({ clientId: cid }),
            (ProjectModel as any).countDocuments({ clientId: cid, status: { $nin: ["completed", "cancelled"] } }),
            (InvoiceModel as any).countDocuments({ clientId: cid }),
            (InvoiceModel as any).find({ clientId: cid, status: "paid" }).select("total").lean(),
          ])
        : Promise.resolve([0, 0, 0, []]),
    ]);

    const [totalOrders, activeProjects, totalInvoices, paidInvoices] = statsData as any[];
    const totalRevenue = Array.isArray(paidInvoices) ? (paidInvoices as any[]).reduce((s: number, i: any) => s + (i.total || 0), 0) : 0;

    res.json({
      key: {
        id: String((key as any)._id),
        name: (key as any).name,
        projectName: (key as any).projectName,
        scopes,
        isActive: (key as any).isActive,
        requestCount: (key as any).requestCount,
        lastUsedAt: (key as any).lastUsedAt,
        keyPrefix: (key as any).keyPrefix,
        createdAt: (key as any).createdAt,
      },
      stats: {
        totalOrders: totalOrders || 0,
        activeProjects: activeProjects || 0,
        totalInvoices: totalInvoices || 0,
        totalRevenue: totalRevenue || 0,
      },
      recentOrders: (recentOrders as any[]).map((o: any) => ({
        id: String(o._id), status: o.status, serviceType: o.serviceType,
        businessName: o.businessName, totalAmount: o.totalAmount, createdAt: o.createdAt,
      })),
      recentProjects: (recentProjects as any[]).map((p: any) => ({
        id: String(p._id), status: p.status, stagingUrl: p.stagingUrl,
        productionUrl: p.productionUrl, createdAt: p.createdAt, deliveredAt: p.deliveredAt,
      })),
      recentInvoices: (recentInvoices as any[]).map((i: any) => ({
        id: String(i._id), status: i.status, total: i.total,
        description: i.description, createdAt: i.createdAt,
      })),
    });
  });

  // ── Admin: all keys ──
  app.get("/api/admin/api-keys", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { ClientApiKeyModel, UserModel } = await import("./models");
    const { clientId, status } = req.query as any;
    const filter: any = {};
    if (clientId) filter.clientId = clientId;
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;
    const keys = await ClientApiKeyModel.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    // Attach client names
    const clientIds = [...new Set(keys.map((k: any) => String(k.clientId)))];
    const users = await (UserModel as any).find({ _id: { $in: clientIds } }).select("fullName email username").lean();
    const userMap: any = {};
    users.forEach((u: any) => { userMap[String(u._id)] = u; });
    const result = keys.map((k: any) => ({ ...k, id: String(k._id), client: userMap[String(k.clientId)] || null }));
    res.json(result);
  });

  app.patch("/api/admin/api-keys/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { ClientApiKeyModel } = await import("./models");
    const doc = await ClientApiKeyModel.findById(req.params.id);
    if (!doc) return res.sendStatus(404);
    const { isActive, scopes, name } = req.body;
    if (isActive !== undefined) doc.isActive = isActive;
    if (scopes !== undefined) doc.scopes = scopes;
    if (name !== undefined) doc.name = name;
    await doc.save();
    res.json(doc.toJSON());
  });

  app.delete("/api/admin/api-keys/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { ClientApiKeyModel } = await import("./models");
    await ClientApiKeyModel.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  });

  // ══════════════════════════════════════════════════════════════
  // === PUBLIC V1 API (authenticated via Bearer API key) ===
  // ══════════════════════════════════════════════════════════════

  // GET /api/v1/me — client identity
  app.get("/api/v1/me", async (req, res) => {
    const ctx = await resolveApiKey(req, res); if (!ctx) return;
    const { UserModel } = await import("./models");
    const user = await (UserModel as any).findById(ctx.clientId).select("fullName email username phone subscriptionStatus subscriptionExpiresAt subscriptionSegmentNameAr createdAt").lean();
    if (!user) return res.status(404).json({ error: "Client not found" });
    res.json({ id: String((user as any)._id), ...(user as any), scopes: ctx.scopes });
  });

  // GET /api/v1/orders — client's orders
  app.get("/api/v1/orders", async (req, res) => {
    const ctx = await resolveApiKey(req, res); if (!ctx) return;
    if (!requireScope(ctx.scopes, "orders", res)) return;
    const { OrderModel } = await import("./models");
    const { limit = "50", skip = "0", status } = req.query as any;
    const filter: any = { clientId: ctx.clientId };
    if (status) filter.status = status;
    const orders = await (OrderModel as any).find(filter).sort({ createdAt: -1 }).skip(Number(skip)).limit(Math.min(Number(limit), 100)).lean();
    const total = await (OrderModel as any).countDocuments(filter);
    res.json({ total, data: orders.map((o: any) => ({ ...o, id: String(o._id) })) });
  });

  // GET /api/v1/projects — client's projects
  app.get("/api/v1/projects", async (req, res) => {
    const ctx = await resolveApiKey(req, res); if (!ctx) return;
    if (!requireScope(ctx.scopes, "projects", res)) return;
    const { ProjectModel } = await import("./models");
    const { limit = "20", skip = "0" } = req.query as any;
    const projects = await (ProjectModel as any).find({ clientId: ctx.clientId }).sort({ createdAt: -1 }).skip(Number(skip)).limit(Math.min(Number(limit), 50)).lean();
    const total = await (ProjectModel as any).countDocuments({ clientId: ctx.clientId });
    res.json({ total, data: projects.map((p: any) => ({ ...p, id: String(p._id) })) });
  });

  // GET /api/v1/invoices — client's invoices
  app.get("/api/v1/invoices", async (req, res) => {
    const ctx = await resolveApiKey(req, res); if (!ctx) return;
    if (!requireScope(ctx.scopes, "invoices", res)) return;
    const { InvoiceModel } = await import("./models");
    const { limit = "50", skip = "0", status } = req.query as any;
    const filter: any = { clientId: ctx.clientId };
    if (status) filter.status = status;
    const invoices = await (InvoiceModel as any).find(filter).sort({ createdAt: -1 }).skip(Number(skip)).limit(Math.min(Number(limit), 100)).lean();
    const total = await (InvoiceModel as any).countDocuments(filter);
    res.json({ total, data: invoices.map((i: any) => ({ ...i, id: String(i._id) })) });
  });

  // GET /api/v1/stats — business statistics
  app.get("/api/v1/stats", async (req, res) => {
    const ctx = await resolveApiKey(req, res); if (!ctx) return;
    if (!requireScope(ctx.scopes, "stats", res)) return;
    const { OrderModel, InvoiceModel, ProjectModel } = await import("./models");
    const cid = ctx.clientId;
    const [
      totalOrders, activeProjects, totalInvoices,
      paidInvoices, pendingInvoices,
    ] = await Promise.all([
      (OrderModel as any).countDocuments({ clientId: cid }),
      (ProjectModel as any).countDocuments({ clientId: cid, status: { $nin: ["completed", "cancelled"] } }),
      (InvoiceModel as any).countDocuments({ clientId: cid }),
      (InvoiceModel as any).find({ clientId: cid, status: "paid" }).select("total").lean(),
      (InvoiceModel as any).countDocuments({ clientId: cid, status: "pending" }),
    ]);
    const totalRevenue = (paidInvoices as any[]).reduce((s: number, i: any) => s + (i.total || 0), 0);
    res.json({
      orders: { total: totalOrders },
      projects: { active: activeProjects },
      invoices: { total: totalInvoices, paid: paidInvoices.length, pending: pendingInvoices, totalRevenue },
    });
  });

  // GET /api/v1/wallet — wallet balance + recent transactions
  app.get("/api/v1/wallet", async (req, res) => {
    const ctx = await resolveApiKey(req, res); if (!ctx) return;
    if (!requireScope(ctx.scopes, "wallet", res)) return;
    const { UserModel, WalletTransactionModel } = await import("./models");
    const user = await (UserModel as any).findById(ctx.clientId).select("walletBalance").lean();
    const txns = await (WalletTransactionModel as any).find({ userId: ctx.clientId }).sort({ createdAt: -1 }).limit(20).lean();
    res.json({
      balance: (user as any)?.walletBalance || 0,
      transactions: txns.map((t: any) => ({ ...t, id: String(t._id) })),
    });
  });

  // GET /api/v1/customers — (orders customers/contacts for this client)
  app.get("/api/v1/customers", async (req, res) => {
    const ctx = await resolveApiKey(req, res); if (!ctx) return;
    if (!requireScope(ctx.scopes, "customers", res)) return;
    const { OrderModel } = await import("./models");
    const orders = await (OrderModel as any).find({ clientId: ctx.clientId }).select("customerName customerEmail customerPhone createdAt").lean();
    // Deduplicate by email/phone
    const seen = new Set<string>();
    const customers = orders.filter((o: any) => {
      const key = o.customerEmail || o.customerPhone || String(o._id);
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).map((o: any) => ({ name: o.customerName, email: o.customerEmail, phone: o.customerPhone, firstOrderAt: o.createdAt }));
    res.json({ total: customers.length, data: customers });
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
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    const template = await storage.createSectorTemplate(req.body);
    res.status(201).json(template);
  });

  app.patch("/api/admin/templates/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    const template = await storage.updateSectorTemplate(req.params.id, req.body);
    res.json(template);
  });

  app.delete("/api/admin/templates/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    await storage.deleteSectorTemplate(req.params.id);
    res.sendStatus(204);
  });

  // === PRICING PLANS API ===
  app.get("/api/pricing", async (req, res) => {
    try {
      const plans = await cache.getOrFetch("public:pricing", () => storage.getPricingPlans(), CACHE_TTL.PUBLIC);
      res.json(plans);
    } catch (err) {
      res.status(500).json({ error: "Failed to load pricing" });
    }
  });

  app.post("/api/admin/pricing", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    const plan = await storage.createPricingPlan(req.body);
    cache.invalidate("public:pricing");
    res.status(201).json(plan);
  });

  app.patch("/api/admin/pricing/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    try {
      const plan = await storage.updatePricingPlan(req.params.id, req.body);
      if (!plan) return res.status(404).json({ error: "الباقة غير موجودة" });
      cache.invalidate("public:pricing");
      res.json(plan);
    } catch (err: any) {
      if (err.code === 11000) return res.status(400).json({ error: "الـ slug موجود مسبقاً، اختر اسماً مختلفاً" });
      res.status(500).json({ error: "فشل تحديث الباقة" });
    }
  });

  app.delete("/api/admin/pricing/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    await storage.deletePricingPlan(req.params.id);
    cache.invalidate("public:pricing");
    res.sendStatus(204);
  });

  // === NEWS API ===
  app.get("/api/news", async (req, res) => {
    try {
      const news = await cache.getOrFetch("public:news", () => storage.getNews(), CACHE_TTL.PUBLIC);
      res.json(news);
    } catch (err) {
      res.status(500).json({ error: "Failed to load news" });
    }
  });

  app.post("/api/admin/news", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const news = await storage.createNews({ ...req.body, authorId: (req.user as any).id });
      cache.invalidate("public:news");
      res.status(201).json(news);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/admin/news/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const news = await storage.updateNews(req.params.id, req.body);
      cache.invalidate("public:news");
      res.json(news);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.delete("/api/admin/news/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      await storage.deleteNews(req.params.id);
      cache.invalidate("public:news");
      res.sendStatus(204);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // === JOBS API ===
  app.get("/api/jobs", async (req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.post("/api/admin/jobs", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const job = await storage.createJob(req.body);
      res.status(201).json(job);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/admin/jobs/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const job = await storage.updateJob(req.params.id, req.body);
      res.json(job);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.delete("/api/admin/jobs/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
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
      const hrEmailBody = `
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
      `;
      sendDirectEmail("info@qiroxstudio.online", "QIROX HR", `طلب توظيف جديد — ${fullName}`, hrEmailBody).catch(console.error);
      sendDirectEmail("qiroxsystem@gmail.com", "QIROX HR", `طلب توظيف جديد — ${fullName}`, hrEmailBody).catch(console.error);
      res.status(201).json(application);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // === APPLICATIONS API ===
  app.get("/api/admin/applications", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const applications = await storage.getApplications();
    res.json(applications);
  });

  app.patch("/api/admin/applications/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const application = await storage.updateApplication(req.params.id, req.body);
      res.json(application);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // Hire applicant as employee → create account + send credentials
  app.post("/api/admin/applications/:id/hire", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
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

      const { UserModel: UM4 } = await import("./models");
      const hirePhone = phone ? String(phone).trim() : "";
      if (hirePhone) {
        const dupPhone = await UM4.findOne({ phone: hirePhone });
        if (dupPhone) return res.status(400).json({ error: "رقم الجوال مستخدم من قبل" });
      }

      const rawPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase() + "!";
      const hashedPassword = await hashPassword(rawPassword);

      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName,
        role,
        phone: hirePhone || "",
        emailVerified: true as any,
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
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
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
    try {
      const partners = await cache.getOrFetch("public:partners", () => storage.getPartners(), CACHE_TTL.PUBLIC);
      res.json(partners);
    } catch (err) {
      res.status(500).json({ error: "Failed to load partners" });
    }
  });

  app.get("/api/admin/partners", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    const partners = await storage.getAllPartners();
    res.json(partners);
  });

  app.post("/api/admin/partners", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    const partner = await storage.createPartner(req.body);
    cache.invalidate("public:partners");
    res.status(201).json(partner);
  });

  app.patch("/api/admin/partners/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    const partner = await storage.updatePartner(req.params.id, req.body);
    cache.invalidate("public:partners");
    res.json(partner);
  });

  app.delete("/api/admin/partners/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    await storage.deletePartner(req.params.id);
    cache.invalidate("public:partners");
    res.sendStatus(204);
  });

  // === ADMIN STATS API ===
  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) {
      return res.sendStatus(403);
    }
    try {
      const result = await cache.getOrFetch("admin:stats", async () => {
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

        return {
          totalOrders, pendingOrders, activeProjects, totalRevenue,
          totalClients, totalEmployees, totalServices, recentOrders, recentModRequests,
        };
      }, CACHE_TTL.MEDIUM);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  // === SYSTEM OVERVIEW — All module counts in one call ===
  app.get("/api/admin/system-overview", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const result = await cache.getOrFetch("admin:system-overview", async () => {
        const {
          OrderModel, UserModel, InvoiceModel, ReceiptVoucherModel, WalletTransactionModel,
          SupportTicketModel, InboxMessageModel, InstallmentApplicationModel,
          InstallmentOfferModel, InvestorProfileModel, PayrollRecordModel, ModificationRequestModel,
          AttendanceModel, NewsModel, JobModel, DiscountCodeModel, DeviceShipmentModel,
          ConsultationBookingModel, NotificationModel,
        } = await import("./models");
        const now = new Date();

        const [
          totalClients, totalEmployees,
          totalOrders, pendingOrders, inProgressOrders, completedOrders,
          totalInvoices, unpaidInvoices,
          totalReceipts,
          totalTransactions,
          totalSupportTickets, openSupportTickets,
          totalMessages, unreadMessages,
          totalInstallApps, pendingInstallApps,
          totalInstallOffers,
          totalInvestors,
          totalPayroll, thisMonthPayroll,
          totalModRequests, pendingModRequests,
          totalAttendanceToday,
          totalNews, publishedNews,
          totalJobs, activeJobs,
          totalDiscountCodes,
          totalShipments, pendingShipments,
          totalConsultations,
          pendingNotifications,
        ] = await Promise.all([
          (UserModel as any).countDocuments({ role: "client" }),
          (UserModel as any).countDocuments({ role: { $nin: ["client", "customer", "investor"] } }),
          (OrderModel as any).countDocuments(),
          (OrderModel as any).countDocuments({ status: "pending" }),
          (OrderModel as any).countDocuments({ status: "in_progress" }),
          (OrderModel as any).countDocuments({ status: "completed" }),
          (InvoiceModel as any).countDocuments(),
          (InvoiceModel as any).countDocuments({ status: { $in: ["draft", "sent"] } }),
          (ReceiptVoucherModel as any).countDocuments(),
          (WalletTransactionModel as any).countDocuments(),
          (SupportTicketModel as any).countDocuments(),
          (SupportTicketModel as any).countDocuments({ status: { $in: ["open", "pending"] } }),
          (InboxMessageModel as any).countDocuments(),
          (InboxMessageModel as any).countDocuments({ read: false }),
          (InstallmentApplicationModel as any).countDocuments(),
          (InstallmentApplicationModel as any).countDocuments({ status: "pending" }),
          (InstallmentOfferModel as any).countDocuments(),
          (InvestorProfileModel as any).countDocuments(),
          (PayrollRecordModel as any).countDocuments(),
          (PayrollRecordModel as any).countDocuments({ month: now.getMonth() + 1, year: now.getFullYear() }),
          (ModificationRequestModel as any).countDocuments(),
          (ModificationRequestModel as any).countDocuments({ status: "pending" }),
          (AttendanceModel as any).countDocuments({ createdAt: { $gte: new Date(now.toDateString()) } }),
          (NewsModel as any).countDocuments(),
          (NewsModel as any).countDocuments({ published: true }),
          (JobModel as any).countDocuments(),
          (JobModel as any).countDocuments({ isActive: true }),
          (DiscountCodeModel as any).countDocuments(),
          (DeviceShipmentModel as any).countDocuments(),
          (DeviceShipmentModel as any).countDocuments({ status: { $in: ["pending", "processing"] } }),
          (ConsultationBookingModel as any).countDocuments(),
          (NotificationModel as any).countDocuments({ read: false }),
        ]);

        const revenueAgg = await (OrderModel as any).aggregate([
          { $match: { status: { $in: ["completed", "approved", "in_progress"] } } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;

        const recentOrders = await (OrderModel as any).find()
          .sort({ createdAt: -1 }).limit(8)
          .populate("userId", "fullName email username").lean();
        const mappedOrders = recentOrders.map((o: any) => ({ ...o, clientId: o.userId }));

        const recentTickets = await (SupportTicketModel as any).find()
          .sort({ createdAt: -1 }).limit(5)
          .populate("userId", "fullName").lean();

        return {
          overview: {
            totalClients, totalEmployees, totalRevenue,
            totalOrders, pendingOrders, inProgressOrders, completedOrders,
            totalInvoices, unpaidInvoices,
            totalReceipts, totalTransactions,
            totalSupportTickets, openSupportTickets,
            totalMessages, unreadMessages,
            totalInstallApps, pendingInstallApps, totalInstallOffers,
            totalInvestors,
            totalPayroll, thisMonthPayroll,
            totalModRequests, pendingModRequests,
            totalAttendanceToday,
            totalNews, publishedNews,
            totalJobs, activeJobs,
            totalDiscountCodes,
            totalShipments, pendingShipments,
            totalConsultations,
            pendingNotifications,
          },
          recentOrders: mappedOrders,
          recentTickets,
        };
      }, CACHE_TTL.MEDIUM);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
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
    const { title, description, projectId, orderId, priority, attachments, modificationTypeId } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "العنوان والوصف مطلوبان" });
    }
    try {
      if (user.role === 'client') {
        const { OrderModel, ModTypePriceModel } = await import("./models");
        const activeOrders = await OrderModel.find({ userId: String(user.id), status: { $in: ['approved', 'in_progress', 'completed'] } });
        if (activeOrders.length > 0) {
          let hasQuota = false;
          let isLifetime = false;
          let modPrice: number | undefined;
          for (const order of activeOrders) {
            const targetOrderId = orderId ? String(orderId) : null;
            if (targetOrderId && String(order.id || order._id) !== targetOrderId) continue;
            const planPeriod = order.planPeriod?.toLowerCase();
            if (planPeriod === 'lifetime') {
              isLifetime = true;
              if (modificationTypeId) {
                const tp = await ModTypePriceModel.findById(modificationTypeId);
                if (tp) modPrice = tp.price;
              }
              hasQuota = true;
              break;
            }
            const q = await getQuotaForOrder(order);
            if (q && (q.hasUnlimitedAddon || (q.remainingThisPeriod ?? 0) > 0)) {
              hasQuota = true;
              break;
            }
          }
          if (!hasQuota && !isLifetime) {
            return res.status(429).json({ error: "لقد استنفدت حصة التعديلات المتاحة لهذه الفترة. يمكنك شراء إضافة تعديلات غير محدودة أو الانتظار حتى الفترة القادمة." });
          }
          const request = await storage.createModificationRequest({
            userId: String(user.id), title, description, projectId, orderId, priority, attachments,
            ...(modificationTypeId ? { modificationTypeId } : {}),
            ...(modPrice !== undefined ? { modificationPrice: modPrice } : {}),
          });
          return res.status(201).json(request);
        }
        // Client has no active approved orders — block
        return res.status(403).json({ error: "يجب أن يكون لديك طلب نشط (مقبول أو قيد التنفيذ) لإرسال طلبات التعديل." });
      }
      // Non-client roles (admin/employee) can always submit
      const request = await storage.createModificationRequest({
        userId: String(user.id), title, description, projectId, orderId, priority, attachments,
        ...(modificationTypeId ? { modificationTypeId } : {}),
      });
      // Notify admins about new modification request
      try {
        const { NotificationModel } = await import("./models");
        await NotificationModel.create({
          forAdmins: true, type: 'modification',
          title: `طلب تعديل جديد: ${title}`,
          body: `أرسل ${user.fullName || user.username} طلب تعديل جديد — الأولوية: ${priority || 'عادية'}`,
          link: '/admin/mod-requests', icon: '✏️',
        });
      } catch (_) {}
      res.status(201).json(request);
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  app.patch("/api/modification-requests/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    try {
      if (user.role === "admin") {
        const updated = await storage.updateModificationRequest(req.params.id, req.body);
        // Notify client if status changed
        try {
          if (req.body.status && updated) {
            const { NotificationModel } = await import("./models");
            const statusLabels: Record<string, string> = { approved: 'تمت الموافقة', rejected: 'مرفوض', in_progress: 'قيد التنفيذ', completed: 'مكتمل' };
            await NotificationModel.create({
              userId: String((updated as any).userId), type: 'modification',
              title: `تحديث طلب التعديل`,
              body: `طلبك "${(updated as any).title}" — ${statusLabels[req.body.status] || req.body.status}`,
              link: '/modification-requests', icon: '✏️',
            });
          }
        } catch (_) {}
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

  app.post("/api/modification-requests/:id/cancel", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    try {
      const { ModificationRequestModel } = await import("./models");
      const req_ = await ModificationRequestModel.findById(req.params.id);
      if (!req_) return res.sendStatus(404);
      if (String(req_.userId) !== String(user.id) && user.role !== "admin") return res.sendStatus(403);
      if (!['pending', 'in_review'].includes(req_.status)) {
        return res.status(400).json({ error: "لا يمكن إلغاء هذا الطلب في حالته الحالية" });
      }
      req_.status = 'cancelled';
      await req_.save();
      res.json(req_.toJSON());
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  async function seedModPlanConfigs() {
    const { ModPlanConfigModel } = await import("./models");
    const count = await ModPlanConfigModel.countDocuments();
    if (count > 0) return;
    const defaults = [
      { planTier: 'lite',     planPeriod: 'monthly',   modificationsPerPeriod: 5,  quotaMonths: 1 },
      { planTier: 'lite',     planPeriod: 'sixmonth',  modificationsPerPeriod: 5,  quotaMonths: 3 },
      { planTier: 'lite',     planPeriod: 'annual',    modificationsPerPeriod: 5,  quotaMonths: 6 },
      { planTier: 'pro',      planPeriod: 'monthly',   modificationsPerPeriod: 10, quotaMonths: 1 },
      { planTier: 'pro',      planPeriod: 'sixmonth',  modificationsPerPeriod: 10, quotaMonths: 3 },
      { planTier: 'pro',      planPeriod: 'annual',    modificationsPerPeriod: 10, quotaMonths: 6 },
      { planTier: 'infinite', planPeriod: 'monthly',   modificationsPerPeriod: 20, quotaMonths: 1 },
      { planTier: 'infinite', planPeriod: 'sixmonth',  modificationsPerPeriod: 20, quotaMonths: 3 },
      { planTier: 'infinite', planPeriod: 'annual',    modificationsPerPeriod: 20, quotaMonths: 6 },
    ];
    await ModPlanConfigModel.insertMany(defaults);
  }
  seedModPlanConfigs().catch(console.error);

  async function getQuotaForOrder(order: any) {
    const { ModPlanConfigModel, ModificationRequestModel, ModQuotaAddonModel } = await import("./models");
    const planTier = order.planTier?.toLowerCase();
    const planPeriod = order.planPeriod?.toLowerCase();
    if (planPeriod === 'lifetime') return { isLifetime: true };
    if (!planTier || !planPeriod) {
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 30);
      const used = await ModificationRequestModel.countDocuments({
        orderId: String(order.id || order._id),
        status: { $nin: ['cancelled', 'rejected'] },
        createdAt: { $gte: periodStart },
      });
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);
      return {
        isLifetime: false,
        hasUnlimitedAddon: false,
        canPurchaseAddon: false,
        planTier: null,
        planPeriod: null,
        isDefaultQuota: true,
        modificationsPerPeriod: 5,
        quotaMonths: 1,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        usedThisPeriod: used,
        remainingThisPeriod: Math.max(0, 5 - used),
      };
    }
    const config = await ModPlanConfigModel.findOne({ planTier, planPeriod, isActive: true });
    if (!config) {
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 30);
      const used = await ModificationRequestModel.countDocuments({
        orderId: String(order.id || order._id),
        status: { $nin: ['cancelled', 'rejected'] },
        createdAt: { $gte: periodStart },
      });
      return {
        isLifetime: false,
        hasUnlimitedAddon: false,
        canPurchaseAddon: false,
        planTier, planPeriod,
        isDefaultQuota: true,
        modificationsPerPeriod: 5,
        quotaMonths: 1,
        periodStart: periodStart.toISOString(),
        periodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
        usedThisPeriod: used,
        remainingThisPeriod: Math.max(0, 5 - used),
      };
    }
    const now = new Date();
    const quotaStart = new Date(now);
    quotaStart.setMonth(quotaStart.getMonth() - config.quotaMonths);
    const orderCreated = new Date(order.createdAt || order._id?.getTimestamp?.() || now);
    const periodStart = orderCreated > quotaStart ? orderCreated : quotaStart;
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + config.quotaMonths);
    const activeAddon = await ModQuotaAddonModel.findOne({
      orderId: String(order.id || order._id),
      status: 'active',
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    });
    if (activeAddon) {
      return {
        isLifetime: false,
        hasUnlimitedAddon: true,
        canPurchaseAddon: ['sixmonth', 'annual'].includes(planPeriod),
        planTier, planPeriod,
        modificationsPerPeriod: config.modificationsPerPeriod,
        quotaMonths: config.quotaMonths,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        usedThisPeriod: 0,
        remainingThisPeriod: 999,
      };
    }
    const used = await ModificationRequestModel.countDocuments({
      orderId: String(order.id || order._id),
      status: { $nin: ['cancelled', 'rejected'] },
      createdAt: { $gte: periodStart, $lte: periodEnd },
    });
    return {
      isLifetime: false,
      hasUnlimitedAddon: false,
      canPurchaseAddon: ['sixmonth', 'annual'].includes(planPeriod),
      planTier, planPeriod,
      modificationsPerPeriod: config.modificationsPerPeriod,
      quotaMonths: config.quotaMonths,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      usedThisPeriod: used,
      remainingThisPeriod: Math.max(0, config.modificationsPerPeriod - used),
    };
  }

  app.get("/api/mod-quota", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    try {
      const { OrderModel } = await import("./models");
      const orders = await OrderModel.find({ userId: String(user.id), status: { $in: ['approved', 'in_progress', 'completed'] } });
      if (!orders.length) return res.json({ hasOrders: false });
      const results = [];
      for (const order of orders) {
        const q = await getQuotaForOrder(order);
        if (q) results.push({ orderId: String(order.id || order._id), orderName: order.businessName || order.serviceType || 'طلب', ...q });
      }
      res.json({ hasOrders: true, quotas: results });
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  app.post("/api/mod-quota/addon", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    const { orderId, paymentProofUrl } = req.body;
    if (!orderId) return res.status(400).json({ error: "معرّف الطلب مطلوب" });
    try {
      const { OrderModel, ModQuotaAddonModel } = await import("./models");
      const order = await OrderModel.findById(orderId);
      if (!order || String(order.userId) !== String(user.id)) return res.sendStatus(404);
      if (!['sixmonth', 'annual'].includes(order.planPeriod?.toLowerCase())) {
        return res.status(400).json({ error: "خاصية الإضافة غير متاحة إلا للباقات النصف سنوية والسنوية" });
      }
      const existing = await ModQuotaAddonModel.findOne({ orderId, clientId: String(user.id), status: 'pending' });
      if (existing) return res.status(400).json({ error: "يوجد طلب إضافة قيد المراجعة بالفعل" });
      const addon = await ModQuotaAddonModel.create({
        clientId: String(user.id), orderId, paymentProofUrl: paymentProofUrl || "", price: 1000,
      });
      res.status(201).json(addon);
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  app.get("/api/admin/mod-plan-configs", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { ModPlanConfigModel } = await import("./models");
    const configs = await ModPlanConfigModel.find().sort({ planTier: 1, planPeriod: 1 });
    res.json(configs);
  });

  app.post("/api/admin/mod-plan-configs", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { ModPlanConfigModel } = await import("./models");
    const { planTier, planPeriod, modificationsPerPeriod, quotaMonths, notes } = req.body;
    if (!planTier || !planPeriod || !modificationsPerPeriod) return res.status(400).json({ error: "البيانات ناقصة" });
    try {
      const cfg = await ModPlanConfigModel.create({ planTier, planPeriod, modificationsPerPeriod, quotaMonths: quotaMonths || 1, notes: notes || "" });
      res.status(201).json(cfg);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/admin/mod-plan-configs/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { ModPlanConfigModel } = await import("./models");
    try {
      const updated = await ModPlanConfigModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.sendStatus(404);
      res.json(updated);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.delete("/api/admin/mod-plan-configs/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { ModPlanConfigModel } = await import("./models");
    await ModPlanConfigModel.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  });

  app.get("/api/admin/mod-type-prices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { ModTypePriceModel } = await import("./models");
    const prices = await ModTypePriceModel.find().sort({ sortOrder: 1, nameAr: 1 });
    res.json(prices);
  });

  app.post("/api/admin/mod-type-prices", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { ModTypePriceModel } = await import("./models");
    const { nameAr, name, description, price, sortOrder } = req.body;
    if (!nameAr || price === undefined) return res.status(400).json({ error: "الاسم والسعر مطلوبان" });
    if (price > 50) return res.status(400).json({ error: "الحد الأقصى للسعر هو 50 ريال" });
    try {
      const tp = await ModTypePriceModel.create({ nameAr, name: name || "", description: description || "", price, sortOrder: sortOrder || 0 });
      res.status(201).json(tp);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/admin/mod-type-prices/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { ModTypePriceModel } = await import("./models");
    if (req.body.price !== undefined && req.body.price > 50) return res.status(400).json({ error: "الحد الأقصى للسعر هو 50 ريال" });
    try {
      const updated = await ModTypePriceModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.sendStatus(404);
      res.json(updated);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.delete("/api/admin/mod-type-prices/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { ModTypePriceModel } = await import("./models");
    await ModTypePriceModel.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  });

  app.get("/api/admin/mod-quota-addons", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { ModQuotaAddonModel, UserModel, OrderModel } = await import("./models");
    const addons = await ModQuotaAddonModel.find().sort({ createdAt: -1 });
    const enriched = await Promise.all(addons.map(async (a: any) => {
      const obj = a.toJSON();
      const client = await UserModel.findById(a.clientId).select('fullName username email').lean();
      const order = await (OrderModel as any).findById(a.orderId).select('businessName serviceType planTier planPeriod').lean();
      return { ...obj, client, order };
    }));
    res.json(enriched);
  });

  app.patch("/api/admin/mod-quota-addons/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { ModQuotaAddonModel } = await import("./models");
    try {
      const addon = await ModQuotaAddonModel.findById(req.params.id);
      if (!addon) return res.sendStatus(404);
      const { status, adminNotes } = req.body;
      if (status === 'active') {
        const now = new Date();
        const until = new Date(now);
        until.setMonth(until.getMonth() + 1);
        addon.validFrom = now;
        addon.validUntil = until;
      }
      if (status) addon.status = status;
      if (adminNotes !== undefined) addon.adminNotes = adminNotes;
      await addon.save();
      res.json(addon.toJSON());
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
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
    const cacheKey = `public:products:${category || "all"}:${serviceSlug || "all"}`;
    try {
      const products = await cache.getOrFetch(cacheKey, () => storage.getQiroxProducts({ category, serviceSlug, active: true }), CACHE_TTL.PUBLIC);
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: "Failed to load products" });
    }
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
    cache.invalidatePattern("^public:products:");
    res.status(201).json(product);
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const product = await storage.updateQiroxProduct(req.params.id, req.body);
    cache.invalidatePattern("^public:products:");
    res.json(product);
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    await storage.deleteQiroxProduct(req.params.id);
    cache.invalidatePattern("^public:products:");
    res.sendStatus(204);
  });

  // === SHIPPING COMPANIES ===
  const ALLOWED_SHIPPING_ROLES = ["admin", "manager"];

  app.get("/api/admin/shipping-companies", async (req, res) => {
    if (!req.isAuthenticated() || !ALLOWED_SHIPPING_ROLES.includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { ShippingCompanyModel } = await import("./models");
      const companies = await ShippingCompanyModel.find().sort({ sortOrder: 1, createdAt: 1 });
      res.json(companies);
    } catch { res.status(500).json({ error: "فشل تحميل شركات الشحن" }); }
  });

  app.get("/api/shipping-companies", async (_req, res) => {
    try {
      const { ShippingCompanyModel } = await import("./models");
      const companies = await ShippingCompanyModel.find({ isActive: true }).sort({ sortOrder: 1 });
      res.json(companies);
    } catch { res.status(500).json({ error: "فشل" }); }
  });

  app.post("/api/admin/shipping-companies", async (req, res) => {
    if (!req.isAuthenticated() || !ALLOWED_SHIPPING_ROLES.includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { ShippingCompanyModel } = await import("./models");
      const company = await ShippingCompanyModel.create(req.body);
      res.status(201).json(company);
    } catch (err: any) { res.status(500).json({ error: err.message || "فشل الإنشاء" }); }
  });

  app.patch("/api/admin/shipping-companies/:id", async (req, res) => {
    if (!req.isAuthenticated() || !ALLOWED_SHIPPING_ROLES.includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { ShippingCompanyModel } = await import("./models");
      const company = await ShippingCompanyModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
      if (!company) return res.status(404).json({ error: "غير موجودة" });
      res.json(company);
    } catch (err: any) { res.status(500).json({ error: err.message || "فشل التحديث" }); }
  });

  app.delete("/api/admin/shipping-companies/:id", async (req, res) => {
    if (!req.isAuthenticated() || !ALLOWED_SHIPPING_ROLES.includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { ShippingCompanyModel } = await import("./models");
      await ShippingCompanyModel.findByIdAndDelete(req.params.id);
      res.sendStatus(204);
    } catch { res.status(500).json({ error: "فشل الحذف" }); }
  });

  // Seed default shipping companies if none exist
  app.post("/api/admin/shipping-companies/seed-defaults", async (req, res) => {
    if (!req.isAuthenticated() || !ALLOWED_SHIPPING_ROLES.includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { ShippingCompanyModel } = await import("./models");
      const existing = await ShippingCompanyModel.countDocuments();
      if (existing > 0) return res.json({ message: "البيانات موجودة مسبقاً", count: existing });
      const defaults = [
        { name: "SMSA Express", nameAr: "سمسا إكسبرس", logo: "🟠", color: "#FF6B00", basePrice: 25, outsideCityPrice: 35, estimatedDays: "1-2 أيام", outsideCityDays: "2-4 أيام", trackingUrlTemplate: "https://www.smsa.com/tracking/index.html?trackingNumber={code}", regions: ["riyadh", "saudi"], sortOrder: 1 },
        { name: "Saudi Post (SPL)", nameAr: "البريد السعودي", logo: "🟢", color: "#00843D", basePrice: 15, outsideCityPrice: 20, estimatedDays: "2-3 أيام", outsideCityDays: "3-5 أيام", trackingUrlTemplate: "https://spl.com.sa/en/track?Track={code}", regions: ["riyadh", "saudi", "gcc"], sortOrder: 2 },
        { name: "Aramex", nameAr: "أرامكس", logo: "🔴", color: "#E30613", basePrice: 35, outsideCityPrice: 50, estimatedDays: "1-2 أيام", outsideCityDays: "2-3 أيام", trackingUrlTemplate: "https://www.aramex.com/track/results?ShipmentNumber={code}", regions: ["riyadh", "saudi", "gcc", "international"], sortOrder: 3 },
        { name: "DHL Express", nameAr: "دي إتش إل", logo: "🟡", color: "#FFCC00", basePrice: 50, outsideCityPrice: 70, estimatedDays: "1 يوم", outsideCityDays: "2-3 أيام", trackingUrlTemplate: "https://www.dhl.com/sa-en/home/tracking.html?tracking-id={code}", regions: ["riyadh", "saudi", "gcc", "international"], sortOrder: 4 },
        { name: "J&T Express", nameAr: "جي آند تي", logo: "🔵", color: "#E31837", basePrice: 20, outsideCityPrice: 30, estimatedDays: "2-3 أيام", outsideCityDays: "3-5 أيام", trackingUrlTemplate: "https://www.jtexpress.sa/tracking?billCode={code}", regions: ["riyadh", "saudi"], sortOrder: 5 },
        { name: "Naqel Express", nameAr: "نقل إكسبرس", logo: "🟤", color: "#8B4513", basePrice: 22, outsideCityPrice: 32, estimatedDays: "2-3 أيام", outsideCityDays: "3-6 أيام", trackingUrlTemplate: "https://www.naqelexpress.com/tracking/?trackId={code}", regions: ["riyadh", "saudi"], sortOrder: 6 },
      ];
      await ShippingCompanyModel.insertMany(defaults);
      res.json({ message: "تم إضافة شركات الشحن الافتراضية", count: defaults.length });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // === COUNTRIES ===
  const ALLOWED_COUNTRY_ROLES = ["admin", "manager"];

  app.get("/api/admin/countries", async (req, res) => {
    if (!req.isAuthenticated() || !ALLOWED_COUNTRY_ROLES.includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { CountryModel } = await import("./models");
      const countries = await CountryModel.find().sort({ sortOrder: 1, nameAr: 1 });
      res.json(countries);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/countries", async (_req, res) => {
    try {
      const { CountryModel } = await import("./models");
      const countries = await CountryModel.find({ isActive: true }).sort({ sortOrder: 1, nameAr: 1 });
      res.json(countries);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/admin/countries", async (req, res) => {
    if (!req.isAuthenticated() || !ALLOWED_COUNTRY_ROLES.includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { CountryModel } = await import("./models");
      const country = await CountryModel.create(req.body);
      res.status(201).json(country);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.patch("/api/admin/countries/:id", async (req, res) => {
    if (!req.isAuthenticated() || !ALLOWED_COUNTRY_ROLES.includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { CountryModel } = await import("./models");
      const country = await CountryModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!country) return res.sendStatus(404);
      res.json(country);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/admin/countries/:id", async (req, res) => {
    if (!req.isAuthenticated() || !ALLOWED_COUNTRY_ROLES.includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { CountryModel } = await import("./models");
      await CountryModel.findByIdAndDelete(req.params.id);
      res.sendStatus(204);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/admin/countries/seed-defaults", async (req, res) => {
    if (!req.isAuthenticated() || !ALLOWED_COUNTRY_ROLES.includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { CountryModel } = await import("./models");
      const existing = await CountryModel.countDocuments();
      if (existing > 0) return res.json({ message: "البيانات موجودة مسبقاً", count: existing });
      const defaults = [
        { nameAr: "المملكة العربية السعودية", nameEn: "Saudi Arabia",       code: "SA", flag: "🇸🇦", phoneCode: "+966", currency: "SAR", currencyAr: "ريال سعودي",   continent: "آسيا",    sortOrder: 1  },
        { nameAr: "الإمارات العربية المتحدة", nameEn: "United Arab Emirates",code: "AE", flag: "🇦🇪", phoneCode: "+971", currency: "AED", currencyAr: "درهم إماراتي", continent: "آسيا",    sortOrder: 2  },
        { nameAr: "مصر",                      nameEn: "Egypt",               code: "EG", flag: "🇪🇬", phoneCode: "+20",  currency: "EGP", currencyAr: "جنيه مصري",    continent: "أفريقيا", sortOrder: 3  },
        { nameAr: "الكويت",                   nameEn: "Kuwait",              code: "KW", flag: "🇰🇼", phoneCode: "+965", currency: "KWD", currencyAr: "دينار كويتي",  continent: "آسيا",    sortOrder: 4  },
        { nameAr: "قطر",                      nameEn: "Qatar",               code: "QA", flag: "🇶🇦", phoneCode: "+974", currency: "QAR", currencyAr: "ريال قطري",    continent: "آسيا",    sortOrder: 5  },
        { nameAr: "البحرين",                  nameEn: "Bahrain",             code: "BH", flag: "🇧🇭", phoneCode: "+973", currency: "BHD", currencyAr: "دينار بحريني", continent: "آسيا",    sortOrder: 6  },
        { nameAr: "عُمان",                    nameEn: "Oman",                code: "OM", flag: "🇴🇲", phoneCode: "+968", currency: "OMR", currencyAr: "ريال عُماني",   continent: "آسيا",    sortOrder: 7  },
        { nameAr: "الأردن",                   nameEn: "Jordan",              code: "JO", flag: "🇯🇴", phoneCode: "+962", currency: "JOD", currencyAr: "دينار أردني",   continent: "آسيا",    sortOrder: 8  },
        { nameAr: "لبنان",                    nameEn: "Lebanon",             code: "LB", flag: "🇱🇧", phoneCode: "+961", currency: "LBP", currencyAr: "ليرة لبنانية", continent: "آسيا",    sortOrder: 9  },
        { nameAr: "العراق",                   nameEn: "Iraq",                code: "IQ", flag: "🇮🇶", phoneCode: "+964", currency: "IQD", currencyAr: "دينار عراقي",  continent: "آسيا",    sortOrder: 10 },
        { nameAr: "سوريا",                    nameEn: "Syria",               code: "SY", flag: "🇸🇾", phoneCode: "+963", currency: "SYP", currencyAr: "ليرة سورية",   continent: "آسيا",    sortOrder: 11 },
        { nameAr: "فلسطين",                   nameEn: "Palestine",           code: "PS", flag: "🇵🇸", phoneCode: "+970", currency: "ILS", currencyAr: "شيكل",          continent: "آسيا",    sortOrder: 12 },
        { nameAr: "اليمن",                    nameEn: "Yemen",               code: "YE", flag: "🇾🇪", phoneCode: "+967", currency: "YER", currencyAr: "ريال يمني",     continent: "آسيا",    sortOrder: 13 },
        { nameAr: "ليبيا",                    nameEn: "Libya",               code: "LY", flag: "🇱🇾", phoneCode: "+218", currency: "LYD", currencyAr: "دينار ليبي",    continent: "أفريقيا", sortOrder: 14 },
        { nameAr: "تونس",                     nameEn: "Tunisia",             code: "TN", flag: "🇹🇳", phoneCode: "+216", currency: "TND", currencyAr: "دينار تونسي",  continent: "أفريقيا", sortOrder: 15 },
        { nameAr: "الجزائر",                  nameEn: "Algeria",             code: "DZ", flag: "🇩🇿", phoneCode: "+213", currency: "DZD", currencyAr: "دينار جزائري", continent: "أفريقيا", sortOrder: 16 },
        { nameAr: "المغرب",                   nameEn: "Morocco",             code: "MA", flag: "🇲🇦", phoneCode: "+212", currency: "MAD", currencyAr: "درهم مغربي",   continent: "أفريقيا", sortOrder: 17 },
        { nameAr: "السودان",                  nameEn: "Sudan",               code: "SD", flag: "🇸🇩", phoneCode: "+249", currency: "SDG", currencyAr: "جنيه سوداني",  continent: "أفريقيا", sortOrder: 18 },
        { nameAr: "الصومال",                  nameEn: "Somalia",             code: "SO", flag: "🇸🇴", phoneCode: "+252", currency: "SOS", currencyAr: "شلن صومالي",   continent: "أفريقيا", sortOrder: 19 },
        { nameAr: "موريتانيا",                nameEn: "Mauritania",          code: "MR", flag: "🇲🇷", phoneCode: "+222", currency: "MRU", currencyAr: "أوقية",         continent: "أفريقيا", sortOrder: 20 },
        { nameAr: "تركيا",                    nameEn: "Turkey",              code: "TR", flag: "🇹🇷", phoneCode: "+90",  currency: "TRY", currencyAr: "ليرة تركية",   continent: "آسيا",    sortOrder: 21 },
        { nameAr: "باكستان",                  nameEn: "Pakistan",            code: "PK", flag: "🇵🇰", phoneCode: "+92",  currency: "PKR", currencyAr: "روبية باكستانية", continent: "آسيا", sortOrder: 22 },
        { nameAr: "الهند",                    nameEn: "India",               code: "IN", flag: "🇮🇳", phoneCode: "+91",  currency: "INR", currencyAr: "روبية هندية",   continent: "آسيا",    sortOrder: 23 },
        { nameAr: "المملكة المتحدة",           nameEn: "United Kingdom",      code: "GB", flag: "🇬🇧", phoneCode: "+44",  currency: "GBP", currencyAr: "جنيه إسترليني", continent: "أوروبا", sortOrder: 24 },
        { nameAr: "الولايات المتحدة",          nameEn: "United States",       code: "US", flag: "🇺🇸", phoneCode: "+1",   currency: "USD", currencyAr: "دولار أمريكي", continent: "أمريكا",  sortOrder: 25 },
      ];
      await CountryModel.insertMany(defaults);
      res.json({ message: "تم إضافة الدول الافتراضية", count: defaults.length });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
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
    const { couponCode } = req.body;
    if (!couponCode) return res.status(400).json({ error: "كود الخصم مطلوب" });
    try {
      const { DiscountCodeModel } = await import("./models");
      const now = new Date();
      const code = await DiscountCodeModel.findOne({
        code: couponCode.toUpperCase().trim(),
        isActive: true,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
      });
      if (!code) return res.status(400).json({ error: "كود الخصم غير صالح أو منتهي الصلاحية" });
      if (code.usageLimit && code.usageCount >= code.usageLimit) return res.status(400).json({ error: "تم استنفاد هذا الكود" });
      const currentCart = await storage.getCart(userId);
      const subtotal = (currentCart?.items || []).reduce((s: number, i: any) => s + i.price * i.qty, 0);
      if (code.minOrderAmount && subtotal < code.minOrderAmount) return res.status(400).json({ error: `الحد الأدنى للطلب ${code.minOrderAmount} ر.س` });
      let discountAmount = 0;
      if (code.type === "percentage") {
        discountAmount = (subtotal * code.value) / 100;
        if (code.maxDiscountAmount) discountAmount = Math.min(discountAmount, code.maxDiscountAmount);
      } else {
        discountAmount = Math.min(code.value, subtotal);
      }
      discountAmount = Math.round(discountAmount);
      const cart = await storage.applyCoupon(userId, code.code, discountAmount);
      // Increment usageCount atomically
      await DiscountCodeModel.findByIdAndUpdate(code._id, { $inc: { usageCount: 1 } });
      res.json(cart);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
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

  // Get project associated with an order (for admin usage guide management)
  app.get("/api/admin/orders/:id/project", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { ProjectModel } = await import("./models");
    const project = await (ProjectModel as any).findOne({ orderId: req.params.id }).lean();
    if (!project) return res.json(null);
    res.json({ ...project, id: String((project as any)._id) });
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
  app.post("/api/auth/forgot-password", otpLimiter, async (req, res) => {
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
  app.post("/api/auth/verify-email", otpLimiter, async (req, res) => {
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
        res.json({ ok: true, verified: true });
        return;
      }

      // Extend session to 14 days after successful verification
      const SESSION_14_DAYS = 14 * 24 * 60 * 60 * 1000;
      if (req.session && req.session.cookie) {
        req.session.cookie.maxAge = SESSION_14_DAYS;
        await new Promise<void>((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
      }

      const userName = (user as any).fullName || (user as any).username || "عميل";
      sendWelcomeEmail(cleanEmail, userName).catch(e => console.error("[Email] welcome failed:", e));
      console.log(`[OTP] verify-email SUCCESS for ${cleanEmail} — session extended to 14 days`);
      res.json({ ok: true, verified: true, role: (user as any).role || "client" });
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

  app.post("/api/auth/verify-otp", otpLimiter, async (req, res) => {
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

  app.post("/api/auth/reset-password", otpLimiter, async (req, res) => {
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

  app.patch("/api/orders/:id/proof", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { paymentProofUrl } = req.body;
      const { OrderModel } = await import("./models");
      const order = await OrderModel.findOneAndUpdate(
        { _id: req.params.id, userId: (req.user as any).id },
        { $set: { paymentProofUrl, status: "pending" } },
        { new: true }
      );
      if (!order) return res.status(404).json({ error: "الطلب غير موجود" });
      res.json(order);
    } catch (err) {
      console.error("[Order] proof upload error:", err);
      res.status(500).json({ error: "حدث خطأ أثناء حفظ الإيصال" });
    }
  });


  app.post("/api/auth/verify-device", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { UserModel } = await import("./models");
    const trustUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await UserModel.updateOne(
      { _id: (req.user as any).id },
      { $set: { trustedIp: ip, trustedUntil: trustUntil } }
    );
    res.json({ ok: true, trustedUntil });
  });

  app.get("/api/auth/check-trust", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const user = req.user as any;
    const isTrusted = user.trustedIp === ip && user.trustedUntil && new Date(user.trustedUntil) > new Date();
    res.json({ isTrusted });
  });

  // ── Generate Device Token for authenticated users (after email verification or when trusted) ──
  app.post("/api/auth/generate-device-token", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { DeviceTokenModel } = await import("./models");
    const { randomBytes, createHash } = await import("crypto");
    const plainToken = randomBytes(48).toString("hex");
    const tokenHash = createHash("sha256").update(plainToken).digest("hex");
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const ua = req.headers['user-agent'] as string | undefined;
    await DeviceTokenModel.create({ userId: (req.user as any)._id || (req.user as any).id, tokenHash, userAgent: ua || "", expiresAt });
    res.json({ deviceToken: plainToken });
  });

  // ── Verify Login OTP (Device Trust) ──
  app.post("/api/auth/verify-login-otp", otpLimiter, async (req, res, next) => {
    const { code, email: rawEmail } = req.body;
    if (!code || String(code).length !== 6) return res.status(400).json({ error: "أدخل الرمز المكوّن من 6 أرقام" });
    if (!rawEmail) return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });

    const { UserModel, OtpModel, DeviceTokenModel } = await import("./models");

    // Find user by email (no session dependency)
    const email = String(rawEmail).toLowerCase().trim();
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ error: "المستخدم غير موجود" });

    const enteredCode = String(code).trim();

    // Find the latest login OTP for this email
    const latestOtp = await OtpModel.findOne({ email, type: "login_otp" }).sort({ createdAt: -1 });
    if (!latestOtp) {
      console.log(`[OTP-verify-login] No OTP found for email=${email}`);
      return res.status(400).json({ error: "لم يتم إرسال رمز تحقق، أعد تسجيل الدخول" });
    }
    const isExpired = latestOtp.expiresAt < new Date();
    const isUsed = latestOtp.used;
    const codeMatch = latestOtp.code === enteredCode;
    console.log(`[OTP-verify-login] email=${email} entered="${enteredCode}" stored="${latestOtp.code}" match=${codeMatch} used=${isUsed} expired=${isExpired}`);

    if (isUsed) return res.status(400).json({ error: "تم استخدام هذا الرمز من قبل، اطلب رمزاً جديداً" });
    if (isExpired) return res.status(400).json({ error: "انتهت صلاحية الرمز، اطلب رمزاً جديداً" });
    if (!codeMatch) return res.status(400).json({ error: "الرمز غير صحيح، تأكد من آخر رسالة في بريدك" });

    const otp = latestOtp;

    await OtpModel.updateOne({ _id: otp._id }, { used: true });

    // Generate device token (plain = store in localStorage, hash = store in DB)
    const { randomBytes, createHash } = await import("crypto");
    const plainToken = randomBytes(48).toString("hex");
    const tokenHash = createHash("sha256").update(plainToken).digest("hex");
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const ua = req.headers['user-agent'] as string | undefined;
    await DeviceTokenModel.create({ userId: user._id, tokenHash, userAgent: ua || "", expiresAt });

    // Clear pending session
    delete req.session.pendingLoginUserId;

    // Log the user in
    req.login(user, (err: any) => {
      if (err) return next(err);
      res.status(200).json({ ...sanitizeUser(user), deviceToken: plainToken });
    });
  });

  // ── Resend Login OTP ──
  app.post("/api/auth/resend-login-otp", otpLimiter, async (req, res) => {
    const { email: rawEmail } = req.body;
    if (!rawEmail) return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
    const { UserModel, OtpModel } = await import("./models");
    const email = String(rawEmail).toLowerCase().trim();
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ error: "المستخدم غير موجود" });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await OtpModel.updateMany({ email, used: false, type: "login_otp" }, { used: true });
    await OtpModel.create({ email, code, expiresAt, type: "login_otp" });
    const ua = req.headers['user-agent'] as string | undefined;
    sendLoginOtpEmail(email, user.fullName || user.username, code, ua).catch(console.error);
    res.json({ ok: true });
  });
  // ── WebAuthn / Passkey Biometric Auth ──
  const RP_NAME = "QIROX Studio";
  const _devDomain = process.env.REPLIT_DEV_DOMAIN;
  const RP_ID = process.env.NODE_ENV === "production"
    ? (process.env.RP_ID || "qiroxstudio.online")
    : (_devDomain || "localhost");
  const ORIGIN = process.env.NODE_ENV === "production"
    ? (process.env.WEBAUTHN_ORIGIN || "https://qiroxstudio.online")
    : (_devDomain ? `https://${_devDomain}` : "http://localhost:5000");

  // List user's registered passkeys
  app.get("/api/auth/webauthn/credentials", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { WebAuthnCredentialModel } = await import("./models");
    const creds = await WebAuthnCredentialModel.find({ userId: (req.user as any)._id || (req.user as any).id }).sort({ createdAt: -1 });
    res.json(creds);
  });

  // Delete a passkey
  app.delete("/api/auth/webauthn/credentials/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { WebAuthnCredentialModel } = await import("./models");
    const cred = await WebAuthnCredentialModel.findOneAndDelete({ _id: req.params.id, userId: (req.user as any)._id || (req.user as any).id });
    if (!cred) return res.sendStatus(404);
    res.sendStatus(204);
  });

  // Step 1: Generate registration options (user must be logged in)
  app.post("/api/auth/webauthn/register-options", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { generateRegistrationOptions } = await import("@simplewebauthn/server");
      const { WebAuthnCredentialModel } = await import("./models");
      const user = req.user as any;
      const userId = String(user._id || user.id);
      const existing = await WebAuthnCredentialModel.find({ userId });
      const excludeCredentials = existing.map((c: any) => ({
        id: c.credentialId,
        transports: c.transports as AuthenticatorTransportFuture[],
      }));
      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userName: user.email || user.username || userId,
        userDisplayName: user.fullName || user.username || "مستخدم",
        attestationType: "none",
        excludeCredentials,
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          authenticatorAttachment: "platform",
        },
      });
      (req.session as any).webauthnRegChallenge = options.challenge;
      await new Promise<void>((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
      res.json(options);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // Step 2: Verify registration response and save credential
  app.post("/api/auth/webauthn/register-verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
      const { WebAuthnCredentialModel } = await import("./models");
      const user = req.user as any;
      const expectedChallenge = (req.session as any).webauthnRegChallenge;
      if (!expectedChallenge) return res.status(400).json({ error: "لا يوجد تحدي تسجيل نشط، أعد المحاولة" });
      const { response: attestation, deviceName } = req.body;
      const verification = await verifyRegistrationResponse({
        response: attestation,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });
      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: "فشل التحقق من البصمة" });
      }
      const { credential } = verification.registrationInfo;
      const userId = String(user._id || user.id);
      await WebAuthnCredentialModel.create({
        userId,
        credentialId: credential.id,
        credentialPublicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports: attestation.response?.transports || [],
        deviceName: deviceName || "جهاز محفوظ",
        userAgent: req.headers['user-agent'] || "",
        lastUsed: new Date(),
      });
      delete (req.session as any).webauthnRegChallenge;
      res.json({ ok: true, verified: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // Step 3: Generate authentication options (login)
  // If identifier provided → targeted flow (only user's credentials shown)
  // If no identifier → discoverable/resident-key flow (browser shows its own picker)
  app.post("/api/auth/webauthn/auth-options", async (req, res) => {
    try {
      const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
      const { UserModel, WebAuthnCredentialModel } = await import("./models");
      const { identifier } = req.body;

      let allowCredentials: { id: string; transports: AuthenticatorTransportFuture[] }[] = [];
      let resolvedUserId: string | null = null;

      if (identifier) {
        const id = String(identifier).toLowerCase().trim();
        const user = await UserModel.findOne({
          $or: [{ email: id }, { username: id }, { phone: id }, { whatsappNumber: id }],
        });
        if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });
        const creds = await WebAuthnCredentialModel.find({ userId: user._id });
        if (!creds.length) return res.status(404).json({ error: "لم يتم تسجيل بصمة لهذا الحساب بعد" });
        allowCredentials = creds.map((c: any) => ({
          id: c.credentialId,
          transports: c.transports as AuthenticatorTransportFuture[],
        }));
        resolvedUserId = String(user._id);
      }
      // If no identifier: allowCredentials stays empty → browser shows discoverable credential picker

      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials: allowCredentials.length ? allowCredentials : undefined,
        userVerification: "preferred",
      });
      (req.session as any).webauthnAuthChallenge = options.challenge;
      if (resolvedUserId) (req.session as any).webauthnAuthUserId = resolvedUserId;
      else delete (req.session as any).webauthnAuthUserId;
      await new Promise<void>((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
      res.json(options);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // Step 4: Verify authentication response and log user in
  app.post("/api/auth/webauthn/auth-verify", async (req, res, next) => {
    try {
      const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
      const { UserModel, WebAuthnCredentialModel, DeviceTokenModel } = await import("./models");
      const { randomBytes, createHash } = await import("crypto");
      const expectedChallenge = (req.session as any).webauthnAuthChallenge;
      const sessionUserId = (req.session as any).webauthnAuthUserId as string | undefined;
      if (!expectedChallenge) return res.status(400).json({ error: "جلسة التحقق منتهية، أعد المحاولة" });
      const { response: assertion } = req.body;

      // Find credential — filter by userId if known (targeted), otherwise discoverable (lookup by credentialId only)
      const credRecord = sessionUserId
        ? await WebAuthnCredentialModel.findOne({ credentialId: assertion.id, userId: sessionUserId })
        : await WebAuthnCredentialModel.findOne({ credentialId: assertion.id });

      if (!credRecord) return res.status(400).json({ error: "لم يتم التعرف على هذا الجهاز، يرجى تسجيل البصمة أولاً" });

      const verification = await verifyAuthenticationResponse({
        response: assertion,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: credRecord.credentialId,
          publicKey: new Uint8Array(credRecord.credentialPublicKey),
          counter: credRecord.counter,
          transports: credRecord.transports as AuthenticatorTransportFuture[],
        },
      });
      if (!verification.verified) return res.status(400).json({ error: "فشل التحقق بالبصمة" });
      await WebAuthnCredentialModel.updateOne({ _id: credRecord._id }, { counter: verification.authenticationInfo.newCounter, lastUsed: new Date() });
      delete (req.session as any).webauthnAuthChallenge;
      delete (req.session as any).webauthnAuthUserId;

      // Resolve user — from session or from credential record (discoverable flow)
      const resolvedUserId = sessionUserId || String(credRecord.userId);
      const user = await UserModel.findById(resolvedUserId);
      if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });
      req.login(user as any, async (err) => {
        if (err) return next(err);
        const plainToken = randomBytes(48).toString("hex");
        const tokenHash = createHash("sha256").update(plainToken).digest("hex");
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        await DeviceTokenModel.create({ userId: user._id, tokenHash, userAgent: req.headers['user-agent'] || "", expiresAt });
        const safeUser = sanitizeUser(user);
        res.json({ ...safeUser, deviceToken: plainToken });
      });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── Quick PIN Auth (fallback for devices without biometric sensors) ──
  app.get("/api/auth/quick-pin/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { UserModel } = await import("./models");
    const user = await UserModel.findById((req.user as any)._id).select("+quickPin +quickPinSetAt");
    if (!user) return res.sendStatus(404);
    res.json({ hasPin: !!user.quickPin, setAt: user.quickPinSetAt || null });
  });

  app.post("/api/auth/quick-pin/set", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { pin } = req.body;
    if (!pin || String(pin).length < 4 || String(pin).length > 8 || !/^\d+$/.test(String(pin))) {
      return res.status(400).json({ error: "الرمز يجب أن يكون بين 4 و8 أرقام" });
    }
    const bcrypt = await import("bcrypt");
    const hashed = await bcrypt.hash(String(pin), 10);
    const { UserModel } = await import("./models");
    await UserModel.updateOne({ _id: (req.user as any)._id }, { quickPin: hashed, quickPinSetAt: new Date() });
    res.json({ ok: true });
  });

  app.delete("/api/auth/quick-pin/remove", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { UserModel } = await import("./models");
    await UserModel.updateOne({ _id: (req.user as any)._id }, { $unset: { quickPin: "", quickPinSetAt: "" } });
    res.json({ ok: true });
  });

  app.post("/api/auth/quick-pin/login", async (req, res, next) => {
    try {
      const { identifier, pin } = req.body;
      if (!identifier || !pin) return res.status(400).json({ error: "يرجى إدخال اسم المستخدم والرمز" });
      if (!/^\d{4,8}$/.test(String(pin))) return res.status(400).json({ error: "رمز غير صالح" });

      const { UserModel, DeviceTokenModel } = await import("./models");
      const { randomBytes, createHash } = await import("crypto");
      const id = String(identifier).trim().toLowerCase();
      const user = await UserModel.findOne({
        $or: [
          { username: { $regex: new RegExp(`^${id}$`, "i") } },
          { email: { $regex: new RegExp(`^${id}$`, "i") } },
        ],
      }).select("+quickPin");

      if (!user || !user.quickPin) {
        return res.status(401).json({ error: "الرمز السريع غير مفعّل لهذا الحساب" });
      }
      const bcrypt = await import("bcrypt");
      const valid = await bcrypt.compare(String(pin), user.quickPin);
      if (!valid) return res.status(401).json({ error: "الرمز السريع غير صحيح" });

      req.login(user as any, async (err) => {
        if (err) return next(err);
        const plainToken = randomBytes(48).toString("hex");
        const tokenHash = createHash("sha256").update(plainToken).digest("hex");
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        await DeviceTokenModel.create({ userId: user._id, tokenHash, userAgent: req.headers["user-agent"] || "", expiresAt });
        const safeUser = sanitizeUser(user);
        res.json({ ...safeUser, deviceToken: plainToken });
      });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { NotificationModel } = await import("./models");
    const uid = (req.user as any).id;
    const role = (req.user as any).role;
    const isStaff = ["admin", "manager", "developer", "designer", "support", "sales_manager", "sales", "accountant", "merchant"].includes(role);
    const query = isStaff ? { $or: [{ userId: uid }, { forAdmins: true }] } : { userId: uid };
    const notifs = await NotificationModel.find(query).sort({ createdAt: -1 }).limit(50).lean();
    res.json(notifs.map((n: any) => ({ ...n, id: n._id?.toString() })));
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { NotificationModel } = await import("./models");
    const uid = (req.user as any).id;
    const role = (req.user as any).role;
    const isStaff = ["admin", "manager", "developer", "designer", "support", "sales_manager", "sales", "accountant", "merchant"].includes(role);
    const query = isStaff ? { $or: [{ userId: uid }, { forAdmins: true }], read: false } : { userId: uid, read: false };
    const count = await NotificationModel.countDocuments(query);
    res.json({ count });
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { NotificationModel } = await import("./models");
    const uid = (req.user as any).id;
    const role = (req.user as any).role;
    const isStaff = ["admin", "manager", "developer", "designer", "support", "sales_manager", "sales", "accountant", "merchant"].includes(role);
    const filter = isStaff
      ? { _id: req.params.id, $or: [{ userId: uid }, { forAdmins: true }] }
      : { _id: req.params.id, userId: uid };
    await NotificationModel.updateOne(filter, { read: true });
    res.json({ ok: true });
  });

  app.patch("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { NotificationModel } = await import("./models");
    const uid = (req.user as any).id;
    const role = (req.user as any).role;
    const isStaff = ["admin", "manager", "developer", "designer", "support", "sales_manager", "sales", "accountant", "merchant"].includes(role);
    const query = isStaff ? { $or: [{ userId: uid }, { forAdmins: true }], read: false } : { userId: uid, read: false };
    await NotificationModel.updateMany(query, { read: true });
    res.json({ ok: true });
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { NotificationModel } = await import("./models");
    const uid = (req.user as any).id;
    const role = (req.user as any).role;
    const isStaff = ["admin", "manager", "developer", "designer", "support", "sales_manager", "sales", "accountant", "merchant"].includes(role);
    const filter = isStaff
      ? { _id: req.params.id, $or: [{ userId: uid }, { forAdmins: true }] }
      : { _id: req.params.id, userId: uid };
    await NotificationModel.deleteOne(filter);
    res.json({ ok: true });
  });

  app.delete("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { NotificationModel } = await import("./models");
    const uid = (req.user as any).id;
    const role = (req.user as any).role;
    const isStaff = ["admin", "manager", "developer", "designer", "support", "sales_manager", "sales", "accountant", "merchant"].includes(role);
    const query = isStaff ? { $or: [{ userId: uid }, { forAdmins: true }], read: true } : { userId: uid, read: true };
    await NotificationModel.deleteMany(query);
    res.json({ ok: true });
  });

  // ═══════════════════════════════════════════════════════════
  // === GROUP CHAT (Staff Only) ===
  // ═══════════════════════════════════════════════════════════
  const staffOnly = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    next();
  };

  // List groups for current user
  app.get("/api/groups", staffOnly, async (req, res) => {
    const { GroupChatModel } = await import("./models");
    const uid = (req.user as any)._id || (req.user as any).id;
    const groups = await GroupChatModel.find({ memberIds: uid, isActive: true })
      .populate("memberIds", "fullName username role profilePhotoUrl avatarConfig")
      .populate("adminIds", "fullName username")
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();
    res.json(groups);
  });

  // Create group
  app.post("/api/groups", staffOnly, async (req, res) => {
    const { GroupChatModel, NotificationModel } = await import("./models");
    const me = req.user as any;
    const uid = me._id || me.id;
    const { name, description, icon, memberIds } = req.body;
    if (!name) return res.status(400).json({ error: "اسم المجموعة مطلوب" });
    const allMembers = [...new Set([String(uid), ...(memberIds || [])])];
    const group = await GroupChatModel.create({
      name, description: description || "", icon: icon || "💬",
      createdBy: uid, adminIds: [uid], memberIds: allMembers,
    });
    // Notify members
    for (const memberId of allMembers) {
      if (String(memberId) !== String(uid)) {
        await NotificationModel.create({
          userId: String(memberId), type: 'message',
          title: `تمت إضافتك لمجموعة: ${name}`,
          body: `أضافك ${me.fullName || me.username} إلى المجموعة`,
          link: `/groups/${group._id}`, icon: '👥',
        }).catch(() => {});
        const { pushToUser } = await import("./ws");
        pushToUser(String(memberId), { type: 'group_added', groupId: String(group._id), groupName: name });
      }
    }
    res.status(201).json(group);
  });

  // Get group details
  app.get("/api/groups/:id", staffOnly, async (req, res) => {
    const { GroupChatModel } = await import("./models");
    const uid = String((req.user as any)._id || (req.user as any).id);
    const group = await GroupChatModel.findById(req.params.id)
      .populate("memberIds", "fullName username role profilePhotoUrl avatarConfig")
      .populate("adminIds", "fullName username")
      .populate("createdBy", "fullName username")
      .lean();
    if (!group) return res.sendStatus(404);
    const isMember = (group as any).memberIds?.some((m: any) => String(m._id || m) === uid);
    if (!isMember && (req.user as any).role !== "admin") return res.sendStatus(403);
    res.json(group);
  });

  // Update group (admin only)
  app.patch("/api/groups/:id", staffOnly, async (req, res) => {
    const { GroupChatModel } = await import("./models");
    const uid = String((req.user as any)._id || (req.user as any).id);
    const group = await GroupChatModel.findById(req.params.id);
    if (!group) return res.sendStatus(404);
    const isAdmin = (group as any).adminIds?.some((a: any) => String(a) === uid) || (req.user as any).role === "admin";
    if (!isAdmin) return res.sendStatus(403);
    const { name, description, icon } = req.body;
    if (name) (group as any).name = name;
    if (description !== undefined) (group as any).description = description;
    if (icon) (group as any).icon = icon;
    await group.save();
    res.json(group);
  });

  // Add members
  app.post("/api/groups/:id/members", staffOnly, async (req, res) => {
    const { GroupChatModel, NotificationModel } = await import("./models");
    const me = req.user as any;
    const uid = String(me._id || me.id);
    const group = await GroupChatModel.findById(req.params.id);
    if (!group) return res.sendStatus(404);
    const isAdmin = (group as any).adminIds?.some((a: any) => String(a) === uid) || me.role === "admin";
    if (!isAdmin) return res.sendStatus(403);
    const { userIds } = req.body;
    const newIds = (userIds || []).filter((id: string) => !(group as any).memberIds?.some((m: any) => String(m) === id));
    (group as any).memberIds = [...((group as any).memberIds || []), ...newIds];
    await group.save();
    for (const memberId of newIds) {
      await NotificationModel.create({
        userId: String(memberId), type: 'message',
        title: `تمت إضافتك لمجموعة: ${(group as any).name}`,
        body: `أضافك ${me.fullName || me.username} إلى المجموعة`,
        link: `/groups/${group._id}`, icon: '👥',
      }).catch(() => {});
      const { pushToUser } = await import("./ws");
      pushToUser(String(memberId), { type: 'group_added', groupId: String(group._id), groupName: (group as any).name });
    }
    res.json({ success: true });
  });

  // Remove member
  app.delete("/api/groups/:id/members/:userId", staffOnly, async (req, res) => {
    const { GroupChatModel } = await import("./models");
    const me = req.user as any;
    const uid = String(me._id || me.id);
    const group = await GroupChatModel.findById(req.params.id);
    if (!group) return res.sendStatus(404);
    const isAdmin = (group as any).adminIds?.some((a: any) => String(a) === uid) || me.role === "admin";
    const isSelf = req.params.userId === uid;
    if (!isAdmin && !isSelf) return res.sendStatus(403);
    (group as any).memberIds = ((group as any).memberIds || []).filter((m: any) => String(m) !== req.params.userId);
    (group as any).adminIds = ((group as any).adminIds || []).filter((a: any) => String(a) !== req.params.userId);
    await group.save();
    res.json({ success: true });
  });

  // Promote/demote admin
  app.patch("/api/groups/:id/admins/:userId", staffOnly, async (req, res) => {
    const { GroupChatModel } = await import("./models");
    const me = req.user as any;
    const uid = String(me._id || me.id);
    const group = await GroupChatModel.findById(req.params.id);
    if (!group) return res.sendStatus(404);
    const isAdmin = (group as any).adminIds?.some((a: any) => String(a) === uid) || me.role === "admin";
    if (!isAdmin) return res.sendStatus(403);
    const { action } = req.body; // "promote" | "demote"
    if (action === "promote") {
      if (!(group as any).adminIds?.some((a: any) => String(a) === req.params.userId))
        (group as any).adminIds.push(req.params.userId);
    } else {
      (group as any).adminIds = ((group as any).adminIds || []).filter((a: any) => String(a) !== req.params.userId);
    }
    await group.save();
    res.json({ success: true });
  });

  // Delete group
  app.delete("/api/groups/:id", staffOnly, async (req, res) => {
    const { GroupChatModel } = await import("./models");
    const me = req.user as any;
    const uid = String(me._id || me.id);
    const group = await GroupChatModel.findById(req.params.id);
    if (!group) return res.sendStatus(404);
    const isAdmin = (group as any).adminIds?.some((a: any) => String(a) === uid) || me.role === "admin";
    if (!isAdmin) return res.sendStatus(403);
    (group as any).isActive = false;
    await group.save();
    res.json({ success: true });
  });

  // Get messages
  app.get("/api/groups/:id/messages", staffOnly, async (req, res) => {
    const { GroupChatModel, GroupMessageModel } = await import("./models");
    const uid = String((req.user as any)._id || (req.user as any).id);
    const group = await GroupChatModel.findById(req.params.id).lean();
    if (!group) return res.sendStatus(404);
    const isMember = (group as any).memberIds?.some((m: any) => String(m) === uid);
    if (!isMember && (req.user as any).role !== "admin") return res.sendStatus(403);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const before = req.query.before as string;
    const filter: any = { groupId: req.params.id, deletedBy: { $ne: uid } };
    if (before) filter.createdAt = { $lt: new Date(before) };
    const msgs = await GroupMessageModel.find(filter)
      .populate("fromUserId", "fullName username role profilePhotoUrl avatarConfig")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    // Mark as read
    await GroupMessageModel.updateMany({ groupId: req.params.id, readBy: { $ne: uid } }, { $addToSet: { readBy: uid } }).catch(() => {});
    res.json(msgs.reverse());
  });

  // Send message
  app.post("/api/groups/:id/messages", staffOnly, async (req, res) => {
    const { GroupChatModel, GroupMessageModel } = await import("./models");
    const me = req.user as any;
    const uid = String(me._id || me.id);
    const group = await GroupChatModel.findById(req.params.id);
    if (!group) return res.sendStatus(404);
    const isMember = (group as any).memberIds?.some((m: any) => String(m) === uid);
    if (!isMember) return res.sendStatus(403);
    const { body, attachmentUrl, attachmentType, attachmentName, attachmentSize } = req.body;
    if (!body?.trim() && !attachmentUrl) return res.status(400).json({ error: "الرسالة فارغة" });
    const msg = await GroupMessageModel.create({
      groupId: req.params.id, fromUserId: uid,
      body: body?.trim() || "",
      attachmentUrl: attachmentUrl || "", attachmentType: attachmentType || "",
      attachmentName: attachmentName || "", attachmentSize: attachmentSize || 0,
      readBy: [uid],
    });
    const populated = await GroupMessageModel.findById(msg._id)
      .populate("fromUserId", "fullName username role profilePhotoUrl avatarConfig")
      .lean();
    // Update group last message
    (group as any).lastMessage = body?.trim() || (attachmentType === "image" ? "📷 صورة" : "📎 مرفق");
    (group as any).lastMessageAt = new Date();
    await group.save();
    // Push to all members
    const { pushToUser } = await import("./ws");
    for (const memberId of (group as any).memberIds || []) {
      if (String(memberId) !== uid) {
        pushToUser(String(memberId), { type: 'group_message', message: populated, groupId: req.params.id });
      }
    }
    res.status(201).json(populated);
  });

  // Delete message (soft delete for self)
  app.delete("/api/groups/:id/messages/:msgId", staffOnly, async (req, res) => {
    const { GroupMessageModel } = await import("./models");
    const uid = String((req.user as any)._id || (req.user as any).id);
    await GroupMessageModel.findByIdAndUpdate(req.params.msgId, { $addToSet: { deletedBy: uid } });
    res.json({ success: true });
  });

  // ═══════════════════════════════════════════════════════════
  // === INBOX MESSAGES ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/inbox", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const uid = String((req.user as any).id);
    const cacheKey = `inbox:${uid}`;
    try {
      const msgs = await cache.getOrFetch(cacheKey, async () => {
        const { InboxMessageModel } = await import("./models");
        return InboxMessageModel.find({
          $or: [{ fromUserId: uid }, { toUserId: uid }],
          deletedBy: { $ne: uid },
        })
          .populate("fromUserId", "username fullName role profilePhotoUrl avatarConfig")
          .populate("toUserId", "username fullName role profilePhotoUrl avatarConfig")
          .sort({ createdAt: -1 })
          .limit(100);
      }, CACHE_TTL.INBOX);
      res.json(msgs);
    } catch (err) {
      res.status(500).json({ error: "Failed to load inbox" });
    }
  });

  app.delete("/api/inbox/:messageId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { InboxMessageModel } = await import("./models");
    const uid = String((req.user as any).id);
    const msg = await InboxMessageModel.findOne({
      _id: req.params.messageId,
      $or: [{ fromUserId: uid }, { toUserId: uid }],
    });
    if (!msg) return res.sendStatus(404);
    if (!(msg as any).deletedBy) (msg as any).deletedBy = [];
    if (!(msg as any).deletedBy.includes(uid)) {
      (msg as any).deletedBy.push(uid);
      await msg.save();
    }
    cache.invalidate(`inbox:${uid}`);
    cache.invalidate(`inbox:unread:${uid}`);
    cache.invalidate(`badges:${uid}`);
    res.json({ ok: true });
  });

  app.get("/api/inbox/unread-count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const uid = String((req.user as any).id);
    const cacheKey = `inbox:unread:${uid}`;
    try {
      const result = await cache.getOrFetch(cacheKey, async () => {
        const { InboxMessageModel } = await import("./models");
        const count = await InboxMessageModel.countDocuments({ toUserId: uid, read: false });
        return { count };
      }, CACHE_TTL.BADGES);
      res.json(result);
    } catch (err) {
      res.json({ count: 0 });
    }
  });

  app.get("/api/badges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    const cacheKey = `badges:${me.id}`;
    try {
      const result = await cache.getOrFetch(cacheKey, async () => {
        const { InboxMessageModel, SupportTicketModel, OrderModel } = await import("./models");
        const isEmployee = me.role !== "client";
        const [messages, tickets, orders] = await Promise.all([
          InboxMessageModel.countDocuments({ toUserId: me.id, read: false }),
          isEmployee
            ? SupportTicketModel.countDocuments({ status: { $in: ["open", "in_progress"] } })
            : SupportTicketModel.countDocuments({ userId: me.id, status: { $in: ["open", "in_progress"] } }),
          isEmployee
            ? OrderModel.countDocuments({ status: "pending" })
            : OrderModel.countDocuments({ userId: me.id, status: "pending" }),
        ]);
        return { messages, tickets, orders, total: messages + tickets + orders };
      }, CACHE_TTL.BADGES);
      res.json(result);
    } catch {
      res.json({ messages: 0, tickets: 0, orders: 0, total: 0 });
    }
  });

  app.get("/api/inbox/thread/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { InboxMessageModel } = await import("./models");
    const me = String((req.user as any).id);
    const other = req.params.userId;
    const msgs = await InboxMessageModel.find({
      $or: [{ fromUserId: me, toUserId: other }, { fromUserId: other, toUserId: me }],
      deletedBy: { $ne: me },
    }).populate("fromUserId", "username fullName role profilePhotoUrl avatarConfig").sort({ createdAt: 1 }).limit(200);
    await InboxMessageModel.updateMany({ fromUserId: other, toUserId: me, read: false }, { read: true });
    cache.invalidate(`inbox:unread:${me}`);
    cache.invalidate(`badges:${me}`);
    res.json(msgs);
  });

  app.post("/api/inbox", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { InboxMessageModel, NotificationModel, UserModel } = await import("./models");
    const { pushToUser } = await import("./ws");
    const { toUserId, body, orderId, attachmentUrl, attachmentType, attachmentName, attachmentSize } = req.body;
    if (!toUserId || (!body?.trim() && !attachmentUrl)) return res.status(400).json({ error: "المستقبل مطلوب وإما رسالة أو مرفق" });
    const me = req.user as any;
    const msgData: any = {
      fromUserId: me.id, toUserId,
      body: body?.trim() || "",
      orderId: orderId || undefined,
    };
    if (attachmentUrl) {
      msgData.attachmentUrl = attachmentUrl;
      msgData.attachmentType = attachmentType || "file";
      msgData.attachmentName = attachmentName || "مرفق";
      if (attachmentSize) msgData.attachmentSize = attachmentSize;
    }
    const msg = await InboxMessageModel.create(msgData);
    // Create notification for receiver
    const notifBody = body?.trim() || (attachmentType === "voice" ? "🎙️ رسالة صوتية" : attachmentType === "image" ? "🖼️ صورة" : "📎 مرفق");
    await NotificationModel.create({ userId: toUserId, type: 'message', title: `رسالة من ${me.fullName || me.username}`, body: notifBody.slice(0, 100), link: '/inbox', icon: '💬' });
    // Only send email if recipient is a CLIENT (not between employees)
    const toUser = await UserModel.findById(toUserId).select("email fullName username role");
    if (toUser?.email && toUser.role === "client") {
      sendMessageNotificationEmail(toUser.email, toUser.fullName || toUser.username, me.fullName || me.username, notifBody).catch(console.error);
    }
    const populated = await InboxMessageModel.findById(msg._id)
      .populate("fromUserId", "username fullName role profilePhotoUrl avatarConfig")
      .populate("toUserId", "username fullName role profilePhotoUrl avatarConfig");
    // Push via WebSocket for real-time delivery
    pushToUser(String(toUserId), { type: "new_message", message: populated });
    cache.invalidate(`inbox:${me.id}`);
    cache.invalidate(`inbox:${toUserId}`);
    cache.invalidate(`inbox:unread:${toUserId}`);
    cache.invalidate(`badges:${me.id}`);
    cache.invalidate(`badges:${toUserId}`);
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
  // === CUSTOMER SERVICE CHAT ===
  // ═══════════════════════════════════════════════════════════
  const CS_AGENT_ROLES = ['support', 'admin', 'manager'];

  async function populateSession(session: any) {
    const { UserModel, InboxMessageModel, OrderModel, ProjectModel, ModificationRequestModel } = await import("./models");
    const obj = session.toJSON ? session.toJSON() : session;
    const [client, agent] = await Promise.all([
      UserModel.findById(obj.clientId).select("username fullName email phone country role").lean(),
      obj.agentId ? UserModel.findById(obj.agentId).select("username fullName role").lean() : null,
    ]);
    return { ...obj, client, agent };
  }

  // Client: start or reopen a CS session
  app.post("/api/cs/sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    if (me.role !== 'client') return res.status(403).json({ error: "متاح للعملاء فقط" });
    const { subject } = req.body;
    const { CsSessionModel, UserModel, InboxMessageModel } = await import("./models");
    const { broadcastToAll, pushToUser } = await import("./ws");
    // Check for existing open session
    const existing = await CsSessionModel.findOne({ clientId: me.id, status: { $in: ['waiting', 'active'] } });
    if (existing) return res.json(await populateSession(existing));
    // Find available agent (support role, fewest active sessions)
    const agents = await UserModel.find({ role: 'support' }).select("_id").lean();
    let agentId: string | null = null;
    if (agents.length > 0) {
      const activeCounts = await Promise.all(agents.map(async (a: any) => {
        const c = await CsSessionModel.countDocuments({ agentId: a._id, status: 'active' });
        return { id: String(a._id), count: c };
      }));
      activeCounts.sort((a, b) => a.count - b.count);
      agentId = activeCounts[0].id;
    }
    const session = await CsSessionModel.create({
      clientId: me.id, agentId: agentId || undefined,
      status: agentId ? 'active' : 'waiting',
      subject: subject?.trim() || "دردشة عامة",
    });
    const populated = await populateSession(session);
    // Notify all CS agents of new session
    broadcastToAll({ type: 'cs_session_update', action: 'new', session: populated });
    if (agentId) {
      pushToUser(agentId, { type: 'cs_assigned', sessionId: String(session._id) });
    }
    // Send automatic welcome messages
    const autoMessages = [
      "مرحباً بك في QIROX Studio! 👋",
      "كيف يمكننا مساعدتك اليوم؟ فريقنا جاهز للرد على جميع استفساراتك.",
    ];
    for (const body of autoMessages) {
      await InboxMessageModel.create({
        csSessionId: session._id,
        body,
        isAutoMessage: true,
        autoSender: "QIROX Studio",
        read: false,
      });
    }
    res.status(201).json(populated);
  });

  // Client: get my current active session
  app.get("/api/cs/my-session", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    if (me.role !== 'client') return res.status(403).json({ error: "متاح للعملاء فقط" });
    const { CsSessionModel } = await import("./models");
    const session = await CsSessionModel.findOne({ clientId: me.id, status: { $in: ['waiting', 'active'] } }).sort({ createdAt: -1 });
    if (!session) return res.json(null);
    res.json(await populateSession(session));
  });

  // Agent/Admin: get all sessions
  app.get("/api/cs/sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    if (!CS_AGENT_ROLES.includes(me.role)) return res.sendStatus(403);
    const { CsSessionModel } = await import("./models");
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    // Non-admin agents see only their assigned sessions + waiting ones
    if (me.role === 'support') {
      filter.$or = [{ agentId: me.id }, { status: 'waiting' }];
    }
    const sessions = await CsSessionModel.find(filter).sort({ status: 1, lastMessageAt: -1 }).limit(100);
    const populated = await Promise.all(sessions.map(populateSession));
    res.json(populated);
  });

  // Get session details + client full profile
  app.get("/api/cs/sessions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    const { CsSessionModel, OrderModel, ProjectModel, ModificationRequestModel, SupportTicketModel } = await import("./models");
    try {
      const session = await CsSessionModel.findById(req.params.id);
      if (!session) return res.sendStatus(404);
      // Access control: client can only see their own, agents can see their assigned or waiting
      if (me.role === 'client' && String(session.clientId) !== String(me.id)) return res.sendStatus(403);
      if (me.role === 'support' && String(session.agentId) !== String(me.id) && session.status !== 'waiting') return res.sendStatus(403);
      const populated = await populateSession(session);
      // Client profile data
      const clientId = session.clientId;
      const [orders, projects, modRequests, tickets] = await Promise.all([
        OrderModel.find({ userId: clientId }).select("serviceType planTier planPeriod status totalAmount createdAt businessName").sort({ createdAt: -1 }).limit(10).lean(),
        ProjectModel.find({ orderId: { $in: (await OrderModel.find({ userId: clientId }).select("_id").lean()).map((o: any) => o._id) } }).select("phase deadline progress title").sort({ createdAt: -1 }).limit(5).lean(),
        ModificationRequestModel.find({ userId: String(clientId) }).select("title status createdAt").sort({ createdAt: -1 }).limit(5).lean(),
        SupportTicketModel.find({ userId: clientId }).select("title status createdAt").sort({ createdAt: -1 }).limit(5).lean(),
      ]);
      res.json({ ...populated, orders, projects, modRequests, tickets });
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  // Get session messages
  app.get("/api/cs/sessions/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    const { CsSessionModel, InboxMessageModel } = await import("./models");
    const session = await CsSessionModel.findById(req.params.id);
    if (!session) return res.sendStatus(404);
    if (me.role === 'client' && String(session.clientId) !== String(me.id)) return res.sendStatus(403);
    const msgs = await InboxMessageModel.find({ csSessionId: session._id })
      .populate("fromUserId", "username fullName role profilePhotoUrl avatarConfig")
      .sort({ createdAt: 1 }).limit(300);
    // Mark messages from other party as read
    const otherId = me.role === 'client' ? session.agentId : session.clientId;
    if (otherId) {
      await InboxMessageModel.updateMany({ csSessionId: session._id, fromUserId: otherId, toUserId: me.id, read: false }, { read: true });
    }
    res.json(msgs);
  });

  // Send message in a CS session
  app.post("/api/cs/sessions/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    const { CsSessionModel, InboxMessageModel, NotificationModel, UserModel } = await import("./models");
    const { pushToUser } = await import("./ws");
    try {
      const session = await CsSessionModel.findById(req.params.id);
      if (!session) return res.sendStatus(404);
      if (session.status === 'closed') return res.status(400).json({ error: "الجلسة مغلقة" });
      if (me.role === 'client' && String(session.clientId) !== String(me.id)) return res.sendStatus(403);
      const { body, attachmentUrl, attachmentType, attachmentName, attachmentSize } = req.body;
      if (!body?.trim() && !attachmentUrl) return res.status(400).json({ error: "الرسالة فارغة" });
      // Determine recipient
      let toUserId: string | null = null;
      if (me.role === 'client') {
        toUserId = session.agentId ? String(session.agentId) : null;
      } else {
        toUserId = String(session.clientId);
      }
      const msgData: any = {
        fromUserId: me.id, csSessionId: session._id,
        body: body?.trim() || "", read: false,
      };
      if (toUserId) msgData.toUserId = toUserId;
      if (attachmentUrl) {
        msgData.attachmentUrl = attachmentUrl;
        msgData.attachmentType = attachmentType || "file";
        msgData.attachmentName = attachmentName || "مرفق";
        if (attachmentSize) msgData.attachmentSize = attachmentSize;
      }
      const msg = await InboxMessageModel.create(msgData);
      session.lastMessageAt = new Date();
      await session.save();
      const populated = await InboxMessageModel.findById(msg._id).populate("fromUserId", "username fullName role profilePhotoUrl avatarConfig");
      // Push via WebSocket
      const notifBody = body?.trim() || (attachmentType === "voice" ? "🎙️ رسالة صوتية" : attachmentType === "image" ? "🖼️ صورة" : "📎 مرفق");
      if (toUserId) {
        pushToUser(toUserId, { type: 'new_message', message: populated, csSessionId: String(session._id) });
        await NotificationModel.create({ userId: toUserId, type: 'message', title: `رسالة من ${me.fullName || me.username}`, body: notifBody.slice(0, 100), link: '/cs-chat', icon: '💬' });
      }
      pushToUser(String(me.id), { type: 'cs_session_update', action: 'message', sessionId: String(session._id) });
      res.status(201).json(populated);
    } catch (err: any) {
      res.status(500).json({ error: translateError(err) });
    }
  });

  // Agent: claim a waiting session
  app.patch("/api/cs/sessions/:id/assign", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    if (!CS_AGENT_ROLES.includes(me.role)) return res.sendStatus(403);
    const { CsSessionModel, NotificationModel } = await import("./models");
    const { pushToUser, broadcastToAll } = await import("./ws");
    try {
      const session = await CsSessionModel.findById(req.params.id);
      if (!session) return res.sendStatus(404);
      if (session.status !== 'waiting' && !req.body.force) return res.status(400).json({ error: "الجلسة ليست في وضع الانتظار" });
      session.agentId = me.id as any;
      session.status = 'active';
      await session.save();
      const populated = await populateSession(session);
      broadcastToAll({ type: 'cs_session_update', action: 'assigned', session: populated });
      // Notify client
      await NotificationModel.create({ userId: String(session.clientId), type: 'message', title: 'تم تعيين موظف لك', body: `سيتولى ${me.fullName || me.username} مساعدتك`, link: '/cs-chat', icon: '🎧' });
      pushToUser(String(session.clientId), { type: 'cs_session_update', action: 'assigned', session: populated });
      res.json(populated);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // Transfer session to another agent/admin
  app.patch("/api/cs/sessions/:id/transfer", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    if (!CS_AGENT_ROLES.includes(me.role)) return res.sendStatus(403);
    const { CsSessionModel, NotificationModel, UserModel } = await import("./models");
    const { pushToUser, broadcastToAll } = await import("./ws");
    const { toAgentId, note } = req.body;
    if (!toAgentId) return res.status(400).json({ error: "يجب تحديد الموظف المحوَّل إليه" });
    try {
      const session = await CsSessionModel.findById(req.params.id);
      if (!session) return res.sendStatus(404);
      const targetAgent = await UserModel.findById(toAgentId);
      if (!targetAgent || !CS_AGENT_ROLES.includes(targetAgent.role)) return res.status(400).json({ error: "الموظف غير صالح" });
      session.previousAgentId = session.agentId as any;
      session.agentId = toAgentId as any;
      session.transferNote = note?.trim() || "";
      session.status = 'active';
      await session.save();
      const populated = await populateSession(session);
      broadcastToAll({ type: 'cs_session_update', action: 'transferred', session: populated });
      pushToUser(toAgentId, { type: 'cs_assigned', sessionId: String(session._id), note: note || "" });
      await NotificationModel.create({ userId: toAgentId, type: 'message', title: 'تحويل محادثة', body: `تم تحويل محادثة إليك من ${me.fullName || me.username}${note ? `: ${note}` : ""}`, link: '/cs-chat', icon: '↗️' });
      res.json(populated);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // Close a session
  app.patch("/api/cs/sessions/:id/close", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    const { CsSessionModel, NotificationModel } = await import("./models");
    const { pushToUser, broadcastToAll } = await import("./ws");
    try {
      const session = await CsSessionModel.findById(req.params.id);
      if (!session) return res.sendStatus(404);
      if (me.role === 'client' && String(session.clientId) !== String(me.id)) return res.sendStatus(403);
      if (me.role === 'support' && String(session.agentId) !== String(me.id)) return res.sendStatus(403);
      session.status = 'closed';
      session.closedAt = new Date();
      await session.save();
      const populated = await populateSession(session);
      broadcastToAll({ type: 'cs_session_update', action: 'closed', session: populated });
      const notifyId = me.role === 'client' ? (session.agentId ? String(session.agentId) : null) : String(session.clientId);
      if (notifyId) {
        await NotificationModel.create({ userId: notifyId, type: 'system', title: 'تم إغلاق المحادثة', body: `أُغلقت المحادثة من قِبل ${me.fullName || me.username}`, link: '/cs-chat', icon: '✅' });
        pushToUser(notifyId, { type: 'cs_session_update', action: 'closed', session: populated });
      }
      res.json(populated);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // Mark session as urgent — called by client frontend after 2 minutes of waiting
  app.post("/api/cs/sessions/:id/urgent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    const { CsSessionModel, NotificationModel, UserModel } = await import("./models");
    const { pushToUser } = await import("./ws");
    try {
      const session = await CsSessionModel.findById(req.params.id);
      if (!session) return res.sendStatus(404);
      if (me.role === 'client' && String(session.clientId) !== String(me.id)) return res.sendStatus(403);
      if (session.status !== 'waiting') return res.json({ ok: true }); // already assigned
      if (session.isUrgent) return res.json({ ok: true }); // already notified
      session.isUrgent = true;
      session.urgentNotifiedAt = new Date();
      await session.save();
      // Notify all admin + manager users
      const admins = await UserModel.find({ role: { $in: ['admin', 'manager'] } }).select("_id").lean();
      for (const admin of admins) {
        const notif = await NotificationModel.create({
          userId: admin._id,
          type: 'system',
          title: '⚠️ جلسة دعم عاجلة',
          body: `عميل ينتظر منذ أكثر من دقيقتين بدون رد. رقم الجلسة: ${String(session._id).slice(-6)}`,
          link: '/cs-chat',
          icon: '🚨',
        });
        pushToUser(String(admin._id), { type: 'notification', notification: notif });
      }
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  // Client: rate a closed session
  app.post("/api/cs/sessions/:id/rate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const me = req.user as any;
    const { CsSessionModel } = await import("./models");
    const { rating, ratingNote } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "التقييم بين 1 و 5" });
    const session = await CsSessionModel.findById(req.params.id);
    if (!session) return res.sendStatus(404);
    if (String(session.clientId) !== String(me.id)) return res.sendStatus(403);
    session.rating = rating;
    session.ratingNote = ratingNote?.trim() || "";
    await session.save();
    res.json(session);
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
    const totalAmount = req.body.amount || 0;
    const invoice = await InvoiceModel.create({ ...req.body, invoiceNumber: invNum, vatAmount: 0, totalAmount });
    try {
      if (req.body.userId) {
        const { NotificationModel } = await import("./models");
        const total = totalAmount;
        await NotificationModel.create({
          userId: String(req.body.userId), type: 'payment',
          title: `فاتورة جديدة — ${invNum}`,
          body: `صدرت فاتورة بقيمة ${total.toLocaleString('ar-SA')} ريال`,
          link: `/invoices/${(invoice as any)._id}`, icon: '🧾',
        });
      }
    } catch (_) {}
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
        vatAmount: 0,
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

      // Check if phone already taken
      const normClientPhone = phone ? String(phone).trim() : "";
      if (normClientPhone) {
        const dupPhone = await UserModel.findOne({ phone: normClientPhone });
        if (dupPhone) return res.status(409).json({ error: "رقم الجوال مستخدم من قبل" });
      }

      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(password);

      const newClient = await UserModel.create({
        username: username.toLowerCase().trim(),
        password: hashedPassword,
        fullName,
        email: normalizedEmail,
        phone: normClientPhone,
        role: "client",
        businessType: businessType || "",
        country: country || "",
      });

      // Send welcome email with credentials
      sendWelcomeWithCredentialsEmail(normalizedEmail, fullName, username, password).catch(console.error);
      // Notify admin
      sendAdminNewClientEmail("info@qiroxstudio.online", fullName, normalizedEmail, phone || "", actor.fullName || actor.username).catch(console.error);
      sendAdminNewClientEmail("qiroxsystem@gmail.com", fullName, normalizedEmail, phone || "", actor.fullName || actor.username).catch(console.error);

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
          paymentMethod: "bank_transfer",
          items: services || [],
          adminNotes: `أُنشئ بواسطة الموظف: ${actor.fullName || actor.username}`,
        };
        createdOrder = await storage.createOrder(orderData);

        // Confirm order to client
        sendOrderConfirmationEmail(normalizedEmail, fullName, String(createdOrder.id), serviceNames).catch(console.error);
        // Notify admin about order
        sendAdminNewOrderEmail("info@qiroxstudio.online", fullName, normalizedEmail, String(createdOrder.id), serviceNames, totalAmount).catch(console.error);
        sendAdminNewOrderEmail("qiroxsystem@gmail.com", fullName, normalizedEmail, String(createdOrder.id), serviceNames, totalAmount).catch(console.error);
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

  // Create order for an EXISTING client (by employee/admin)
  app.post("/api/employee/order-for-client", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const actor = req.user as any;
    if (actor.role === "client") return res.sendStatus(403);
    try {
      const { UserModel } = await import("./models");
      const { clientId, projectType, sector, idea, notes, totalAmount, items, paymentMethod } = req.body;
      if (!clientId) return res.status(400).json({ error: "يجب تحديد العميل" });
      const client = await UserModel.findById(clientId);
      if (!client || client.role !== "client") return res.status(404).json({ error: "العميل غير موجود" });
      const serviceNames: string[] = (items || []).map((s: any) => s.nameAr || s.name || s).filter(Boolean);
      const orderData = {
        userId: String(client._id),
        projectType: projectType || "طلب من موظف",
        sector: sector || "عام",
        notes: [idea ? `الفكرة: ${idea}` : "", notes || ""].filter(Boolean).join("\n") || `طلب من قِبل ${actor.fullName || actor.username}`,
        totalAmount: totalAmount || 0,
        status: "pending",
        paymentMethod: paymentMethod || "bank_transfer",
        items: items || [],
        adminNotes: `أُنشئ بواسطة: ${actor.fullName || actor.username}`,
      };
      const createdOrder = await storage.createOrder(orderData);
      sendOrderConfirmationEmail(client.email, client.fullName || client.username, String(createdOrder.id), serviceNames).catch(console.error);
      sendAdminNewOrderEmail("info@qiroxstudio.online", client.fullName || client.username, client.email, String(createdOrder.id), serviceNames, totalAmount).catch(console.error);
      // In-app notifications
      try {
        const { NotificationModel } = await import("./models");
        await NotificationModel.create({
          userId: String(client._id), type: 'order',
          title: 'تم إنشاء طلب جديد لك 📦',
          body: `أنشأ ${actor.fullName || actor.username} طلباً جديداً باسمك — ${projectType || 'طلب خدمة'}`,
          link: '/dashboard', icon: '📦',
        });
        await NotificationModel.create({
          forAdmins: true, type: 'order',
          title: `طلب جديد من موظف: ${client.fullName || client.username}`,
          body: `أنشأ ${actor.fullName || actor.username} طلباً للعميل ${client.fullName || client.username}`,
          link: '/admin/orders', icon: '📋',
        });
      } catch (_) {}
      res.status(201).json({ order: createdOrder, client: { id: String(client._id), fullName: client.fullName, email: client.email } });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "حدث خطأ" });
    }
  });

  // Search existing clients (for employee order creation)
  app.get("/api/employee/search-clients", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const actor = req.user as any;
    if (actor.role === "client") return res.sendStatus(403);
    const { q } = req.query as any;
    const { UserModel } = await import("./models");
    const trimmed = q ? String(q).trim() : "";
    const filter: any = { role: "client" };
    if (trimmed.length >= 2) {
      const regex = new RegExp(trimmed, "i");
      filter.$or = [{ fullName: regex }, { email: regex }, { username: regex }, { phone: regex }];
    }
    const clients = await UserModel.find(filter)
      .select("_id fullName email username phone businessType")
      .sort({ createdAt: -1 })
      .limit(trimmed.length >= 2 ? 15 : 30)
      .lean();
    res.json(clients.map((c: any) => ({ id: String(c._id), fullName: c.fullName, email: c.email, username: c.username, phone: c.phone, businessType: c.businessType })));
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
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // Build last 6 months metadata
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }) };
      });

      // Monthly orders + revenue + new clients
      const monthlyData = await Promise.all(months.map(async ({ year, month, label }) => {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const [ords, newClients] = await Promise.all([
          (OrderModel as any).find({ createdAt: { $gte: start, $lte: end } }).select('totalAmount status'),
          (UserModel as any).countDocuments({ role: 'client', createdAt: { $gte: start, $lte: end } }),
        ]);
        const revenue = ords.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
        const completed = ords.filter((o: any) => ['completed', 'delivered'].includes(o.status)).length;
        return { label, orders: ords.length, revenue, newClients, completed };
      }));

      // Aggregate counts
      const [totalUsers, totalEmployees, totalOrders, pendingOrders, thisMonthOrders, lastMonthOrders] = await Promise.all([
        (UserModel as any).countDocuments({ role: 'client' }),
        (UserModel as any).countDocuments({ role: { $ne: 'client' } }),
        (OrderModel as any).countDocuments(),
        (OrderModel as any).countDocuments({ status: 'pending' }),
        (OrderModel as any).countDocuments({ createdAt: { $gte: startOfMonth } }),
        (OrderModel as any).countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      ]);

      // Revenue aggregation
      const revenueAgg = await (OrderModel as any).aggregate([
        { $group: { _id: null, total: { $sum: '$totalAmount' }, avg: { $avg: '$totalAmount' }, pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0] } }, thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, '$totalAmount', 0] } }, lastMonth: { $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', startOfLastMonth] }, { $lte: ['$createdAt', endOfLastMonth] }] }, '$totalAmount', 0] } } } },
      ]);
      const rev = revenueAgg[0] || { total: 0, avg: 0, pending: 0, thisMonth: 0, lastMonth: 0 };

      // Status distribution
      const statusDist = await (OrderModel as any).aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      ]);

      // Payment method distribution
      const paymentMethodDist = await (OrderModel as any).aggregate([
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { revenue: -1 } },
      ]);

      // Top 8 clients by spending
      const topClients = await (OrderModel as any).aggregate([
        { $match: { totalAmount: { $gt: 0 } } },
        { $group: { _id: '$userId', totalSpent: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 8 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
        { $addFields: { fullName: { $arrayElemAt: ['$u.fullName', 0] }, email: { $arrayElemAt: ['$u.email', 0] }, username: { $arrayElemAt: ['$u.username', 0] } } },
        { $project: { u: 0 } },
      ]);

      // Attendance summary
      const attendanceSummary = await (AttendanceModel as any).aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, checkOut: { $ne: null } } },
        { $group: { _id: '$userId', totalHours: { $sum: '$workHours' }, days: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        { $addFields: { fullName: { $arrayElemAt: ['$userInfo.fullName', 0] }, username: { $arrayElemAt: ['$userInfo.username', 0] } } },
        { $project: { userInfo: 0 } },
        { $sort: { totalHours: -1 } },
      ]);

      // Sector distribution
      const sectorDist = await (OrderModel as any).aggregate([
        { $match: { sector: { $exists: true, $ne: '' } } },
        { $group: { _id: '$sector', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]);

      res.json({
        monthlyData,
        stats: {
          totalUsers, totalEmployees, totalOrders, pendingOrders,
          totalRevenue: rev.total,
          avgOrderValue: Math.round(rev.avg || 0),
          pendingRevenue: Math.round(rev.pending || 0),
          thisMonthRevenue: Math.round(rev.thisMonth || 0),
          lastMonthRevenue: Math.round(rev.lastMonth || 0),
          thisMonthOrders,
          lastMonthOrders,
          revenueGrowth: rev.lastMonth > 0 ? Math.round(((rev.thisMonth - rev.lastMonth) / rev.lastMonth) * 100) : 0,
          ordersGrowth: lastMonthOrders > 0 ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100) : 0,
        },
        attendanceSummary,
        statusDist,
        paymentMethodDist,
        topClients,
        sectorDist,
      });
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
    // Notify admins about new ticket
    try {
      const { NotificationModel } = await import("./models");
      const user = req.user as any;
      await NotificationModel.create({
        forAdmins: true, type: 'support',
        title: `تذكرة دعم جديدة: ${subject}`,
        body: `أرسل ${user.fullName || user.username} تذكرة دعم جديدة — ${category || 'عام'}`,
        link: '/admin/support-tickets', icon: '🎫',
      });
    } catch (_) {}
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
    // Notify client about reply or status change
    try {
      if (ticket) {
        const { NotificationModel } = await import("./models");
        const admin = req.user as any;
        if (adminReply) {
          await NotificationModel.create({
            userId: String(ticket.userId), type: 'support',
            title: 'رد على تذكرتك',
            body: `ردّ ${admin.fullName || admin.username} على تذكرتك: "${ticket.subject}"`,
            link: '/support-tickets', icon: '💬',
          });
        } else if (status) {
          const statusLabels: Record<string, string> = { resolved: 'تم الحل', closed: 'مغلقة', in_review: 'قيد المراجعة' };
          await NotificationModel.create({
            userId: String(ticket.userId), type: 'support',
            title: 'تحديث حالة التذكرة',
            body: `تذكرتك "${ticket.subject}" — ${statusLabels[status] || status}`,
            link: '/support-tickets', icon: '🎫',
          });
        }
      }
    } catch (_) {}
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
    const allowed = ['hourlyRate', 'salaryType', 'fixedSalary', 'commissionRate', 'managerId', 'vacationDays', 'vacationUsed', 'bio', 'skills', 'bankName', 'bankAccount', 'bankIBAN', 'nationalId', 'hireDate', 'jobTitle'];
    const update: any = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const profile = await (EmployeeProfileModel as any).findByIdAndUpdate(req.params.id, update, { new: true });
    await logActivity((req.user as any)._id, 'update_employee_profile', 'employee_profile', req.params.id, update, req.ip);
    res.json(profile);
  });

  app.patch("/api/admin/users/:userId/salary", async (req, res) => {
    if (!req.isAuthenticated() || !['admin', 'manager'].includes((req.user as any).role)) return res.sendStatus(403);
    const { EmployeeProfileModel } = await import("./models");
    const allowed = ['hourlyRate', 'salaryType', 'fixedSalary', 'commissionRate', 'managerId'];
    const update: any = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const profile = await (EmployeeProfileModel as any).findOneAndUpdate(
      { userId: req.params.userId },
      { $set: update },
      { new: true, upsert: true }
    );
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
      const salaryType = profile?.salaryType || 'hourly';
      let baseSalary = 0;
      const hourlyRate = profile?.hourlyRate || 0;
      if (salaryType === 'fixed') {
        baseSalary = profile?.fixedSalary || 0;
      } else if (salaryType === 'commission') {
        baseSalary = 0; // commission calculated separately
      } else {
        baseSalary = workHours * hourlyRate;
      }
      return (PayrollRecordModel as any).create({ userId: emp._id, month, year, workHours, hourlyRate, baseSalary, netSalary: baseSalary, notes: salaryType === 'commission' ? 'عمولة - يحتاج تحديد يدوي' : '' });
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
  // === EMPLOYEE SUBSCRIPTION MANAGEMENT ===
  // ═══════════════════════════════════════════════════════════

  app.get("/api/employee/clients-subscriptions", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { UserModel } = await import("./models");
    const { q } = req.query as any;
    const filter: any = { role: "client" };
    if (q && String(q).trim().length >= 2) {
      const regex = new RegExp(String(q).trim(), "i");
      filter.$or = [{ fullName: regex }, { email: regex }, { username: regex }, { phone: regex }];
    }
    const clients = await UserModel.find(filter)
      .select("_id fullName email username phone subscriptionStatus subscriptionPeriod subscriptionStartDate subscriptionExpiresAt planTier")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(clients.map((c: any) => ({
      id: String(c._id),
      fullName: c.fullName,
      email: c.email,
      username: c.username,
      phone: c.phone,
      subscriptionStatus: c.subscriptionStatus || "none",
      subscriptionPeriod: c.subscriptionPeriod,
      subscriptionStartDate: c.subscriptionStartDate,
      subscriptionExpiresAt: c.subscriptionExpiresAt,
      planTier: c.planTier,
    })));
  });

  app.post("/api/employee/activate-subscription", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { clientId, period, startDate } = req.body;
    if (!clientId || !period) return res.status(400).json({ error: "بيانات ناقصة" });
    if (!["monthly", "6months", "annual", "renewal"].includes(period)) return res.status(400).json({ error: "فترة الاشتراك غير صالحة" });

    const { UserModel, NotificationModel } = await import("./models");
    const client = await UserModel.findById(clientId).lean();
    if (!client || (client as any).role !== "client") return res.status(404).json({ error: "العميل غير موجود" });

    const start = startDate ? new Date(startDate) : new Date();
    const durationDays = period === "annual" ? 365 : period === "6months" ? 180 : 30;
    const expires = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await UserModel.findByIdAndUpdate(clientId, {
      $set: { subscriptionStatus: "active", subscriptionPeriod: period, subscriptionStartDate: start, subscriptionExpiresAt: expires },
    });

    try {
      const periodLabel = period === "annual" ? "سنوي" : period === "6months" ? "نصف سنوي" : "شهري";
      await (NotificationModel as any).create({
        userId: clientId, forAdmins: false, type: "subscription",
        title: "تم تفعيل اشتراكك",
        body: `تم تفعيل اشتراكك ${periodLabel} — ينتهي في ${expires.toLocaleDateString("ar-SA")}`,
        link: "/dashboard", icon: "🎉",
      });
    } catch (_) {}

    res.json({ success: true, expiresAt: expires.toISOString() });
  });

  app.patch("/api/employee/subscription/:clientId", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    const { status } = req.body;
    if (!["active", "expired", "none", "suspended"].includes(status)) return res.status(400).json({ error: "حالة غير صالحة" });
    const { UserModel } = await import("./models");
    const client = await UserModel.findByIdAndUpdate(req.params.clientId, { $set: { subscriptionStatus: status } }, { new: true });
    if (!client) return res.status(404).json({ error: "العميل غير موجود" });
    res.json({ success: true });
  });

  // ═══════════════════════════════════════════════════════════
  // === GLOBAL SEARCH ===
  // ═══════════════════════════════════════════════════════════
  app.get("/api/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const q = ((req.query.q as string) || '').trim();
    if (!q || q.length < 2) return res.json({ orders: [], projects: [], clients: [] });
    const { OrderModel, ProjectModel, UserModel } = await import("./models");
    const regex = new RegExp(q, 'i');
    const uid = (req.user as any)._id || (req.user as any).id;
    const isAdmin = (req.user as any).role !== 'client';

    if (isAdmin) {
      // Find matching users first to enable name-based order/project search
      const matchingUsers = await (UserModel as any).find({
        $or: [{ fullName: regex }, { username: regex }, { email: regex }],
      }).limit(10).select('_id fullName username email role');
      const matchingUserIds = matchingUsers.map((u: any) => u._id);

      const [orders, projects] = await Promise.all([
        (OrderModel as any).find({
          $or: [
            { userId: { $in: matchingUserIds } },
            { projectType: regex },
            { sector: regex },
            { adminNotes: regex },
          ],
        }).limit(8).populate('userId', 'fullName username email').select('projectType sector status totalAmount createdAt userId'),

        (ProjectModel as any).find({
          $or: [
            { clientId: { $in: matchingUserIds } },
            { status: regex },
          ],
        }).limit(6).populate('clientId', 'fullName username').select('status progress startDate deadline clientId orderId'),
      ]);

      const clients = matchingUsers.map((u: any) => ({
        id: u._id.toString(),
        fullName: u.fullName,
        username: u.username,
        email: u.email,
        role: u.role,
      }));

      res.json({
        orders: orders.map((o: any) => ({
          id: o._id.toString(),
          projectType: o.projectType,
          sector: o.sector,
          status: o.status,
          totalAmount: o.totalAmount,
          createdAt: o.createdAt,
          clientName: o.userId?.fullName || o.userId?.username || '',
        })),
        projects: projects.map((p: any) => ({
          id: p._id.toString(),
          status: p.status,
          progress: p.progress,
          deadline: p.deadline,
          clientName: p.clientId?.fullName || p.clientId?.username || '',
        })),
        clients,
      });
    } else {
      // Client: only their own orders and projects
      const [orders, projects] = await Promise.all([
        (OrderModel as any).find({
          userId: uid,
          $or: [{ projectType: regex }, { sector: regex }, { status: regex }],
        }).limit(6).select('projectType sector status totalAmount createdAt'),
        (ProjectModel as any).find({ clientId: uid }).limit(6).select('status progress startDate deadline'),
      ]);
      res.json({
        orders: orders.map((o: any) => ({
          id: o._id.toString(),
          projectType: o.projectType,
          sector: o.sector,
          status: o.status,
          totalAmount: o.totalAmount,
          createdAt: o.createdAt,
          clientName: '',
        })),
        projects: projects.map((p: any) => ({
          id: p._id.toString(),
          status: p.status,
          progress: p.progress,
          deadline: p.deadline,
          clientName: '',
        })),
        clients: [],
      });
    }
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
      const uid = user._id || user.id;
      const items = await (ChecklistItemModel as any)
        .find({ $or: [{ userId: uid }, { assignedTo: uid }] })
        .populate("assignedTo", "fullName username")
        .populate("assignedBy", "fullName username")
        .sort({ order: 1, createdAt: -1 });
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "خطأ في تحميل القائمة" });
    }
  });

  app.get("/api/checklist/assigned-by-me", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ChecklistItemModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      const items = await (ChecklistItemModel as any)
        .find({ assignedBy: uid, assignedTo: { $ne: null } })
        .populate("assignedTo", "fullName username")
        .populate("assignedBy", "fullName username")
        .sort({ createdAt: -1 });
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "خطأ في تحميل المهام المُسندة" });
    }
  });

  app.post("/api/checklist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ChecklistItemModel, UserModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      const { title, description, priority, category, projectId, dueDate, assignedTo, assignNote } = req.body;
      if (!title) return res.status(400).json({ error: "العنوان مطلوب" });
      const item = await (ChecklistItemModel as any).create({
        userId: uid,
        title, description, priority: priority || "medium",
        category: category || "عام",
        ...(projectId && { projectId }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(assignedTo && { assignedTo, assignedBy: uid, assignNote: assignNote || "" }),
      });
      if (assignedTo) {
        try {
          const assignee = await (UserModel as any).findById(assignedTo).select("email fullName username");
          if (assignee?.email) {
            const { sendTaskAssignedEmail } = await import("./email");
            await sendTaskAssignedEmail(
              assignee.email,
              assignee.fullName || assignee.username,
              title,
              category || "عام",
              priority || "medium",
              dueDate
            );
          }
        } catch (e) { console.error("[Email] checklist assign error:", e); }
      }
      const populated = await (ChecklistItemModel as any).findById(item._id)
        .populate("assignedTo", "fullName username")
        .populate("assignedBy", "fullName username");
      res.status(201).json(populated);
    } catch (err) {
      res.status(500).json({ error: "فشل إنشاء المهمة" });
    }
  });

  app.patch("/api/checklist/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ChecklistItemModel, UserModel, NotificationModel } = await import("./models");
      const { pushToUser } = await import("./ws");
      const user = req.user as any;
      const uid = user._id || user.id;

      // Fetch current state before update
      const before = await (ChecklistItemModel as any).findOne({ _id: req.params.id });

      const item = await (ChecklistItemModel as any).findOneAndUpdate(
        { _id: req.params.id, $or: [{ userId: uid }, { assignedTo: uid }] },
        { $set: req.body },
        { new: true }
      )
        .populate("assignedTo", "fullName username")
        .populate("assignedBy", "fullName username");
      if (!item) return res.status(404).json({ error: "العنصر غير موجود" });
      res.json(item);

      // If task just became done AND it was assigned (has assignedBy = creator) AND done by the assignee
      const justDone = req.body.done === true && before && !before.done;
      const doneByAssignee = before && String(before.assignedTo) === String(uid) && before.assignedBy;
      if (justDone && doneByAssignee) {
        const creatorId = String(before.assignedBy);
        try {
          // In-app notification
          await NotificationModel.create({
            userId: creatorId,
            type: "task",
            title: `✅ تم إنجاز مهمة: ${before.title}`,
            body: `أنجز ${user.fullName || user.username} المهمة التي طلبتها منه`,
            link: "/employee/checklist",
            icon: "✅",
          });
          // WebSocket push
          pushToUser(creatorId, {
            type: "task_completed",
            taskId: String(before._id),
            taskTitle: before.title,
            completedBy: user.fullName || user.username,
          });
          // Email
          const creator = await (UserModel as any).findById(creatorId).select("email fullName username");
          if (creator?.email) {
            const { sendTaskCompletedEmail } = await import("./email");
            await sendTaskCompletedEmail(
              creator.email,
              creator.fullName || creator.username,
              before.title,
              before.category || "عام",
              user.fullName || user.username
            );
          }
        } catch (e) { console.error("[Checklist] complete notify error:", e); }
      }
    } catch (err) {
      res.status(500).json({ error: "فشل التحديث" });
    }
  });

  app.delete("/api/checklist/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ChecklistItemModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      await (ChecklistItemModel as any).findOneAndDelete({ _id: req.params.id, $or: [{ userId: uid }, { assignedTo: uid }] });
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

  // Admin: get all client subscriptions (enhanced with countdown + urgency)
  app.get("/api/admin/subscriptions", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","accountant"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { UserModel } = await import("./models");
      const now = new Date();
      // Auto-expire
      await UserModel.updateMany(
        { role: "client", subscriptionStatus: "active", subscriptionExpiresAt: { $lt: now } },
        { $set: { subscriptionStatus: "expired" } }
      );
      const users = await UserModel.find({ role: "client", subscriptionStatus: { $in: ["active","expired","suspended"] } })
        .select("fullName email subscriptionSegmentNameAr subscriptionPeriod subscriptionStartDate subscriptionExpiresAt subscriptionStatus renewalReminderSentAt")
        .lean();
      // Compute urgency fields per client
      const result = users.map((u: any) => {
        const start = u.subscriptionStartDate ? new Date(u.subscriptionStartDate) : null;
        const end = u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt) : null;
        const totalMs = start && end ? end.getTime() - start.getTime() : null;
        const remainingMs = end ? Math.max(0, end.getTime() - now.getTime()) : null;
        const remainingDays = remainingMs !== null ? Math.ceil(remainingMs / 86400000) : null;
        const percentRemaining = totalMs && remainingMs !== null ? Math.round((remainingMs / totalMs) * 100) : null;
        const needsRenewal = percentRemaining !== null && percentRemaining <= 10 && u.subscriptionStatus === "active";
        return { ...u, id: String(u._id), totalMs, remainingDays, percentRemaining, needsRenewal };
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "فشل تحميل الاشتراكات" });
    }
  });

  // Admin: quick renewal (extend by same period from today or end of current subscription)
  app.post("/api/admin/users/:id/subscription/renew", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { UserModel, NotificationModel } = await import("./models");
      const user = await UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "العميل غير موجود" });
      const { segmentId, segmentNameAr, period, startFrom } = req.body; // startFrom: "today"|"expiry"
      const currentPeriod = period || (user as any).subscriptionPeriod;
      const durationDays = currentPeriod === "monthly" ? 30 : currentPeriod === "6months" ? 180 : 365;
      const baseDate = startFrom === "expiry" && (user as any).subscriptionExpiresAt
        ? new Date((user as any).subscriptionExpiresAt)
        : new Date();
      const newExpiry = new Date(baseDate.getTime() + durationDays * 86400000);
      const updates: any = {
        subscriptionStatus: "active",
        subscriptionStartDate: baseDate,
        subscriptionExpiresAt: newExpiry,
        subscriptionPeriod: currentPeriod,
        renewalReminderSentAt: null, // Reset reminder flag
      };
      if (segmentId) updates.subscriptionSegmentId = segmentId;
      if (segmentNameAr) updates.subscriptionSegmentNameAr = segmentNameAr;
      await UserModel.findByIdAndUpdate(user._id, { $set: updates });
      // Notify client
      await NotificationModel.create({
        userId: String(user._id), type: 'subscription',
        title: '✅ تم تجديد اشتراكك',
        body: `تم تجديد اشتراكك حتى ${newExpiry.toLocaleDateString("ar-SA")}`,
        link: '/dashboard', icon: '🎉',
      }).catch(() => {});
      pushNotification(String(user._id), { title: 'تم تجديد اشتراكك', body: `ينتهي بتاريخ ${newExpiry.toLocaleDateString("ar-SA")}`, icon: '🎉', link: '/dashboard' });
      res.json({ success: true, newExpiry });
    } catch (err) {
      res.status(500).json({ error: "فشل تجديد الاشتراك" });
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

  // ============================================================
  // CONSULTATION SLOTS (Employee sets availability)
  // ============================================================
  app.get("/api/consultation/slots", async (req, res) => {
    try {
      const { ConsultationSlotModel } = await import("./models");
      const slots = await ConsultationSlotModel.find({ isActive: true }).sort({ createdAt: -1 });
      res.json(slots);
    } catch { res.status(500).json({ error: "فشل تحميل المواعيد" }); }
  });

  app.get("/api/admin/consultation/slots", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const allowed = ["admin","manager","developer","designer","support","sales","sales_manager","accountant"];
    if (!allowed.includes(user.role)) return res.sendStatus(403);
    try {
      const { ConsultationSlotModel } = await import("./models");
      const query = ["admin","manager"].includes(user.role) ? {} : { employeeId: user._id || user.id };
      const slots = await ConsultationSlotModel.find(query).sort({ createdAt: -1 });
      res.json(slots);
    } catch { res.status(500).json({ error: "فشل تحميل المواعيد" }); }
  });

  app.post("/api/admin/consultation/slots", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const allowed = ["admin","manager","developer","designer","support","sales","sales_manager","accountant"];
    if (!allowed.includes(user.role)) return res.sendStatus(403);
    try {
      const { ConsultationSlotModel } = await import("./models");
      const slot = await ConsultationSlotModel.create({
        ...req.body,
        employeeId: user._id || user.id,
        employeeName: user.fullName || user.username,
      });
      res.status(201).json(slot);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/admin/consultation/slots/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    try {
      const { ConsultationSlotModel } = await import("./models");
      const slot = await ConsultationSlotModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
      if (!slot) return res.status(404).json({ error: "غير موجود" });
      res.json(slot);
    } catch { res.status(500).json({ error: "فشل التحديث" }); }
  });

  app.delete("/api/admin/consultation/slots/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { ConsultationSlotModel } = await import("./models");
      await ConsultationSlotModel.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch { res.status(500).json({ error: "فشل الحذف" }); }
  });

  // ============================================================
  // CONSULTATION BOOKINGS (Client books a slot)
  // ============================================================
  app.get("/api/consultation/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    try {
      const { ConsultationBookingModel } = await import("./models");
      const bookings = await ConsultationBookingModel.find({ clientId: user._id || user.id }).sort({ createdAt: -1 });
      res.json(bookings);
    } catch { res.status(500).json({ error: "فشل تحميل الحجوزات" }); }
  });

  app.get("/api/admin/consultation/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const allowed = ["admin","manager","developer","designer","support","sales","sales_manager","accountant"];
    if (!allowed.includes(user.role)) return res.sendStatus(403);
    try {
      const { ConsultationBookingModel } = await import("./models");
      const query = ["admin","manager"].includes(user.role) ? {} : { employeeId: user._id || user.id };
      const bookings = await ConsultationBookingModel.find(query).sort({ createdAt: -1 });
      res.json(bookings);
    } catch { res.status(500).json({ error: "فشل تحميل الحجوزات" }); }
  });

  app.post("/api/consultation/book", async (req, res) => {
    try {
      const { ConsultationBookingModel, UserModel } = await import("./models");
      const user = req.isAuthenticated() ? (req.user as any) : null;
      const { clientName, clientEmail, clientPhone, consultationType, topic, notes } = req.body;
      if (!clientName || !clientEmail) {
        return res.status(400).json({ error: "الاسم والبريد الإلكتروني مطلوبان" });
      }

      const booking = await ConsultationBookingModel.create({
        clientName, clientEmail, clientPhone: clientPhone || "",
        clientId: user?._id || user?.id || null,
        consultationType: consultationType || "phone",
        topic: topic || "", notes: notes || "",
        status: "pending",
      });

      // Notify all admins/managers
      const admins = await UserModel.find({ role: { $in: ["admin", "manager"] } }, { email: 1, fullName: 1 });
      for (const staff of admins) {
        if (staff.email) {
          sendConsultationNotificationEmail(staff.email, staff.fullName || staff.email, {
            bookingId: String(booking._id || booking.id),
            clientName, clientEmail, clientPhone: clientPhone || "",
            date: "سيتم التحديد لاحقاً", startTime: "", endTime: "",
            consultationType: consultationType || "phone",
            topic: topic || "استشارة عامة",
          }).catch(console.error);
        }
      }

      res.status(201).json(booking);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/admin/consultation/bookings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const allowed = ["admin","manager","developer","designer","support","sales","sales_manager","accountant"];
    if (!allowed.includes(user.role)) return res.sendStatus(403);
    try {
      const { ConsultationBookingModel } = await import("./models");
      const update = { ...req.body };
      const booking = await ConsultationBookingModel.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
      if (!booking) return res.status(404).json({ error: "غير موجود" });

      // If confirmed, send email to client
      if (req.body.status === "confirmed" && booking.clientEmail) {
        const dateStr = new Date(booking.date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        sendConsultationConfirmationEmail(booking.clientEmail, booking.clientName, {
          bookingId: String(booking._id || booking.id),
          date: dateStr, startTime: booking.startTime, endTime: booking.endTime,
          employeeName: booking.employeeName,
          consultationType: booking.consultationType,
          topic: booking.topic || "استشارة عامة",
          meetingLink: booking.meetingLink,
        }).catch(console.error);
      }

      res.json(booking);
    } catch { res.status(500).json({ error: "فشل التحديث" }); }
  });

  app.delete("/api/admin/consultation/bookings/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { ConsultationBookingModel } = await import("./models");
      await ConsultationBookingModel.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch { res.status(500).json({ error: "فشل الحذف" }); }
  });

  // ============================================================
  // DISCOUNT CODES
  // ============================================================
  app.get("/api/discount-codes/public", async (_req, res) => {
    try {
      const { DiscountCodeModel } = await import("./models");
      const now = new Date();
      const codes = await DiscountCodeModel.find({
        isActive: true, showOnHome: true,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
      }).select("-usageLimit -usageCount -createdBy");
      res.json(codes);
    } catch { res.status(500).json({ error: "فشل" }); }
  });

  app.get("/api/admin/discount-codes", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { DiscountCodeModel } = await import("./models");
      const codes = await DiscountCodeModel.find().sort({ createdAt: -1 });
      res.json(codes);
    } catch { res.status(500).json({ error: "فشل" }); }
  });

  app.post("/api/admin/discount-codes", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { DiscountCodeModel } = await import("./models");
      const user = req.user as any;
      const data = { ...req.body, code: String(req.body.code || "").toUpperCase(), createdBy: user._id || user.id };
      const code = await DiscountCodeModel.create(data);
      res.status(201).json(code);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/admin/discount-codes/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { DiscountCodeModel } = await import("./models");
      const update = { ...req.body };
      if (update.code) update.code = String(update.code).toUpperCase();
      const code = await DiscountCodeModel.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
      if (!code) return res.status(404).json({ error: "غير موجود" });
      res.json(code);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.delete("/api/admin/discount-codes/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { DiscountCodeModel } = await import("./models");
      await DiscountCodeModel.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch { res.status(500).json({ error: "فشل الحذف" }); }
  });

  app.post("/api/discount-codes/validate", async (req, res) => {
    try {
      const { DiscountCodeModel } = await import("./models");
      const { code, orderAmount = 0, appliesTo = "all" } = req.body;
      if (!code) return res.status(400).json({ error: "الكود مطلوب" });
      const now = new Date();
      const discount = await DiscountCodeModel.findOne({
        code: String(code).toUpperCase(), isActive: true,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
      });
      if (!discount) return res.status(404).json({ error: "الكود غير صحيح أو منتهي الصلاحية" });
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        return res.status(400).json({ error: "تم استنفاد هذا الكود" });
      }
      if (discount.minOrderAmount && orderAmount < discount.minOrderAmount) {
        return res.status(400).json({ error: `الحد الأدنى للطلب ${discount.minOrderAmount} ${discount.currency || 'SAR'}` });
      }
      let discountAmount = 0;
      if (discount.type === "percentage") {
        discountAmount = (orderAmount * discount.value) / 100;
        if (discount.maxDiscountAmount) discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
      } else {
        discountAmount = Math.min(discount.value, orderAmount);
      }
      res.json({ valid: true, code: discount.code, type: discount.type, value: discount.value, discountAmount: Math.round(discountAmount), description: discount.descriptionAr || discount.description });
    } catch { res.status(500).json({ error: "فشل التحقق من الكود" }); }
  });

  // ============================================================
  // DEVICE SHIPMENT TRACKING
  // ============================================================
  app.get("/api/admin/shipments", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { DeviceShipmentModel } = await import("./models");
      const shipments = await DeviceShipmentModel.find().sort({ createdAt: -1 });
      res.json(shipments);
    } catch { res.status(500).json({ error: "فشل تحميل الشحنات" }); }
  });

  app.get("/api/shipments/my", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    try {
      const { DeviceShipmentModel } = await import("./models");
      const shipments = await DeviceShipmentModel.find({ clientId: user._id || user.id }).sort({ createdAt: -1 });
      res.json(shipments);
    } catch { res.status(500).json({ error: "فشل تحميل الشحنات" }); }
  });

  app.post("/api/admin/shipments", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { DeviceShipmentModel } = await import("./models");
      const shipment = await DeviceShipmentModel.create({
        ...req.body,
        statusHistory: [{ status: req.body.status || "pending", note: "تم إنشاء الشحنة", timestamp: new Date() }],
      });
      res.status(201).json(shipment);
    } catch (err: any) { res.status(500).json({ error: translateError(err) }); }
  });

  app.patch("/api/admin/shipments/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { DeviceShipmentModel } = await import("./models");
      const update: any = { ...req.body };
      const shipment = await DeviceShipmentModel.findById(req.params.id);
      if (!shipment) return res.status(404).json({ error: "غير موجود" });

      if (req.body.status && req.body.status !== shipment.status) {
        await DeviceShipmentModel.findByIdAndUpdate(req.params.id, {
          $push: { statusHistory: { status: req.body.status, note: req.body.statusNote || "", timestamp: new Date() } },
          $set: update,
        });
        // Notify client by email
        if (shipment.clientEmail) {
          sendShipmentUpdateEmail(shipment.clientEmail, shipment.clientName || "", {
            orderId: String(shipment._id || shipment.id),
            productName: shipment.productName || "منتج",
            status: req.body.status,
            trackingNumber: req.body.trackingNumber || shipment.trackingNumber,
            courierName: req.body.courierName || shipment.courierName,
            courierUrl: req.body.courierUrl || shipment.courierUrl,
            estimatedDelivery: req.body.estimatedDelivery ? new Date(req.body.estimatedDelivery).toLocaleDateString('ar-SA') : undefined,
            note: req.body.statusNote,
          }).catch(console.error);
        }
      } else {
        await DeviceShipmentModel.findByIdAndUpdate(req.params.id, { $set: update });
      }

      const updated = await DeviceShipmentModel.findById(req.params.id);
      res.json(updated);
    } catch { res.status(500).json({ error: "فشل التحديث" }); }
  });

  app.delete("/api/admin/shipments/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { DeviceShipmentModel } = await import("./models");
      await DeviceShipmentModel.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch { res.status(500).json({ error: "فشل الحذف" }); }
  });

  // ─── System Features & Extra Addons ──────────────────────────────────────────
  const { SystemFeatureModel, ExtraAddonModel } = await import("./models");

  app.get("/api/system-features", async (_req, res) => {
    try {
      const features = await SystemFeatureModel.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
      res.json(features);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/admin/system-features", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const features = await SystemFeatureModel.find().sort({ sortOrder: 1, createdAt: 1 });
      res.json(features);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/admin/system-features", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const f = await SystemFeatureModel.create(req.body);
      res.json(f);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.put("/api/admin/system-features/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const f = await SystemFeatureModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(f);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/admin/system-features/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      await SystemFeatureModel.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/extra-addons", async (req, res) => {
    try {
      const { segment, plan } = req.query as { segment?: string; plan?: string };
      const addons = await ExtraAddonModel.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
      const filtered = addons.filter((a: any) => {
        const segOk = !a.segments?.length || !segment || a.segments.includes(segment);
        const planOk = !a.plans?.length || !plan || a.plans.includes(plan);
        return segOk && planOk;
      });
      res.json(filtered);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/admin/extra-addons", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const addons = await ExtraAddonModel.find().sort({ sortOrder: 1, createdAt: 1 });
      res.json(addons);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/admin/extra-addons", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const a = await ExtraAddonModel.create(req.body);
      res.json(a);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.put("/api/admin/extra-addons/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const a = await ExtraAddonModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(a);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/admin/extra-addons/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const deleted = await ExtraAddonModel.findByIdAndDelete(req.params.id);
      if (!deleted) {
        console.warn(`[ExtraAddon] Delete failed — document not found: ${req.params.id}`);
        return res.status(404).json({ error: "الإضافة غير موجودة أو تم حذفها مسبقاً" });
      }
      console.log(`[ExtraAddon] Deleted: ${deleted.nameAr} (${req.params.id})`);
      res.json({ ok: true });
    } catch (err: any) {
      console.error(`[ExtraAddon] Delete error for ${req.params.id}:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/extra-addons/seed-defaults", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const defaults = [
      // ── التطبيقات (لجميع القطاعات، باقة pro وinfinite فأعلى)
      { nameAr: "نشر على App Store (iOS)", name: "iOS App Store Publishing", descriptionAr: "رفع التطبيق ونشره على متجر Apple — يشمل إعداد الحساب والمراجعة", category: "app", price: 4500, icon: "Smartphone", sortOrder: 10, segments: [], plans: ["pro","infinite"] },
      { nameAr: "نشر على Play Store (Android)", name: "Android Play Store Publishing", descriptionAr: "رفع التطبيق ونشره على متجر Google Play — يشمل الإعداد والاختبار", category: "app", price: 3500, icon: "Smartphone", sortOrder: 11, segments: [], plans: ["pro","infinite"] },
      { nameAr: "تطبيق iOS + Android معاً", name: "iOS & Android Bundle", descriptionAr: "نشر على المتجرين معاً بسعر مخفض — وفر 1500 ر.س", category: "app", price: 6500, icon: "Smartphone", sortOrder: 12, segments: [], plans: ["pro","infinite"] },
      // ── قواعد البيانات
      { nameAr: "قاعدة بيانات 10 GB", name: "Database 10GB", descriptionAr: "قاعدة بيانات منفصلة بسعة 10 جيجا — مناسب للمشاريع الصغيرة", category: "hosting", price: 300, icon: "Database", sortOrder: 20, segments: [], plans: [] },
      { nameAr: "قاعدة بيانات 50 GB", name: "Database 50GB", descriptionAr: "قاعدة بيانات 50 جيجا — مناسب للمشاريع المتوسطة ذات البيانات الكبيرة", category: "hosting", price: 700, icon: "Database", sortOrder: 21, segments: [], plans: ["pro","infinite"] },
      { nameAr: "قاعدة بيانات 200 GB (Enterprise)", name: "Database 200GB", descriptionAr: "قاعدة بيانات 200 جيجا — للمشاريع الكبيرة والمؤسسات", category: "hosting", price: 1800, icon: "Database", sortOrder: 22, segments: [], plans: ["infinite"] },
      // ── الاستضافة
      { nameAr: "استضافة على سيرفر مشترك", name: "Shared Hosting", descriptionAr: "استضافة على سيرفر مشترك — مناسب للمشاريع الأولية", category: "hosting", price: 250, icon: "Cloud", sortOrder: 30, segments: [], plans: ["lite"] },
      { nameAr: "استضافة VPS مخصص", name: "VPS Hosting", descriptionAr: "سيرفر VPS مخصص بأداء عالي وموارد مضمونة", category: "hosting", price: 900, icon: "Server", sortOrder: 31, segments: [], plans: ["pro","infinite"] },
      { nameAr: "استضافة Cloud (AWS/GCP)", name: "Cloud Hosting", descriptionAr: "استضافة على السحابة لضمان التوسّع والأداء العالي", category: "hosting", price: 2000, icon: "Cloud", sortOrder: 32, segments: [], plans: ["infinite"] },
      // ── التكاملات العامة
      { nameAr: "بوابة دفع إلكتروني (مدى / Apple Pay)", name: "Payment Gateway", descriptionAr: "ربط بوابة الدفع بمدى وApple Pay وبطاقات الائتمان", category: "integration", price: 800, icon: "CreditCard", sortOrder: 40, segments: [], plans: [] },
      { nameAr: "تكامل واتساب (WhatsApp Business)", name: "WhatsApp Integration", descriptionAr: "إرسال إشعارات وتنبيهات للعملاء عبر واتساب بيزنس", category: "integration", price: 400, icon: "MessageCircle", sortOrder: 41, segments: [], plans: [] },
      { nameAr: "تكامل زيد للدفع", name: "Zid Integration", descriptionAr: "ربط المتجر بمنصة زيد للمبيعات والمخزون", category: "integration", price: 600, icon: "Link", sortOrder: 42, segments: ["ecommerce","store","commerce"], plans: [] },
      { nameAr: "تكامل سلة", name: "Salla Integration", descriptionAr: "ربط المتجر بمنصة سلة للبيع الإلكتروني", category: "integration", price: 600, icon: "Link", sortOrder: 43, segments: ["ecommerce","store","commerce"], plans: [] },
      // ── التسويق والـ SEO
      { nameAr: "SEO متقدم + تحليلات", name: "Advanced SEO & Analytics", descriptionAr: "تهيئة SEO الشاملة وربط Google Analytics ولوحة البحث", category: "marketing", price: 700, icon: "TrendingUp", sortOrder: 50, segments: [], plans: [] },
      { nameAr: "تسويق عبر الإيميل", name: "Email Marketing", descriptionAr: "نظام رسائل إيميل تسويقي مع قوالب احترافية", category: "marketing", price: 500, icon: "Mail", sortOrder: 51, segments: [], plans: ["pro","infinite"] },
      // ── التصميم والدعم
      { nameAr: "هوية بصرية كاملة", name: "Full Brand Identity", descriptionAr: "شعار + ألوان + خطوط + دليل الهوية البصرية على Figma", category: "design", price: 1800, icon: "Palette", sortOrder: 60, segments: [], plans: [] },
      { nameAr: "دعم فني شهري", name: "Monthly Technical Support", descriptionAr: "دعم فني شهري وإصلاح الأخطاء والتحديثات الأمنية", category: "support", price: 500, icon: "Headphones", sortOrder: 70, segments: [], plans: [] },
      { nameAr: "دعم فني سنوي", name: "Annual Technical Support", descriptionAr: "خطة دعم سنوية بخصم 20% — شاملة الصيانة والتحديثات", category: "support", price: 4800, icon: "Headphones", sortOrder: 71, segments: [], plans: ["pro","infinite"] },
      // ── إضافات خاصة بقطاعات
      { nameAr: "نظام حجوزات (Reservation System)", name: "Reservation System", descriptionAr: "نظام حجز طاولة أو موعد مع تأكيد تلقائي للعميل", category: "feature", price: 1200, icon: "CalendarCheck", sortOrder: 80, segments: ["restaurant","food","healthcare","beauty","fitness"], plans: [] },
      { nameAr: "نظام توصيل وتتبع الطلبات", name: "Delivery Tracking", descriptionAr: "تتبع الطلبات لحظياً مع إشعارات للعميل والمطعم", category: "feature", price: 1500, icon: "MapPin", sortOrder: 81, segments: ["restaurant","food","ecommerce","store"], plans: ["pro","infinite"] },
      { nameAr: "لوحة تحكم تحليلات المبيعات", name: "Sales Analytics Dashboard", descriptionAr: "لوحة تحليل مبيعات وتقارير يومية وأسبوعية وشهرية", category: "feature", price: 900, icon: "BarChart3", sortOrder: 82, segments: [], plans: ["pro","infinite"] },
      { nameAr: "نظام إدارة الطلاب والكورسات", name: "LMS (Student Management)", descriptionAr: "نظام إدارة الطلاب والدورات والاختبارات والشهادات", category: "feature", price: 2000, icon: "GraduationCap", sortOrder: 83, segments: ["education"], plans: [] },
      { nameAr: "نظام CRM لإدارة العملاء", name: "CRM System", descriptionAr: "نظام إدارة علاقات العملاء وتتبع المتابعات والصفقات", category: "feature", price: 1600, icon: "Users", sortOrder: 84, segments: ["corporate","realestate","healthcare"], plans: ["pro","infinite"] },
      // ── بوابة Paymob
      { nameAr: "بوابة Paymob للدفع الإلكتروني", name: "Paymob Payment Gateway", descriptionAr: "ربط بوابة Paymob — تدعم مدى، فيزا، ماستر، Apple Pay، وتحويل بنكي", category: "integration", price: 100, icon: "CreditCard", sortOrder: 44, segments: [], plans: [], billingType: "one_time", includedInPlans: ["pro","infinite"], freeQuotaForIncluded: 0 },
      // ── التوافق مع نفاذ
      { nameAr: "التوافق مع نفاذ (Nafath)", name: "Nafath Compliance", descriptionAr: "تكامل منصة نفاذ للهوية الرقمية وتسجيل الدخول الآمن بالبطاقة الوطنية", category: "integration", price: 2000, icon: "Shield", sortOrder: 45, segments: [], plans: ["pro","infinite"], billingType: "annual", compatiblePeriods: ["annual","lifetime"] },
      // ── الرسائل النصية
      { nameAr: "رسائل نصية SMS (500 رسالة/شهر)", name: "SMS 500 Monthly", descriptionAr: "500 رسالة نصية شهرية — إشعارات وتنبيهات وتسويق للعملاء", category: "communication", price: 100, icon: "MessageSquare", sortOrder: 90, segments: [], plans: [], billingType: "monthly", quotaCount: 500, quotaLabel: "رسالة" },
      // ── خدمات البريد الإلكتروني
      { nameAr: "خدمات البريد الإلكتروني (1000 رسالة)", name: "Transactional Email 1000", descriptionAr: "إرسال 1000 بريد إلكتروني — للإشعارات والتنبيهات والتسويق. تأتي مجانًا مع الباقات برو والإنفينتي", category: "communication", price: 50, icon: "Mail", sortOrder: 91, segments: [], plans: [], billingType: "one_time", quotaCount: 1000, quotaLabel: "رسالة بريدية", includedInPlans: ["pro","infinite"], freeQuotaForIncluded: 1000 },
    ] as any[];
    try {
      let added = 0;
      for (const d of defaults) {
        const exists = await ExtraAddonModel.findOne({ nameAr: d.nameAr });
        if (!exists) { await ExtraAddonModel.create({ ...d, isActive: true, currency: "SAR" }); added++; }
      }
      res.json({ ok: true, added, skipped: defaults.length - added });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ─── Cron Jobs ───────────────────────────────────────────────────────────────
  const { scheduleCronJob, stopCronJob, runJobNow, testJobConnection } = await import("./cron");
  const { CronJobModel, AtlasConfigModel, AtlasDbUserModel, AppPublishConfigModel } = await import("./models");

  app.get("/api/admin/cron-jobs", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    const jobs = await CronJobModel.find().sort({ createdAt: -1 });
    res.json(jobs);
  });

  app.post("/api/admin/cron-jobs", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { name, nameAr, description, url, method, headers, body, schedule, projectId } = req.body;
      if (!name || !url || !schedule) return res.status(400).json({ error: "اسم، رابط، والجدول مطلوبة" });
      const nodeCron = await import("node-cron");
      if (!nodeCron.default.validate(schedule)) return res.status(400).json({ error: "جدول cron غير صالح" });
      const job = await CronJobModel.create({
        name, nameAr: nameAr||"", description: description||"", url, method: method||"GET",
        headers: headers||{}, body: body||"", schedule, isActive: true,
        createdBy: (req.user as any).username, projectId: projectId||"",
      });
      scheduleCronJob(String(job._id), job.schedule);
      res.json(job);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.patch("/api/admin/cron-jobs/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const job = await CronJobModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!job) return res.status(404).json({ error: "غير موجود" });
      if (job.isActive) scheduleCronJob(String(job._id), job.schedule);
      else stopCronJob(String(job._id));
      res.json(job);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/admin/cron-jobs/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    stopCronJob(req.params.id);
    await CronJobModel.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });

  app.post("/api/admin/cron-jobs/:id/run", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    await runJobNow(req.params.id);
    const job = await CronJobModel.findById(req.params.id);
    res.json(job);
  });

  app.get("/api/admin/cron-jobs/:id/logs", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    const job = await CronJobModel.findById(req.params.id).select("runLogs name nameAr");
    if (!job) return res.sendStatus(404);
    const logs = [...(job.runLogs || [])].reverse().slice(0, 100);
    res.json(logs);
  });

  app.post("/api/admin/cron-jobs/test", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    const { url, method, headers, body } = req.body;
    if (!url) return res.status(400).json({ error: "الرابط مطلوب" });
    const result = await testJobConnection(url, method||"GET", headers||{}, body||"");
    res.json(result);
  });

  // ─── MongoDB Atlas Config ─────────────────────────────────────────────────────
  const { atlasTestConnection, atlasListProjects, atlasListClusters, atlasCreateDbUser, atlasGetConnectionString, atlasListDbUsers, atlasDeleteDbUser } = await import("./atlas");

  app.get("/api/admin/atlas/configs", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    const configs = await AtlasConfigModel.find().sort({ createdAt: -1 }).lean();
    const safe = configs.map(c => ({ ...c, privateKey: "***" }));
    res.json(safe);
  });

  app.post("/api/admin/atlas/configs", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { label, publicKey, privateKey, orgId, projectId, projectName, clusterName, isDefault } = req.body;
      if (!label || !publicKey || !privateKey) return res.status(400).json({ error: "التسمية والمفاتيح مطلوبة" });
      if (isDefault) await AtlasConfigModel.updateMany({}, { isDefault: false });
      const config = await AtlasConfigModel.create({
        label, publicKey, privateKey, orgId: orgId||"", projectId: projectId||"",
        projectName: projectName||"", clusterName: clusterName||"", isDefault: isDefault||false,
        createdBy: (req.user as any).username,
      });
      res.json({ ...config.toJSON(), privateKey: "***" });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.put("/api/admin/atlas/configs/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { isDefault, ...rest } = req.body;
      if (isDefault) await AtlasConfigModel.updateMany({}, { isDefault: false });
      const c = await AtlasConfigModel.findByIdAndUpdate(req.params.id, { ...rest, ...(isDefault !== undefined ? { isDefault } : {}) }, { new: true });
      res.json({ ...c?.toJSON(), privateKey: "***" });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/admin/atlas/configs/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    await AtlasConfigModel.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });

  app.post("/api/admin/atlas/test", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    const { publicKey, privateKey } = req.body;
    if (!publicKey || !privateKey) return res.status(400).json({ error: "المفاتيح مطلوبة" });
    const result = await atlasTestConnection(publicKey, privateKey);
    res.json(result);
  });

  app.get("/api/admin/atlas/projects", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    const { configId } = req.query as any;
    const config = await AtlasConfigModel.findById(configId);
    if (!config) return res.status(404).json({ error: "الإعداد غير موجود" });
    try {
      const projects = await atlasListProjects(config.publicKey, config.privateKey);
      res.json(projects);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/admin/atlas/clusters", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    const { configId, projectId } = req.query as any;
    const config = await AtlasConfigModel.findById(configId);
    if (!config) return res.status(404).json({ error: "الإعداد غير موجود" });
    try {
      const clusters = await atlasListClusters(config.publicKey, config.privateKey, projectId || config.projectId);
      res.json(clusters);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/admin/atlas/db-users", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    const { configId } = req.query as any;
    const dbUsers = await AtlasDbUserModel.find(configId ? { configId } : {}).sort({ createdAt: -1 });
    res.json(dbUsers);
  });

  app.post("/api/admin/atlas/db-users", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { configId, clientId, clientName, username, password, databaseName, notes } = req.body;
      if (!configId || !username || !password || !databaseName) return res.status(400).json({ error: "بيانات ناقصة" });
      const config = await AtlasConfigModel.findById(configId);
      if (!config) return res.status(404).json({ error: "الإعداد غير موجود" });

      await atlasCreateDbUser(config.publicKey, config.privateKey, config.projectId, config.clusterName, username, password, databaseName);
      const connStr = await atlasGetConnectionString(config.publicKey, config.privateKey, config.projectId, config.clusterName, username, password, databaseName);

      const dbUser = await AtlasDbUserModel.create({
        configId, clientId: clientId||"", clientName: clientName||"",
        username, password, databaseName, roles: ["readWrite","dbAdmin"],
        connectionString: connStr, notes: notes||"",
        createdBy: (req.user as any).username,
      });
      res.json(dbUser);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/admin/atlas/db-users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const dbUser = await AtlasDbUserModel.findById(req.params.id);
      if (!dbUser) return res.status(404).json({ error: "غير موجود" });
      const config = await AtlasConfigModel.findById(dbUser.configId);
      if (config) await atlasDeleteDbUser(config.publicKey, config.privateKey, config.projectId, dbUser.username);
      await AtlasDbUserModel.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ─── System Connection Settings ──────────────────────────────────────────────
  app.get("/api/admin/connection-settings", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const { connManager } = await import("./connection-manager");
    const { loadSystemSettings } = await import("./system-settings");
    const saved = await loadSystemSettings();
    const status = connManager.getStatus();
    res.json({
      status,
      settings: {
        mainDbUri: saved.mainDbUri || "",
        prevMainDbUri: saved.prevMainDbUri || "",
        qmeetDbUri: saved.qmeetDbUri || "",
        prevQmeetDbUri: saved.prevQmeetDbUri || "",
        smtp2goApiKey: saved.smtp2goApiKey ? "****" + saved.smtp2goApiKey.slice(-4) : "",
        smtp2goSender: saved.smtp2goSender || "",
        smtp2goSenderName: saved.smtp2goSenderName || "",
        emailLogoUrl: saved.emailLogoUrl || "",
        emailSiteUrl: saved.emailSiteUrl || "",
        smtp2goApiKeySet: !!(saved.smtp2goApiKey),
      },
      env: {
        mainDbUri: process.env.MONGODB_URI ? "****" + process.env.MONGODB_URI.slice(-6) : "",
        smtp2goApiKey: process.env.SMTP2GO_API_KEY ? "****" + process.env.SMTP2GO_API_KEY.slice(-4) : "",
        smtp2goSender: process.env.SMTP2GO_SENDER || "",
      },
    });
  });

  app.post("/api/admin/connection-settings/main-db", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const { uri } = req.body;
    if (!uri || typeof uri !== "string" || !uri.startsWith("mongodb")) {
      return res.status(400).json({ error: "URI غير صالح. يجب أن يبدأ بـ mongodb:// أو mongodb+srv://" });
    }
    try {
      const mongoose = await import("mongoose");
      const testConn = mongoose.default.createConnection(uri);
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          testConn.close().catch(() => {});
          reject(new Error("انتهت مهلة الاتصال (10 ثانية). تحقق من الـ URI وصلاحيات الشبكة."));
        }, 10000);
        testConn.once("connected", () => { clearTimeout(timer); testConn.close().then(resolve).catch(resolve); });
        testConn.once("error", (e) => { clearTimeout(timer); reject(new Error("فشل الاتصال: " + e.message)); });
      });

      const { connManager } = await import("./connection-manager");
      const { saveSystemSettings } = await import("./system-settings");
      const prevUri = connManager.primaryUri;
      await saveSystemSettings({ mainDbUri: uri, prevMainDbUri: prevUri });
      await connManager.switchMain(uri, prevUri);
      res.json({ ok: true, message: "تم تغيير قاعدة البيانات الرئيسية بنجاح وإعادة الاتصال" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/admin/connection-settings/qmeet-db", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const { uri } = req.body;
    if (!uri || typeof uri !== "string" || !uri.startsWith("mongodb")) {
      return res.status(400).json({ error: "URI غير صالح" });
    }
    try {
      const mongoose = await import("mongoose");
      const testConn = mongoose.default.createConnection(uri);
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { testConn.close().catch(() => {}); reject(new Error("انتهت مهلة الاتصال")); }, 10000);
        testConn.once("connected", () => { clearTimeout(timer); testConn.close().then(resolve).catch(resolve); });
        testConn.once("error", (e) => { clearTimeout(timer); reject(new Error("فشل الاتصال: " + e.message)); });
      });

      const { connManager } = await import("./connection-manager");
      const { saveSystemSettings } = await import("./system-settings");
      const prevUri = connManager.qmeetUri;
      await saveSystemSettings({ qmeetDbUri: uri, prevQmeetDbUri: prevUri });
      await connManager.switchQMeet(uri, prevUri);
      res.json({ ok: true, message: "تم تغيير قاعدة بيانات الاجتماعات بنجاح وإعادة الاتصال" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/admin/connection-settings/email", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const { smtp2goApiKey, smtp2goSender, smtp2goSenderName, emailLogoUrl, emailSiteUrl } = req.body;
    const updates: Record<string, string> = {};
    if (smtp2goApiKey && smtp2goApiKey.length > 8 && !smtp2goApiKey.startsWith("****")) updates.smtp2goApiKey = smtp2goApiKey;
    if (smtp2goSender !== undefined && smtp2goSender !== "") updates.smtp2goSender = smtp2goSender;
    if (smtp2goSenderName !== undefined && smtp2goSenderName !== "") updates.smtp2goSenderName = smtp2goSenderName;
    if (emailLogoUrl !== undefined) updates.emailLogoUrl = emailLogoUrl;
    if (emailSiteUrl !== undefined) updates.emailSiteUrl = emailSiteUrl;
    try {
      const { connManager } = await import("./connection-manager");
      const { saveSystemSettings } = await import("./system-settings");
      await saveSystemSettings(updates);
      connManager.setEmailSettings({
        apiKey: updates.smtp2goApiKey,
        sender: updates.smtp2goSender,
        senderName: updates.smtp2goSenderName,
        logoUrl: updates.emailLogoUrl,
        siteUrl: updates.emailSiteUrl,
      } as any);
      res.json({ ok: true, message: "تم حفظ إعدادات البريد بنجاح" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/admin/connection-settings/test-email", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const { sendTestEmail } = await import("./email");
      const user = req.user as any;
      const ok = await sendTestEmail(user.email, user.fullName || user.username);
      res.json({ ok, message: ok ? "تم إرسال بريد اختباري بنجاح" : "فشل إرسال البريد - تحقق من مفتاح API" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/admin/connection-settings/migrate-record", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const { collection, id } = req.body;
    if (!collection || !id) return res.status(400).json({ error: "collection و id مطلوبان" });
    try {
      const { connManager } = await import("./connection-manager");
      const secConn = connManager.secondaryConn;
      if (!secConn) return res.status(400).json({ error: "لا يوجد اتصال أرشيف متاح" });
      const mongoose = await import("mongoose");
      const secCollection = secConn.collection(collection);
      let objId: any;
      try { objId = new mongoose.default.Types.ObjectId(id); } catch { objId = id; }
      const doc = await secCollection.findOne({ _id: objId });
      if (!doc) return res.status(404).json({ error: "السجل غير موجود في قاعدة البيانات القديمة" });
      const primaryCollection = mongoose.default.connection.collection(collection);
      const exists = await primaryCollection.findOne({ _id: objId });
      if (!exists) {
        await primaryCollection.insertOne(doc);
      }
      res.json({ ok: true, message: "تم نقل السجل إلى قاعدة البيانات الجديدة بنجاح", doc });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/admin/connection-settings/secondary-search", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const { collection, query } = req.query;
    if (!collection) return res.status(400).json({ error: "collection مطلوب" });
    try {
      const { connManager } = await import("./connection-manager");
      const secConn = connManager.secondaryConn;
      if (!secConn) return res.json({ records: [], hasSecondary: false });
      const col = secConn.collection(String(collection));
      const filter = query ? { $or: [
        { title: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } },
      ]} : {};
      const records = await col.find(filter).limit(20).toArray();
      res.json({ records, hasSecondary: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ─── App Publish Config ───────────────────────────────────────────────────────
  app.get("/api/admin/app-configs", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    const configs = await AppPublishConfigModel.find().sort({ createdAt: -1 });
    res.json(configs);
  });

  app.get("/api/admin/app-configs/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    const config = await AppPublishConfigModel.findById(req.params.id);
    if (!config) return res.status(404).json({ error: "غير موجود" });
    res.json(config);
  });

  app.post("/api/admin/app-configs", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const config = await AppPublishConfigModel.create({
        ...req.body,
        createdBy: (req.user as any).username,
      });
      res.json(config);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.put("/api/admin/app-configs/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const config = await AppPublishConfigModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(config);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/admin/app-configs/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    await AppPublishConfigModel.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });

  app.get("/api/admin/app-configs/:id/export", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    const config = await AppPublishConfigModel.findById(req.params.id);
    if (!config) return res.status(404).json({ error: "غير موجود" });
    const { format = "json" } = req.query as any;
    const data = config.toJSON();
    if (format === "env") {
      const lines = [
        `APP_NAME="${data.appName}"`,
        `APP_VERSION="${data.appVersion}"`,
        `BUILD_NUMBER="${data.buildNumber}"`,
        `ANDROID_PACKAGE="${data.androidPackageName}"`,
        `IOS_BUNDLE_ID="${data.iosBundleId}"`,
        `SITE_URL="${data.siteUrl}"`,
        `API_BASE_URL="${data.apiBaseUrl}"`,
        `PRIMARY_COLOR="${data.primaryColor}"`,
        `SPLASH_COLOR="${data.splashColor}"`,
      ].join("\n");
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="${data.appName}.env"`);
      return res.send(lines);
    }
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${data.appName}-config.json"`);
    res.json(data);
  });

  // ─── Client App Publish Config (public view for clients) ──────────────────────
  app.get("/api/my-app-config", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const config = await AppPublishConfigModel.findOne({ clientId: String((req.user as any)._id) });
    res.json(config || null);
  });

  // ═══════════════════════════════════════════════════════════
  // === STORE PUBLISH CONFIG ===
  // ═══════════════════════════════════════════════════════════

  // Public: returns only download URLs + enabled flags (no auth needed)
  app.get("/api/app-downloads", async (req, res) => {
    const { StorePublishConfigModel } = await import("./models");
    const cfg = await StorePublishConfigModel.findOne();
    res.json({
      playStore:   { url: cfg?.playStoreUrl || "", enabled: cfg?.playStoreEnabled ?? false },
      appStore:    { url: cfg?.appStoreUrl || "", enabled: cfg?.appStoreEnabled ?? false },
      msStore:     { url: cfg?.msStoreUrl || "", enabled: cfg?.msStoreEnabled ?? false },
      huaweiStore: { url: cfg?.huaweiStoreUrl || "", enabled: cfg?.huaweiStoreEnabled ?? false },
    });
  });

  app.get("/api/admin/store-publish-config", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    const { StorePublishConfigModel } = await import("./models");
    let cfg = await StorePublishConfigModel.findOne();
    if (!cfg) cfg = await StorePublishConfigModel.create({});
    res.json(cfg);
  });

  app.put("/api/admin/store-publish-config", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    const { StorePublishConfigModel } = await import("./models");
    let cfg = await StorePublishConfigModel.findOne();
    if (!cfg) {
      cfg = await StorePublishConfigModel.create(req.body);
    } else {
      Object.assign(cfg, req.body);
      await cfg.save();
    }
    res.json(cfg);
  });

  // /.well-known/assetlinks.json — for Android TWA (Play Store + Huawei)
  app.get("/.well-known/assetlinks.json", async (req, res) => {
    const { StorePublishConfigModel } = await import("./models");
    const cfg = await StorePublishConfigModel.findOne();
    const entries: any[] = [];
    if (cfg?.androidPackage && cfg?.androidFingerprint) {
      entries.push({
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: cfg.androidPackage,
          sha256_cert_fingerprints: [cfg.androidFingerprint],
        },
      });
    }
    if (cfg?.huaweiPackage && cfg?.huaweiFingerprint) {
      entries.push({
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: cfg.huaweiPackage,
          sha256_cert_fingerprints: [cfg.huaweiFingerprint],
        },
      });
    }
    res.setHeader("Content-Type", "application/json");
    res.json(entries);
  });

  // /.well-known/apple-app-site-association — for iOS App Clips / Universal Links
  app.get("/.well-known/apple-app-site-association", async (req, res) => {
    const { StorePublishConfigModel } = await import("./models");
    const cfg = await StorePublishConfigModel.findOne();
    const appId = cfg?.appleTeamId && cfg?.appleBundleId
      ? `${cfg.appleTeamId}.${cfg.appleBundleId}`
      : null;
    const aasa: any = {
      applinks: {
        apps: [],
        details: appId ? [{ appID: appId, paths: ["*"] }] : [],
      },
      webcredentials: appId ? { apps: [appId] } : { apps: [] },
    };
    res.setHeader("Content-Type", "application/json");
    res.json(aasa);
  });

  // ═══════════════════════════════════════════════════════
  // ══════════════ TOOLS: HTML Publisher ═══════════════════
  // ═══════════════════════════════════════════════════════

  // Create / update a published HTML page
  app.post("/api/tools/html-publish", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { HtmlPublishModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      const { title, content, id } = req.body;
      if (!content || content.length < 5) return res.status(400).json({ error: "المحتوى مطلوب" });

      let doc: any;
      if (id) {
        doc = await HtmlPublishModel.findOneAndUpdate(
          { _id: id, ownerId: uid },
          { title: title || "صفحتي", content },
          { new: true }
        );
        if (!doc) return res.status(404).json({ error: "الصفحة غير موجودة" });
      } else {
        doc = await HtmlPublishModel.create({ ownerId: uid, title: title || "صفحتي", content });
      }
      const pageUrl = `${req.protocol}://${req.get("host")}/p/${doc._id}`;
      res.json({ id: doc._id, url: pageUrl, title: doc.title });
    } catch (e) {
      res.status(500).json({ error: "فشل النشر" });
    }
  });

  // List my published pages
  app.get("/api/tools/html-publish", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { HtmlPublishModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      const pages = await HtmlPublishModel.find({ ownerId: uid }).sort({ createdAt: -1 }).select("-content");
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      res.json(pages.map((p: any) => ({ ...p.toJSON(), url: `${baseUrl}/p/${p._id}` })));
    } catch (e) {
      res.status(500).json({ error: "فشل الجلب" });
    }
  });

  // Delete a published page
  app.delete("/api/tools/html-publish/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { HtmlPublishModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      await HtmlPublishModel.findOneAndDelete({ _id: req.params.id, ownerId: uid });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: "فشل الحذف" });
    }
  });

  // Public: Serve published HTML page
  app.get("/p/:id", async (req, res) => {
    try {
      const { HtmlPublishModel } = await import("./models");
      const page = await HtmlPublishModel.findById(req.params.id);
      if (!page || !page.isPublic) return res.status(404).send("<h1>الصفحة غير موجودة</h1>");
      await HtmlPublishModel.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(page.content);
    } catch (e) {
      res.status(404).send("<h1>الصفحة غير موجودة</h1>");
    }
  });

  // ═══════════════════════════════════════════════════════
  // ══════════════ TOOLS: URL Shortener ════════════════════
  // ═══════════════════════════════════════════════════════

  // Shorten a URL
  app.post("/api/tools/url-shorten", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ShortUrlModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      const { originalUrl, title } = req.body;
      if (!originalUrl) return res.status(400).json({ error: "الرابط مطلوب" });
      // Validate URL
      try { new URL(originalUrl); } catch { return res.status(400).json({ error: "الرابط غير صحيح" }); }

      // Generate unique short code (6 chars)
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let shortCode: string;
      let exists: any;
      do {
        shortCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        exists = await ShortUrlModel.findOne({ shortCode });
      } while (exists);

      const doc = await ShortUrlModel.create({ ownerId: uid, originalUrl, shortCode, title: title || "" });
      const shortUrl = `${req.protocol}://${req.get("host")}/go/${shortCode}`;
      res.json({ id: doc._id, shortCode, url: shortUrl, originalUrl, title: doc.title });
    } catch (e) {
      res.status(500).json({ error: "فشل الاختصار" });
    }
  });

  // List my shortened URLs
  app.get("/api/tools/url-shorten", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ShortUrlModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      const urls = await ShortUrlModel.find({ ownerId: uid }).sort({ createdAt: -1 });
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      res.json(urls.map((u: any) => ({ ...u.toJSON(), url: `${baseUrl}/go/${u.shortCode}` })));
    } catch (e) {
      res.status(500).json({ error: "فشل الجلب" });
    }
  });

  // Delete a shortened URL
  app.delete("/api/tools/url-shorten/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ShortUrlModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      await ShortUrlModel.findOneAndDelete({ _id: req.params.id, ownerId: uid });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: "فشل الحذف" });
    }
  });

  // Public: Redirect short URL
  app.get("/go/:code", async (req, res) => {
    try {
      const { ShortUrlModel } = await import("./models");
      const link = await ShortUrlModel.findOneAndUpdate(
        { shortCode: req.params.code },
        { $inc: { clicks: 1 } },
        { new: true }
      );
      if (!link) return res.status(404).send("<h1>الرابط غير موجود</h1>");
      res.redirect(301, link.originalUrl);
    } catch (e) {
      res.status(404).send("<h1>الرابط غير موجود</h1>");
    }
  });

  // ═══════════════════════════════════════════════════════
  // ══════════════ TOOLS: DOCX → HTML (for PDF) ════════════
  // ═══════════════════════════════════════════════════════

  const docxUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

  app.post("/api/tools/docx-to-html", docxUpload.single("file"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      if (!req.file) return res.status(400).json({ error: "الملف مطلوب" });
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
      res.json({ html: result.value, messages: result.messages });
    } catch (e) {
      res.status(500).json({ error: "فشل التحويل" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ QIROX SYSTEM SETTINGS ═══════════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/system/changelog", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const staffRoles = ["admin", "manager", "developer", "designer", "support", "sales_manager", "sales", "accountant", "merchant"];
    if (!staffRoles.includes(user.role)) return res.sendStatus(403);
    try {
      const { CHANGELOG, SYSTEM_GUIDE, CURRENT_VERSION } = await import("./changelog");
      res.json({ version: CURRENT_VERSION, changelog: CHANGELOG, guide: SYSTEM_GUIDE });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/public/settings", async (_req, res) => {
    try {
      const { QiroxSystemSettingsModel } = await import("./models");
      let settings = await QiroxSystemSettingsModel.findOne({ key: "main" });
      if (!settings) settings = await QiroxSystemSettingsModel.create({ key: "main" });
      const { instagram, twitter, linkedin, snapchat, youtube, tiktok, whatsapp, contactPhone, contactEmail, companyName, companyNameAr } = settings;
      res.json({ instagram, twitter, linkedin, snapchat, youtube, tiktok, whatsapp, contactPhone, contactEmail, companyName, companyNameAr });
    } catch { res.json({}); }
  });

  app.get("/api/admin/qirox-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (!["admin", "manager"].includes(user.role)) return res.sendStatus(403);
    try {
      const { QiroxSystemSettingsModel } = await import("./models");
      let settings = await QiroxSystemSettingsModel.findOne({ key: "main" });
      if (!settings) settings = await QiroxSystemSettingsModel.create({ key: "main" });
      res.json(settings);
    } catch (e) { res.status(500).json({ error: "فشل جلب الإعدادات" }); }
  });

  app.put("/api/admin/qirox-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (!["admin", "manager"].includes(user.role)) return res.sendStatus(403);
    try {
      const { QiroxSystemSettingsModel } = await import("./models");
      const uid = user._id || user.id;
      const settings = await QiroxSystemSettingsModel.findOneAndUpdate(
        { key: "main" },
        { $set: { ...req.body, lastModifiedBy: uid } },
        { new: true, upsert: true }
      );
      res.json(settings);
    } catch (e) { res.status(500).json({ error: "فشل حفظ الإعدادات" }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ USER PROFILE ENHANCEMENT ════════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  // Update own extended profile
  app.patch("/api/users/extended-profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { UserModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      const { jobTitle, bio, profilePhotoUrl } = req.body;
      const updated = await UserModel.findByIdAndUpdate(uid, { $set: { jobTitle, bio, profilePhotoUrl } }, { new: true }).select("-password");
      res.json(updated);
    } catch (e) { res.status(500).json({ error: "فشل التحديث" }); }
  });

  // Admin: update any user's extended profile
  app.patch("/api/admin/users/:id/extended-profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (!["admin", "manager"].includes(user.role)) return res.sendStatus(403);
    try {
      const { UserModel } = await import("./models");
      const { jobTitle, bio, profilePhotoUrl, additionalRoles } = req.body;
      const updated = await UserModel.findByIdAndUpdate(req.params.id, {
        $set: { ...(jobTitle !== undefined && { jobTitle }), ...(bio !== undefined && { bio }), ...(profilePhotoUrl !== undefined && { profilePhotoUrl }), ...(additionalRoles !== undefined && { additionalRoles }) }
      }, { new: true }).select("-password");
      res.json(updated);
    } catch (e) { res.status(500).json({ error: "فشل التحديث" }); }
  });

  // Avatar config save (JSON)
  app.post("/api/profile/avatar-config", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { UserModel } = await import("./models");
      const uid = (req.user as any)._id || (req.user as any).id;
      const { avatarConfig } = req.body;
      if (!avatarConfig || typeof avatarConfig !== "string") return res.status(400).json({ error: "avatarConfig مطلوب" });
      const updated = await UserModel.findByIdAndUpdate(uid, { $set: { avatarConfig } }, { new: true }).select("-password");
      res.json({ success: true, avatarConfig: updated?.avatarConfig });
    } catch (e) { res.status(500).json({ error: "فشل الحفظ" }); }
  });

  // Profile photo upload (multipart/form-data file)
  app.post("/api/profile/photo", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const photoUpload = multer({
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadsDir),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || ".jpg";
          cb(null, `profile_${crypto.randomBytes(12).toString("hex")}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (/image\/(jpeg|jpg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
        else cb(new Error("يُسمح بالصور فقط (JPEG, PNG, WebP)"));
      },
    });
    photoUpload.single("file")(req, res, async (err) => {
      if (err instanceof multer.MulterError) return res.status(400).json({ error: "حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)" });
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: "لم يتم اختيار صورة" });
      try {
        const { UserModel } = await import("./models");
        const uid = (req.user as any)._id || (req.user as any).id;
        const profilePhotoUrl = `/uploads/${req.file.filename}`;
        const updated = await UserModel.findByIdAndUpdate(uid, { $set: { profilePhotoUrl } }, { new: true }).select("-password");
        res.json({ success: true, profilePhotoUrl: updated?.profilePhotoUrl });
      } catch (e) { res.status(500).json({ error: "فشل رفع الصورة" }); }
    });
  });

  // Remove profile photo
  app.delete("/api/profile/photo", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { UserModel } = await import("./models");
      const uid = (req.user as any)._id || (req.user as any).id;
      await UserModel.findByIdAndUpdate(uid, { $set: { profilePhotoUrl: "" } });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "فشل الحذف" }); }
  });

  // Get full profile (photo + avatar + social)
  app.get("/api/profile/me", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { UserModel } = await import("./models");
      const uid = (req.user as any)._id || (req.user as any).id;
      const user = await UserModel.findById(uid).select("-password -walletPin -walletCardNumber -quickPin");
      if (!user) return res.sendStatus(404);
      res.json(user);
    } catch (e) { res.status(500).json({ error: "فشل جلب الملف الشخصي" }); }
  });

  // Update full profile (social links + bio + jobTitle)
  app.patch("/api/profile/me", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { UserModel } = await import("./models");
      const uid = (req.user as any)._id || (req.user as any).id;
      const allowed = ["fullName", "bio", "jobTitle", "phone", "country", "businessType", "instagram", "twitter", "linkedin", "snapchat", "tiktok", "youtube"];
      const update: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) update[key] = req.body[key];
      }
      const updated = await UserModel.findByIdAndUpdate(uid, { $set: update }, { new: true }).select("-password -walletPin -walletCardNumber -quickPin");
      res.json(updated);
    } catch (e) { res.status(500).json({ error: "فشل التحديث" }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ PROMOTION SYSTEM ════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  const ROLE_LEVEL: Record<string, number> = {
    "client": 1, "customer": 1,
    "support": 2, "merchant": 2, "designer": 2, "developer": 2, "sales": 2, "accountant": 2, "investor": 2,
    "sales_manager": 3,
    "manager": 4,
    "admin": 5,
  };

  // List all users for promotion management
  app.get("/api/admin/all-users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (!["admin", "manager"].includes(user.role)) return res.sendStatus(403);
    try {
      const { UserModel } = await import("./models");
      const { role, search, page = "1" } = req.query as any;
      const filter: any = {};
      if (role && role !== "all") filter.role = role;
      if (search) filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
      const limit = 30;
      const skip = (parseInt(page) - 1) * limit;
      const [users, total] = await Promise.all([
        UserModel.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
        UserModel.countDocuments(filter),
      ]);
      res.json({ users, total, pages: Math.ceil(total / limit) });
    } catch (e) { res.status(500).json({ error: "فشل جلب المستخدمين" }); }
  });

  // Promote / change role
  app.patch("/api/admin/users/:id/role", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const promoter = req.user as any;
    const promoterRole = promoter.role;
    const promoterLevel = ROLE_LEVEL[promoterRole] || 0;
    if (promoterLevel < 4) return res.sendStatus(403); // Must be manager or admin
    try {
      const { UserModel, PromotionLogModel } = await import("./models");
      const { newRole, reason } = req.body;
      if (!newRole) return res.status(400).json({ error: "الدور مطلوب" });
      const targetLevel = ROLE_LEVEL[newRole] || 0;
      // Cannot promote to admin unless you ARE admin
      if (newRole === "admin" && promoterRole !== "admin") return res.status(403).json({ error: "فقط الأدمن يمكنه تعيين أدمن آخر" });
      // Cannot change someone at same or higher level (unless admin)
      const target = await UserModel.findById(req.params.id).select("-password");
      if (!target) return res.status(404).json({ error: "المستخدم غير موجود" });
      const targetCurrentLevel = ROLE_LEVEL[target.role] || 0;
      if (promoterRole !== "admin" && targetCurrentLevel >= promoterLevel) {
        return res.status(403).json({ error: "لا يمكنك تغيير دور شخص بنفس مستواك أو أعلى" });
      }
      const oldRole = target.role;
      await UserModel.findByIdAndUpdate(req.params.id, { $set: { role: newRole } });
      invalidateUserCache(req.params.id);
      await PromotionLogModel.create({
        targetUserId: req.params.id, promotedById: promoter._id || promoter.id,
        fromRole: oldRole, toRole: newRole, reason: reason || "",
        type: ROLE_LEVEL[newRole] > ROLE_LEVEL[oldRole] ? "promote" : "demote",
      });
      res.json({ ok: true, oldRole, newRole });
    } catch (e) { res.status(500).json({ error: "فشل تغيير الدور" }); }
  });

  // Add / remove additional roles
  app.patch("/api/admin/users/:id/additional-roles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (!["admin", "manager"].includes(user.role)) return res.sendStatus(403);
    try {
      const { UserModel } = await import("./models");
      const { additionalRoles } = req.body;
      if (!Array.isArray(additionalRoles)) return res.status(400).json({ error: "أرسل مصفوفة من الأدوار" });
      const updated = await UserModel.findByIdAndUpdate(req.params.id, { $set: { additionalRoles } }, { new: true }).select("-password");
      res.json(updated);
    } catch (e) { res.status(500).json({ error: "فشل التحديث" }); }
  });

  // Promotion history log
  app.get("/api/admin/promotion-log", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (!["admin", "manager"].includes(user.role)) return res.sendStatus(403);
    try {
      const { PromotionLogModel } = await import("./models");
      const { userId } = req.query as any;
      const filter: any = {};
      if (userId) filter.targetUserId = userId;
      const logs = await PromotionLogModel.find(filter)
        .populate("targetUserId", "fullName username role")
        .populate("promotedById", "fullName username")
        .sort({ createdAt: -1 })
        .limit(100);
      res.json(logs);
    } catch (e) { res.status(500).json({ error: "فشل جلب السجل" }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ INVESTOR SYSTEM (Admin) ═════════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  // List all investors
  app.get("/api/admin/investors", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (!["admin", "manager"].includes(user.role)) return res.sendStatus(403);
    try {
      const { InvestorProfileModel } = await import("./models");
      const investors = await InvestorProfileModel.find()
        .populate("userId", "fullName username email role jobTitle bio profilePhotoUrl additionalRoles avatarUrl")
        .sort({ stakePercentage: -1 });
      res.json(investors);
    } catch (e) { res.status(500).json({ error: "فشل جلب المستثمرين" }); }
  });

  // Create investor profile for a user
  app.post("/api/admin/investors", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "admin") return res.sendStatus(403);
    try {
      const { InvestorProfileModel, UserModel, PromotionLogModel } = await import("./models");
      const { userId, stakePercentage, notes } = req.body;
      if (!userId) return res.status(400).json({ error: "معرف المستخدم مطلوب" });
      const existing = await InvestorProfileModel.findOne({ userId });
      if (existing) return res.status(400).json({ error: "هذا المستخدم لديه ملف مستثمر بالفعل" });
      // Set role to investor if not already
      const targetUser = await UserModel.findById(userId);
      if (!targetUser) return res.status(404).json({ error: "المستخدم غير موجود" });
      const oldRole = targetUser.role;
      if (!["admin", "manager"].includes(oldRole)) {
        await UserModel.findByIdAndUpdate(userId, { $set: { role: "investor", additionalRoles: oldRole !== "investor" ? [oldRole, ...((targetUser as any).additionalRoles || [])] : (targetUser as any).additionalRoles } });
      } else {
        // Add investor to additionalRoles
        await UserModel.findByIdAndUpdate(userId, { $addToSet: { additionalRoles: "investor" } });
      }
      const profile = await InvestorProfileModel.create({ userId, stakePercentage: stakePercentage || 0, notes: notes || "" });
      await PromotionLogModel.create({ targetUserId: userId, promotedById: user._id || user.id, fromRole: oldRole, toRole: "investor", reason: "تعيين كمستثمر في QIROX", type: "role_add" });
      res.json(profile);
    } catch (e) { res.status(500).json({ error: "فشل إنشاء الملف" }); }
  });

  // Update investor stake & settings (admin only)
  app.patch("/api/admin/investors/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "admin") return res.sendStatus(403);
    try {
      const { InvestorProfileModel } = await import("./models");
      const updated = await InvestorProfileModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .populate("userId", "fullName username email jobTitle profilePhotoUrl");
      res.json(updated);
    } catch (e) { res.status(500).json({ error: "فشل التحديث" }); }
  });

  // Get all payments for admin
  app.get("/api/admin/investment-payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (!["admin", "manager"].includes(user.role)) return res.sendStatus(403);
    try {
      const { InvestmentPaymentModel } = await import("./models");
      const { status, investorId } = req.query as any;
      const filter: any = {};
      if (status) filter.status = status;
      if (investorId) filter.investorId = investorId;
      const payments = await InvestmentPaymentModel.find(filter)
        .populate("userId", "fullName username email")
        .populate("approvedBy", "fullName username")
        .sort({ createdAt: -1 });
      res.json(payments);
    } catch (e) { res.status(500).json({ error: "فشل جلب المدفوعات" }); }
  });

  // Approve / reject investment payment
  app.patch("/api/admin/investment-payments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "admin") return res.sendStatus(403);
    try {
      const { InvestmentPaymentModel, InvestorProfileModel } = await import("./models");
      const { status, adminNote } = req.body;
      if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "الحالة غير صحيحة" });
      const payment = await InvestmentPaymentModel.findByIdAndUpdate(req.params.id, {
        $set: { status, adminNote: adminNote || "", approvedBy: user._id || user.id, approvedAt: new Date() }
      }, { new: true });
      if (!payment) return res.status(404).json({ error: "الدفعة غير موجودة" });
      if (status === "approved") {
        await InvestorProfileModel.findByIdAndUpdate(payment.investorId, { $inc: { totalInvested: payment.amount } });
      }
      res.json(payment);
    } catch (e) { res.status(500).json({ error: "فشل التحديث" }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ INVESTOR PORTAL (Self-service) ════════════════════
  // ═══════════════════════════════════════════════════════════════════

  // My investor profile
  app.get("/api/investor/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { InvestorProfileModel, QiroxSystemSettingsModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      const [profile, settings, allInvestors] = await Promise.all([
        InvestorProfileModel.findOne({ userId: uid }).populate("userId", "fullName username email jobTitle bio profilePhotoUrl"),
        QiroxSystemSettingsModel.findOne({ key: "main" }),
        InvestorProfileModel.find({ isActive: true }).populate("userId", "fullName username profilePhotoUrl jobTitle"),
      ]);
      if (!profile) return res.status(404).json({ error: "ليس لديك ملف مستثمر" });
      const totalStake = allInvestors.reduce((s: number, i: any) => s + (i.stakePercentage || 0), 0);
      const valuation = settings?.systemValuation || 0;
      const myValue = valuation * (profile.stakePercentage / 100);
      res.json({ profile, settings, allInvestors, totalStake, myValue });
    } catch (e) { res.status(500).json({ error: "فشل جلب الملف" }); }
  });

  // My investment payments
  app.get("/api/investor/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { InvestorProfileModel, InvestmentPaymentModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      const profile = await InvestorProfileModel.findOne({ userId: uid });
      if (!profile) return res.status(404).json({ error: "ليس لديك ملف مستثمر" });
      const payments = await InvestmentPaymentModel.find({ investorId: profile._id }).sort({ createdAt: -1 });
      res.json(payments);
    } catch (e) { res.status(500).json({ error: "فشل جلب المدفوعات" }); }
  });

  // Submit new investment payment
  app.post("/api/investor/payments", upload.single("proof"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { InvestorProfileModel, InvestmentPaymentModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      const profile = await InvestorProfileModel.findOne({ userId: uid });
      if (!profile) return res.status(404).json({ error: "ليس لديك ملف مستثمر" });
      const { amount, paymentMethod, signatureData, signatureText, description } = req.body;
      if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: "المبلغ غير صحيح" });
      let proofUrl = "";
      if (req.file) proofUrl = `/uploads/${req.file.filename}`;
      const payment = await InvestmentPaymentModel.create({
        investorId: profile._id, userId: uid,
        amount: parseFloat(amount), paymentMethod: paymentMethod || "bank_transfer",
        proofUrl, signatureData: signatureData || "", signatureText: signatureText || "",
        description: description || "",
      });
      res.json(payment);
    } catch (e) { res.status(500).json({ error: "فشل إرسال الدفعة" }); }
  });


  // ── Daily subscription renewal reminder job ──────────────────────────────
  async function checkSubscriptionRenewals() {
    try {
      const { UserModel, NotificationModel } = await import("./models");
      const now = new Date();
      // Find active subscriptions with ≤10% time remaining
      const clients = await UserModel.find({
        role: "client", subscriptionStatus: "active",
        subscriptionStartDate: { $ne: null }, subscriptionExpiresAt: { $gt: now },
        $or: [
          { renewalReminderSentAt: null },
          { renewalReminderSentAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // don't repeat within 7 days
        ],
      }).lean();
      const staff = await UserModel.find({ role: { $in: ["admin","manager"] } }).select("_id").lean();
      let notified = 0;
      for (const client of clients) {
        const start = new Date((client as any).subscriptionStartDate);
        const end = new Date((client as any).subscriptionExpiresAt);
        const totalMs = end.getTime() - start.getTime();
        const remainingMs = end.getTime() - now.getTime();
        if (totalMs <= 0) continue;
        const pct = remainingMs / totalMs;
        if (pct > 0.10) continue; // Not yet at 10%
        const remainingDays = Math.ceil(remainingMs / 86400000);
        const clientName = (client as any).fullName || (client as any).email || "عميل";
        // Notify all staff
        for (const emp of staff) {
          await NotificationModel.create({
            userId: String(emp._id), type: 'renewal_reminder',
            title: `⚠️ تجديد اشتراك ${clientName}`,
            body: `تواصل مع ${clientName} لتجديد اشتراكه — باقي ${remainingDays} ${remainingDays === 1 ? "يوم" : "أيام"} فقط`,
            link: '/admin/subscription-plans', icon: '🔔',
          }).catch(() => {});
          pushNotification(String(emp._id), {
            title: `⚠️ تجديد اشتراك ${clientName}`,
            body: `باقي ${remainingDays} أيام على انتهاء اشتراك ${clientName}`,
            icon: '🔔', link: '/admin/subscription-plans',
          });
        }
        // Mark reminder as sent
        await UserModel.findByIdAndUpdate((client as any)._id, { $set: { renewalReminderSentAt: now } });
        notified++;
      }
      if (notified > 0) console.log(`[SubscriptionReminder] Sent renewal reminders for ${notified} client(s)`);
    } catch (e) { console.error("[SubscriptionReminder] error:", e); }
  }
  // Run immediately on startup then every 24 hours
  setTimeout(() => checkSubscriptionRenewals().catch(() => {}), 5000);
  setInterval(() => checkSubscriptionRenewals().catch(() => {}), 24 * 60 * 60 * 1000);

  // ─── Addon Subscription Expiry Checker ──────────────────────────────────────
  async function checkAddonExpiry() {
    try {
      const { ProjectAddonSubscriptionModel, NotificationModel } = await import("./models");
      const { pushToUser } = await import("./ws");
      const now = new Date();
      const expiredSubs = await (ProjectAddonSubscriptionModel as any).find({
        status: "active",
        expiresAt: { $lte: now },
      }).populate("addonId", "nameAr").populate("projectId", "clientId managerId");

      for (const sub of expiredSubs) {
        sub.status = "expired";
        sub.lastNotifiedAt = now;
        await sub.save();
        const clientId = sub.clientId || sub.projectId?.clientId;
        const name = sub.addonNameAr || sub.addonId?.nameAr || "الخدمة";
        if (clientId) {
          await NotificationModel.create({ userId: clientId, type: "warning", title: `انتهى اشتراك: ${name}`, body: "انتهت صلاحية الخدمة — يمكنك طلب التجديد من صفحة مشروعك", link: `/projects/${sub.projectId?._id || sub.projectId}` }).catch(() => {});
          pushToUser(String(clientId), { type: "notification", title: "انتهاء خدمة", body: name });
        }
        // Notify managers
        const { UserModel } = await import("./models");
        const managers = await UserModel.find({ role: { $in: ["admin","manager"] } }).select("_id").limit(3);
        for (const mgr of managers) {
          await NotificationModel.create({ userId: mgr._id, type: "warning", title: `خدمة منتهية: ${name}`, body: `اشتراك في مشروع منتهي الصلاحية`, link: `/admin/addon-subscriptions` }).catch(() => {});
        }
      }

      if (expiredSubs.length > 0) console.log(`[AddonExpiry] Marked ${expiredSubs.length} subscription(s) as expired`);
    } catch (e) { console.error("[AddonExpiry] error:", e); }
  }
  setTimeout(() => checkAddonExpiry().catch(() => {}), 8000);
  setInterval(() => checkAddonExpiry().catch(() => {}), 6 * 60 * 60 * 1000);

  // Initialize seed data
  await seedDatabase();

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ 2FA TOTP ════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  app.post("/api/totp/setup", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const speakeasy = await import("speakeasy");
      const { UserModel } = await import("./models");
      const user = req.user as any;
      const secret = speakeasy.default.generateSecret({ name: `Qirox (${user.email || user.username})`, length: 20 });
      await UserModel.findByIdAndUpdate(user._id || user.id, { totpSecret: secret.base32 });
      res.json({ secret: secret.base32, otpauth_url: secret.otpauth_url });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/totp/verify-setup", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const speakeasy = await import("speakeasy");
      const { UserModel } = await import("./models");
      const user = req.user as any;
      const { token } = req.body;
      const dbUser = await UserModel.findById(user._id || user.id).select("+totpSecret");
      if (!dbUser || !dbUser.totpSecret) return res.status(400).json({ error: "لم يتم إعداد المفتاح السري" });
      const verified = speakeasy.default.totp.verify({ secret: dbUser.totpSecret, encoding: "base32", token: String(token), window: 2 });
      if (!verified) return res.status(400).json({ error: "الرمز غير صحيح" });
      await UserModel.findByIdAndUpdate(user._id || user.id, { totpEnabled: true });
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/totp/disable", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { UserModel } = await import("./models");
      const user = req.user as any;
      await UserModel.findByIdAndUpdate(user._id || user.id, { totpEnabled: false, totpSecret: null });
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/totp/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const speakeasy = await import("speakeasy");
      const { UserModel } = await import("./models");
      const user = req.user as any;
      const { token } = req.body;
      const dbUser = await UserModel.findById(user._id || user.id).select("+totpSecret");
      if (!dbUser?.totpEnabled || !dbUser.totpSecret) return res.status(400).json({ error: "2FA غير مفعّل" });
      const verified = speakeasy.default.totp.verify({ secret: dbUser.totpSecret, encoding: "base32", token: String(token), window: 2 });
      res.json({ valid: verified });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/totp/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { UserModel } = await import("./models");
      const user = req.user as any;
      const dbUser = await UserModel.findById(user._id || user.id).select("totpEnabled emailOtpEnabled recoveryPassphraseEnabled");
      const totp = dbUser?.totpEnabled || false;
      const emailOtp = dbUser?.emailOtpEnabled || false;
      const passphrase = dbUser?.recoveryPassphraseEnabled || false;
      res.json({
        enabled: totp || emailOtp || passphrase,
        totp,
        emailOtp,
        passphrase,
      });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/2fa/email-otp/setup", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { UserModel, OtpModel } = await import("./models");
      const user = req.user as any;
      const dbUser = await UserModel.findById(user._id || user.id);
      if (!dbUser?.email) return res.status(400).json({ error: "لا يوجد بريد إلكتروني مسجّل لحسابك" });
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await OtpModel.updateMany({ email: dbUser.email, used: false, type: "2fa_email" }, { used: true });
      await OtpModel.create({ email: dbUser.email, code, expiresAt, type: "2fa_email" });
      sendLoginOtpEmail(dbUser.email, dbUser.fullName || dbUser.username, code, req.headers["user-agent"] as string).catch(console.error);
      res.json({ ok: true, email: dbUser.email });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/2fa/email-otp/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { code } = req.body;
      if (!code || String(code).length !== 6) return res.status(400).json({ error: "أدخل الرمز المكون من 6 أرقام" });
      const { UserModel, OtpModel } = await import("./models");
      const user = req.user as any;
      const dbUser = await UserModel.findById(user._id || user.id);
      if (!dbUser?.email) return res.status(400).json({ error: "لا يوجد بريد إلكتروني" });
      const latestOtp = await OtpModel.findOne({ email: dbUser.email, type: "2fa_email", used: false }).sort({ createdAt: -1 });
      if (!latestOtp) return res.status(400).json({ error: "لم يتم إرسال رمز تحقق" });
      if (latestOtp.expiresAt < new Date()) return res.status(400).json({ error: "انتهت صلاحية الرمز" });
      if (latestOtp.code !== String(code).trim()) return res.status(400).json({ error: "الرمز غير صحيح" });
      await OtpModel.updateOne({ _id: latestOtp._id }, { used: true });
      await UserModel.findByIdAndUpdate(user._id || user.id, { emailOtpEnabled: true });
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/2fa/email-otp/disable", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { UserModel } = await import("./models");
      const user = req.user as any;
      await UserModel.findByIdAndUpdate(user._id || user.id, { emailOtpEnabled: false });
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/2fa/passphrase/setup", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { passphrase } = req.body;
      if (!passphrase || String(passphrase).trim().length < 6) return res.status(400).json({ error: "كلمة الاسترداد يجب أن تكون 6 أحرف على الأقل" });
      const bcrypt = await import("bcrypt");
      const { UserModel } = await import("./models");
      const user = req.user as any;
      const hashed = await bcrypt.default.hash(String(passphrase).trim(), 10);
      await UserModel.findByIdAndUpdate(user._id || user.id, { recoveryPassphrase: hashed, recoveryPassphraseEnabled: true });
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/2fa/passphrase/disable", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { UserModel } = await import("./models");
      const user = req.user as any;
      await UserModel.findByIdAndUpdate(user._id || user.id, { recoveryPassphrase: null, recoveryPassphraseEnabled: false });
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ REFERRAL SYSTEM ═════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/referral/my-code", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { UserModel, ReferralModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      let dbUser = await UserModel.findById(uid).select("referralCode referralCreditsEarned");
      if (!dbUser?.referralCode) {
        const code = `QRX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        dbUser = await UserModel.findByIdAndUpdate(uid, { referralCode: code }, { new: true }).select("referralCode referralCreditsEarned");
      }
      const referrals = await (ReferralModel as any).find({ referrerId: uid }).sort({ createdAt: -1 }).limit(20);
      res.json({ code: dbUser?.referralCode, creditsEarned: dbUser?.referralCreditsEarned || 0, referrals });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/referral/apply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { UserModel, ReferralModel, WalletTransactionModel } = await import("./models");
      const user = req.user as any;
      const uid = user._id || user.id;
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "رمز الإحالة مطلوب" });
      const dbUser = await UserModel.findById(uid).select("referredBy referralCode");
      if (dbUser?.referredBy) return res.status(400).json({ error: "لقد استخدمت رمز إحالة من قبل" });
      if (dbUser?.referralCode === code) return res.status(400).json({ error: "لا يمكنك استخدام رمزك الخاص" });
      const referrer = await UserModel.findOne({ referralCode: code });
      if (!referrer) return res.status(404).json({ error: "رمز الإحالة غير صحيح" });
      const CREDIT = 50;
      await UserModel.findByIdAndUpdate(uid, { referredBy: code });
      await UserModel.findByIdAndUpdate(referrer._id, { $inc: { walletBalance: CREDIT, referralCreditsEarned: CREDIT } });
      await (ReferralModel as any).create({ referrerId: referrer._id, referredId: uid, code, status: "rewarded", creditAmount: CREDIT, rewardedAt: new Date() });
      await (WalletTransactionModel as any).create({ userId: referrer._id, type: "credit", amount: CREDIT, description: `مكافأة إحالة — مستخدم جديد انضم بكودك`, status: "completed" }).catch(() => {});
      res.json({ ok: true, message: `تم تطبيق الإحالة! حصل مُحيلك على ${CREDIT} ريال في محفظته.` });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/admin/referrals", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { ReferralModel } = await import("./models");
      const referrals = await (ReferralModel as any).find().sort({ createdAt: -1 }).limit(100)
        .populate("referrerId", "fullName username email")
        .populate("referredId", "fullName username email");
      res.json(referrals);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ TIME TRACKING ════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/projects/:projectId/timelogs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { TimeLogModel } = await import("./models");
      const logs = await (TimeLogModel as any).find({ projectId: req.params.projectId })
        .populate("userId", "fullName username profilePhotoUrl")
        .populate("taskId", "title")
        .sort({ createdAt: -1 });
      res.json(logs);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/projects/:projectId/timelogs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { TimeLogModel } = await import("./models");
      const user = req.user as any;
      const { taskId, description, startedAt, endedAt } = req.body;
      const start = new Date(startedAt || Date.now());
      const end = endedAt ? new Date(endedAt) : null;
      const durationMinutes = end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0;
      const log = await (TimeLogModel as any).create({ taskId, projectId: req.params.projectId, userId: user._id || user.id, description: description || "", startedAt: start, endedAt: end, durationMinutes });
      res.status(201).json(log);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/projects/:projectId/timelogs/:logId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { TimeLogModel } = await import("./models");
      const user = req.user as any;
      const log = await (TimeLogModel as any).findById(req.params.logId);
      if (!log) return res.status(404).json({ error: "السجل غير موجود" });
      const staffRoles = ["admin","manager","developer","designer"];
      if (String(log.userId) !== String(user._id || user.id) && !staffRoles.includes(user.role)) return res.sendStatus(403);
      await log.deleteOne();
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ PROJECT COMMENTS ════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/projects/:projectId/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ProjectCommentModel, ProjectModel } = await import("./models");
      const user = req.user as any;
      const project = await (ProjectModel as any).findById(req.params.projectId);
      if (!project) return res.status(404).json({ error: "المشروع غير موجود" });
      const isStaff = user.role !== "client";
      const isOwner = String(project.clientId) === String(user._id || user.id);
      if (!isStaff && !isOwner) return res.sendStatus(403);
      const filter: any = { projectId: req.params.projectId };
      if (!isStaff) filter.isInternal = false;
      const comments = await (ProjectCommentModel as any).find(filter)
        .populate("userId", "fullName username profilePhotoUrl role")
        .sort({ createdAt: 1 });
      res.json(comments);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/projects/:projectId/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ProjectCommentModel, ProjectModel, NotificationModel } = await import("./models");
      const { pushToUser } = await import("./ws");
      const user = req.user as any;
      const project = await (ProjectModel as any).findById(req.params.projectId);
      if (!project) return res.status(404).json({ error: "المشروع غير موجود" });
      const isStaff = user.role !== "client";
      const isOwner = String(project.clientId) === String(user._id || user.id);
      if (!isStaff && !isOwner) return res.sendStatus(403);
      const { body, isInternal, attachmentUrl } = req.body;
      if (!body?.trim()) return res.status(400).json({ error: "التعليق لا يمكن أن يكون فارغاً" });
      const comment = await (ProjectCommentModel as any).create({
        projectId: req.params.projectId, userId: user._id || user.id,
        body: body.trim(), isInternal: isStaff ? (isInternal || false) : false,
        attachmentUrl: attachmentUrl || "",
      });
      const populated = await (ProjectCommentModel as any).findById(comment._id).populate("userId", "fullName username profilePhotoUrl role");
      if (isStaff) {
        await NotificationModel.create({ userId: project.clientId, type: "project", title: "تعليق جديد على مشروعك", body: body.trim().substring(0, 80), link: `/projects/${req.params.projectId}` }).catch(() => {});
        pushToUser(String(project.clientId), { type: "notification", title: "تعليق جديد", body: body.trim().substring(0, 60) });
      }
      res.status(201).json(populated);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/projects/:projectId/comments/:commentId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ProjectCommentModel } = await import("./models");
      const user = req.user as any;
      const comment = await (ProjectCommentModel as any).findById(req.params.commentId);
      if (!comment) return res.status(404).json({ error: "التعليق غير موجود" });
      const isStaff = ["admin","manager"].includes(user.role);
      const isOwner = String(comment.userId) === String(user._id || user.id);
      if (!isStaff && !isOwner) return res.sendStatus(403);
      await comment.deleteOne();
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ CONTRACTS ═══════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/orders/:orderId/contract", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ContractModel, OrderModel } = await import("./models");
      const user = req.user as any;
      const order = await (OrderModel as any).findById(req.params.orderId);
      if (!order) return res.status(404).json({ error: "الطلب غير موجود" });
      const isStaff = user.role !== "client";
      const isOwner = String(order.userId) === String(user._id || user.id);
      if (!isStaff && !isOwner) return res.sendStatus(403);
      const contract = await (ContractModel as any).findOne({ orderId: req.params.orderId });
      res.json(contract || null);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/orders/:orderId/contract", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { ContractModel, OrderModel, NotificationModel } = await import("./models");
      const { pushToUser } = await import("./ws");
      const order = await (OrderModel as any).findById(req.params.orderId);
      if (!order) return res.status(404).json({ error: "الطلب غير موجود" });
      const { terms, notes } = req.body;
      if (!terms?.trim()) return res.status(400).json({ error: "بنود العقد مطلوبة" });
      const existing = await (ContractModel as any).findOne({ orderId: req.params.orderId });
      if (existing) return res.status(400).json({ error: "يوجد عقد مسبق لهذا الطلب" });
      const contract = await (ContractModel as any).create({ orderId: req.params.orderId, clientId: order.userId, terms: terms.trim(), totalAmount: order.totalAmount || 0, notes: notes || "" });
      await NotificationModel.create({ userId: order.userId, type: "contract", title: "عقد مشروع جديد", body: "تم إصدار عقد مشروعك — يرجى الاطلاع والتأكيد", link: `/dashboard` }).catch(() => {});
      pushToUser(String(order.userId), { type: "notification", title: "عقد جديد", body: "تم إصدار عقد مشروعك" });
      res.status(201).json(contract);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.patch("/api/orders/:orderId/contract/acknowledge", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ContractModel, OrderModel } = await import("./models");
      const user = req.user as any;
      const order = await (OrderModel as any).findById(req.params.orderId);
      if (!order) return res.status(404).json({ error: "الطلب غير موجود" });
      if (String(order.userId) !== String(user._id || user.id)) return res.sendStatus(403);
      const contract = await (ContractModel as any).findOneAndUpdate(
        { orderId: req.params.orderId, status: "pending" },
        { status: "acknowledged", acknowledgedAt: new Date() },
        { new: true }
      );
      if (!contract) return res.status(404).json({ error: "لا يوجد عقد معلّق" });
      res.json(contract);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ ANALYTICS — QMEET METRICS ═══════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/admin/analytics/qmeet", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    try {
      const { QMeetingModel } = await import("./models");
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }) };
      });
      const monthlyMeetings = await Promise.all(months.map(async ({ year, month, label }) => {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const meetings = await (QMeetingModel as any).find({ createdAt: { $gte: start, $lte: end } }).select("durationMinutes status");
        const totalHours = meetings.reduce((a: number, m: any) => a + (m.durationMinutes || 0) / 60, 0);
        return { label, count: meetings.length, hours: Math.round(totalHours * 10) / 10 };
      }));
      const [totalMeetings, thisMonthMeetings, activeMeetings] = await Promise.all([
        (QMeetingModel as any).countDocuments(),
        (QMeetingModel as any).countDocuments({ createdAt: { $gte: startOfMonth } }),
        (QMeetingModel as any).countDocuments({ status: "active" }),
      ]);
      const topHosts = await (QMeetingModel as any).aggregate([
        { $group: { _id: "$hostId", meetings: { $sum: 1 }, totalMinutes: { $sum: "$durationMinutes" } } },
        { $sort: { meetings: -1 } }, { $limit: 5 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "u" } },
        { $addFields: { name: { $arrayElemAt: ["$u.fullName", 0] } } },
        { $project: { u: 0 } },
      ]).catch(() => []);
      res.json({ totalMeetings, thisMonthMeetings, activeMeetings, monthlyMeetings, topHosts });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ ANALYTICS — EMAIL REPORT ═════════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  app.post("/api/admin/analytics/send-report", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const nodemailer = await import("nodemailer");
      const { OrderModel, UserModel } = await import("./models");
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const [totalOrders, thisMonthOrders, totalClients, revenueAgg] = await Promise.all([
        (OrderModel as any).countDocuments(),
        (OrderModel as any).countDocuments({ createdAt: { $gte: startOfMonth } }),
        (UserModel as any).countDocuments({ role: "client" }),
        (OrderModel as any).aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" }, thisMonth: { $sum: { $cond: [{ $gte: ["$createdAt", startOfMonth] }, "$totalAmount", 0] } } } }]),
      ]);
      const rev = revenueAgg[0] || { total: 0, thisMonth: 0 };
      const { QiroxSystemSettingsModel } = await import("./models");
      const settings = await QiroxSystemSettingsModel.findOne({ key: "main" });
      const smtpUser = process.env.SMTP_USER || settings?.contactEmail;
      const smtpPass = process.env.SMTP_PASS;
      if (!smtpUser || !smtpPass) return res.status(400).json({ error: "إعدادات SMTP غير مكتملة. يرجى تعيين SMTP_USER وSMTP_PASS في متغيرات البيئة." });
      const transport = nodemailer.default.createTransport({ host: process.env.SMTP_HOST || "smtp.gmail.com", port: Number(process.env.SMTP_PORT || 587), auth: { user: smtpUser, pass: smtpPass } });
      const { email } = req.body;
      const to = email || smtpUser;
      await transport.sendMail({
        from: smtpUser, to,
        subject: `تقرير Qirox الشهري — ${now.toLocaleDateString("ar-SA", { month: "long", year: "numeric" })}`,
        html: `<div dir="rtl" style="font-family:Arial;max-width:600px;margin:auto;padding:24px"><h2 style="color:#000">تقرير النظام الشهري</h2><p>${now.toLocaleDateString("ar-SA")}</p><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px;border:1px solid #eee">إجمالي الطلبات</td><td style="padding:8px;border:1px solid #eee;font-weight:bold">${totalOrders}</td></tr><tr><td style="padding:8px;border:1px solid #eee">طلبات هذا الشهر</td><td style="padding:8px;border:1px solid #eee;font-weight:bold">${thisMonthOrders}</td></tr><tr><td style="padding:8px;border:1px solid #eee">إجمالي العملاء</td><td style="padding:8px;border:1px solid #eee;font-weight:bold">${totalClients}</td></tr><tr><td style="padding:8px;border:1px solid #eee">إيرادات هذا الشهر</td><td style="padding:8px;border:1px solid #eee;font-weight:bold">${rev.thisMonth.toLocaleString("ar-SA")} ر.س</td></tr><tr><td style="padding:8px;border:1px solid #eee">إجمالي الإيرادات</td><td style="padding:8px;border:1px solid #eee;font-weight:bold">${rev.total.toLocaleString("ar-SA")} ر.س</td></tr></table><p style="color:#666;font-size:12px;margin-top:24px">Qirox Studio — qirox.tech</p></div>`,
      });
      res.json({ ok: true, sentTo: to });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ PROJECT ADDON SUBSCRIPTIONS ═══════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/projects/:projectId/addon-subscriptions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ProjectAddonSubscriptionModel, ProjectModel } = await import("./models");
      const user = req.user as any;
      const project = await (ProjectModel as any).findById(req.params.projectId);
      if (!project) return res.status(404).json({ error: "المشروع غير موجود" });
      const isStaff = user.role !== "client";
      const isOwner = String(project.clientId) === String(user._id || user.id);
      if (!isStaff && !isOwner) return res.sendStatus(403);
      const subs = await (ProjectAddonSubscriptionModel as any).find({ projectId: req.params.projectId })
        .populate("addonId", "nameAr name icon category billingType quotaCount quotaLabel")
        .sort({ createdAt: -1 });
      res.json(subs);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/projects/:projectId/addon-subscriptions", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { ProjectAddonSubscriptionModel, ExtraAddonModel, ProjectModel, NotificationModel } = await import("./models");
      const { pushToUser } = await import("./ws");
      const project = await (ProjectModel as any).findById(req.params.projectId);
      if (!project) return res.status(404).json({ error: "المشروع غير موجود" });
      const { addonId, quotaTotal, expiresAt } = req.body;
      const addon = await ExtraAddonModel.findById(addonId);
      if (!addon) return res.status(404).json({ error: "الإضافة غير موجودة" });
      const sub = await (ProjectAddonSubscriptionModel as any).create({
        projectId: req.params.projectId, clientId: project.clientId,
        addonId, addonNameAr: addon.nameAr, billingType: addon.billingType,
        quotaTotal: quotaTotal || addon.quotaCount || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      await NotificationModel.create({ userId: project.clientId, type: "feature", title: `تم تفعيل: ${addon.nameAr}`, body: "تم إضافة خدمة جديدة لمشروعك", link: `/projects/${req.params.projectId}` }).catch(() => {});
      pushToUser(String(project.clientId), { type: "notification", title: "خدمة جديدة", body: addon.nameAr });
      res.status(201).json(sub);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.patch("/api/projects/:projectId/addon-subscriptions/:subId/use", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager","developer"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { ProjectAddonSubscriptionModel, NotificationModel } = await import("./models");
      const { pushToUser } = await import("./ws");
      const { amount = 1 } = req.body;
      const sub = await (ProjectAddonSubscriptionModel as any).findById(req.params.subId);
      if (!sub) return res.status(404).json({ error: "الاشتراك غير موجود" });
      if (sub.status !== "active") return res.status(400).json({ error: "الاشتراك غير نشط" });
      sub.quotaUsed = (sub.quotaUsed || 0) + Number(amount);
      if (sub.quotaTotal > 0 && sub.quotaUsed >= sub.quotaTotal) {
        sub.status = "exhausted";
        await NotificationModel.create({ userId: sub.clientId, type: "warning", title: `انتهت حصة: ${sub.addonNameAr}`, body: "تم استنفاد الحصة المتاحة — يمكنك طلب تجديدها", link: `/projects/${req.params.projectId}` }).catch(() => {});
        pushToUser(String(sub.clientId), { type: "notification", title: "انتهت الحصة", body: sub.addonNameAr });
      }
      await sub.save();
      res.json(sub);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/projects/:projectId/addon-subscriptions/:subId/request-renewal", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { ProjectAddonSubscriptionModel, NotificationModel, UserModel, ProjectModel } = await import("./models");
      const { pushToUser } = await import("./ws");
      const user = req.user as any;
      const sub = await (ProjectAddonSubscriptionModel as any).findById(req.params.subId);
      if (!sub) return res.status(404).json({ error: "الاشتراك غير موجود" });
      if (String(sub.clientId) !== String(user._id || user.id)) return res.sendStatus(403);
      sub.renewalRequestedAt = new Date();
      await sub.save();
      const managers = await UserModel.find({ role: { $in: ["admin","manager"] } }).select("_id");
      for (const mgr of managers) {
        await NotificationModel.create({ userId: mgr._id, type: "request", title: `طلب تجديد: ${sub.addonNameAr}`, body: `العميل يطلب تجديد اشتراك في مشروع`, link: `/admin/projects/${req.params.projectId}` }).catch(() => {});
        pushToUser(String(mgr._id), { type: "notification", title: "طلب تجديد إضافة", body: sub.addonNameAr });
      }
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/admin/addon-subscriptions", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { ProjectAddonSubscriptionModel } = await import("./models");
      const { status } = req.query;
      const filter: any = {};
      if (status) filter.status = status;
      const subs = await (ProjectAddonSubscriptionModel as any).find(filter)
        .populate("addonId", "nameAr name icon category")
        .populate("clientId", "fullName username email")
        .populate("projectId", "status")
        .sort({ createdAt: -1 }).limit(200);
      res.json(subs);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ══════════════ KANBAN — projects board ══════════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/admin/kanban", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    try {
      const { ProjectModel, OrderModel } = await import("./models");
      const projects = await (ProjectModel as any).find().sort({ updatedAt: -1 }).limit(200)
        .populate("clientId", "fullName username email")
        .populate("managerId", "fullName username");
      const withOrders = await Promise.all(projects.map(async (p: any) => {
        const order = await (OrderModel as any).findById(p.orderId).select("businessName sector planTier totalAmount");
        return { ...p.toObject(), order };
      }));
      res.json(withOrders);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.patch("/api/admin/kanban/:projectId/status", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === "client") return res.sendStatus(403);
    try {
      const { ProjectModel } = await import("./models");
      const { status } = req.body;
      const allowed = ["new","under_study","pending_payment","in_progress","testing","review","delivery","closed"];
      if (!allowed.includes(status)) return res.status(400).json({ error: "حالة غير صالحة" });
      const project = await (ProjectModel as any).findByIdAndUpdate(req.params.projectId, { status }, { new: true });
      res.json(project);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  /* ══ Phone Correction Requests ══════════════════════════════════════════ */

  app.post("/api/phone-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if ((req.user as any).role === "client") return res.sendStatus(403);
    try {
      const { PhoneRequestModel, UserModel } = await import("./models");
      const { clientId, notes } = req.body;
      if (!clientId) return res.status(400).json({ error: "clientId مطلوب" });
      const client = await (UserModel as any).findById(clientId);
      const me = req.user as any;
      const doc = await (PhoneRequestModel as any).create({
        clientId,
        clientName:      client?.fullName || client?.username || "—",
        clientPhone:     client?.phone || "",
        requestedBy:     me._id || me.id,
        requestedByName: me.fullName || me.username,
        notes: notes || "",
        status: "pending",
      });
      res.status(201).json(doc);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/admin/phone-requests", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { PhoneRequestModel } = await import("./models");
      const status = (req.query.status as string) || "pending";
      const docs = await (PhoneRequestModel as any).find(status !== "all" ? { status } : {}).sort({ createdAt: -1 }).limit(100);
      res.json(docs);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.patch("/api/admin/phone-requests/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin","manager"].includes((req.user as any).role)) return res.sendStatus(403);
    try {
      const { PhoneRequestModel, UserModel } = await import("./models");
      const { status, newPhone } = req.body;
      const me = req.user as any;
      const doc = await (PhoneRequestModel as any).findById(req.params.id);
      if (!doc) return res.status(404).json({ error: "الطلب غير موجود" });
      (doc as any).status       = status || "resolved";
      (doc as any).resolvedBy   = me._id || me.id;
      (doc as any).resolvedByName = me.fullName || me.username;
      (doc as any).resolvedAt   = new Date();
      if (newPhone) {
        (doc as any).newPhone = newPhone;
        await (UserModel as any).findByIdAndUpdate((doc as any).clientId, { phone: newPhone });
      }
      await doc.save();
      res.json(doc);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

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
    await UserModel.updateOne({ username: adminUsername }, { $set: { role: "admin", email: adminEmail } });
    console.log(`[Seed] Admin account verified: ${adminUsername}`);
  }

  // ── Migrate walletBalance from transactions (one-time sync for existing data) ──
  try {
    const { WalletTransactionModel: WTM } = await import("./models");
    const userIds: string[] = await WTM.distinct('userId');
    let migrated = 0;
    for (const uid of userIds) {
      const user = await UserModel.findById(uid).select("walletBalance");
      if (!user) continue;
      if ((user as any).walletBalance !== 0 && (user as any).walletBalance !== undefined && (user as any).walletBalance !== null) continue;
      const txs = await WTM.find({ userId: uid });
      const credit = txs.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + t.amount, 0);
      const debit = txs.filter((t: any) => t.type === 'debit').reduce((s: number, t: any) => s + t.amount, 0);
      const balance = Math.max(0, parseFloat((credit - debit).toFixed(2)));
      await UserModel.findByIdAndUpdate(uid, { walletBalance: balance });
      migrated++;
    }
    if (migrated > 0) console.log(`[WalletMigration] Synced walletBalance for ${migrated} users`);
  } catch (e) {
    console.error("[WalletMigration] Error:", e);
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

  // ── Auto-seed Extra Addons ────────────────────────────────────────────────
  try {
    const { ExtraAddonModel: EAM } = await import("./models");
    const addonDefaults = [
      { nameAr: "نشر على App Store (iOS)", name: "iOS App Store Publishing", descriptionAr: "رفع التطبيق ونشره على متجر Apple — يشمل إعداد الحساب والمراجعة", category: "app", price: 4500, icon: "Smartphone", sortOrder: 10, segments: [], plans: ["pro","infinite"] },
      { nameAr: "نشر على Play Store (Android)", name: "Android Play Store Publishing", descriptionAr: "رفع التطبيق ونشره على متجر Google Play — يشمل الإعداد والاختبار", category: "app", price: 3500, icon: "Smartphone", sortOrder: 11, segments: [], plans: ["pro","infinite"] },
      { nameAr: "تطبيق iOS + Android معاً", name: "iOS & Android Bundle", descriptionAr: "نشر على المتجرين معاً بسعر مخفض — وفر 1500 ريال", category: "app", price: 6500, icon: "Smartphone", sortOrder: 12, segments: [], plans: ["pro","infinite"] },
      { nameAr: "قاعدة بيانات 10 GB", name: "Database 10GB", descriptionAr: "قاعدة بيانات منفصلة بسعة 10 جيجا — مناسب للمشاريع الصغيرة", category: "hosting", price: 300, icon: "Database", sortOrder: 20, segments: [], plans: [] },
      { nameAr: "قاعدة بيانات 50 GB", name: "Database 50GB", descriptionAr: "قاعدة بيانات 50 جيجا — مناسب للمشاريع المتوسطة ذات البيانات الكبيرة", category: "hosting", price: 700, icon: "Database", sortOrder: 21, segments: [], plans: ["pro","infinite"] },
      { nameAr: "قاعدة بيانات 200 GB (Enterprise)", name: "Database 200GB", descriptionAr: "قاعدة بيانات 200 جيجا — للمشاريع الكبيرة والمؤسسات", category: "hosting", price: 1800, icon: "Database", sortOrder: 22, segments: [], plans: ["infinite"] },
      { nameAr: "استضافة على سيرفر مشترك", name: "Shared Hosting", descriptionAr: "استضافة على سيرفر مشترك — مناسب للمشاريع الأولية", category: "hosting", price: 250, icon: "Cloud", sortOrder: 30, segments: [], plans: ["lite"] },
      { nameAr: "استضافة VPS مخصص", name: "VPS Hosting", descriptionAr: "سيرفر VPS مخصص بأداء عالي وموارد مضمونة", category: "hosting", price: 900, icon: "Server", sortOrder: 31, segments: [], plans: ["pro","infinite"] },
      { nameAr: "استضافة Cloud (AWS/GCP)", name: "Cloud Hosting", descriptionAr: "استضافة على السحابة لضمان التوسّع والأداء العالي", category: "hosting", price: 2000, icon: "Cloud", sortOrder: 32, segments: [], plans: ["infinite"] },
      { nameAr: "بوابة دفع إلكتروني (مدى / Apple Pay)", name: "Payment Gateway", descriptionAr: "ربط بوابة الدفع بمدى وApple Pay وبطاقات الائتمان", category: "integration", price: 800, icon: "CreditCard", sortOrder: 40, segments: [], plans: [] },
      { nameAr: "تكامل واتساب (WhatsApp Business)", name: "WhatsApp Integration", descriptionAr: "إرسال إشعارات وتنبيهات للعملاء عبر واتساب بيزنس", category: "integration", price: 400, icon: "MessageCircle", sortOrder: 41, segments: [], plans: [] },
      { nameAr: "تكامل زيد للدفع", name: "Zid Integration", descriptionAr: "ربط المتجر بمنصة زيد للمبيعات والمخزون", category: "integration", price: 600, icon: "Link", sortOrder: 42, segments: ["ecommerce","store","commerce"], plans: [] },
      { nameAr: "تكامل سلة", name: "Salla Integration", descriptionAr: "ربط المتجر بمنصة سلة للبيع الإلكتروني", category: "integration", price: 600, icon: "Link", sortOrder: 43, segments: ["ecommerce","store","commerce"], plans: [] },
      { nameAr: "بوابة Paymob للدفع الإلكتروني", name: "Paymob Payment Gateway", descriptionAr: "ربط بوابة Paymob — تدعم مدى، فيزا، ماستر، Apple Pay، وتحويل بنكي. مجانية مع برو والإنفينتي", category: "integration", price: 100, icon: "CreditCard", sortOrder: 44, segments: [], plans: [], billingType: "one_time", includedInPlans: ["pro","infinite"], freeQuotaForIncluded: 0 },
      { nameAr: "التوافق مع نفاذ (Nafath)", name: "Nafath Compliance", descriptionAr: "تكامل منصة نفاذ للهوية الرقمية وتسجيل الدخول الآمن بالبطاقة الوطنية — سنوياً", category: "integration", price: 2000, icon: "Shield", sortOrder: 45, segments: [], plans: ["pro","infinite"], billingType: "annual", compatiblePeriods: ["annual","lifetime"] },
      { nameAr: "SEO متقدم + تحليلات", name: "Advanced SEO & Analytics", descriptionAr: "تهيئة SEO الشاملة وربط Google Analytics ولوحة البحث", category: "marketing", price: 700, icon: "TrendingUp", sortOrder: 50, segments: [], plans: [] },
      { nameAr: "تسويق عبر الإيميل", name: "Email Marketing", descriptionAr: "نظام رسائل إيميل تسويقي مع قوالب احترافية", category: "marketing", price: 500, icon: "Mail", sortOrder: 51, segments: [], plans: ["pro","infinite"] },
      { nameAr: "هوية بصرية كاملة", name: "Full Brand Identity", descriptionAr: "شعار + ألوان + خطوط + دليل الهوية البصرية على Figma", category: "design", price: 1800, icon: "Palette", sortOrder: 60, segments: [], plans: [] },
      { nameAr: "دعم فني شهري", name: "Monthly Technical Support", descriptionAr: "دعم فني شهري وإصلاح الأخطاء والتحديثات الأمنية", category: "support", price: 500, icon: "Headphones", sortOrder: 70, segments: [], plans: [] },
      { nameAr: "دعم فني سنوي", name: "Annual Technical Support", descriptionAr: "خطة دعم سنوية بخصم 20% — شاملة الصيانة والتحديثات", category: "support", price: 4800, icon: "Headphones", sortOrder: 71, segments: [], plans: ["pro","infinite"] },
      { nameAr: "نظام حجوزات (Reservation System)", name: "Reservation System", descriptionAr: "نظام حجز طاولة أو موعد مع تأكيد تلقائي للعميل", category: "feature", price: 1200, icon: "CalendarCheck", sortOrder: 80, segments: ["restaurant","food","healthcare","beauty","fitness"], plans: [] },
      { nameAr: "نظام توصيل وتتبع الطلبات", name: "Delivery Tracking", descriptionAr: "تتبع الطلبات لحظياً مع إشعارات للعميل والمطعم", category: "feature", price: 1500, icon: "MapPin", sortOrder: 81, segments: ["restaurant","food","ecommerce","store"], plans: ["pro","infinite"] },
      { nameAr: "لوحة تحكم تحليلات المبيعات", name: "Sales Analytics Dashboard", descriptionAr: "لوحة تحليل مبيعات وتقارير يومية وأسبوعية وشهرية", category: "feature", price: 900, icon: "BarChart3", sortOrder: 82, segments: [], plans: ["pro","infinite"] },
      { nameAr: "نظام إدارة الطلاب والكورسات", name: "LMS (Student Management)", descriptionAr: "نظام إدارة الطلاب والدورات والاختبارات والشهادات", category: "feature", price: 2000, icon: "GraduationCap", sortOrder: 83, segments: ["education"], plans: [] },
      { nameAr: "نظام CRM لإدارة العملاء", name: "CRM System", descriptionAr: "نظام إدارة علاقات العملاء وتتبع المتابعات والصفقات", category: "feature", price: 1600, icon: "Users", sortOrder: 84, segments: ["corporate","realestate","healthcare"], plans: ["pro","infinite"] },
      { nameAr: "رسائل نصية SMS (500 رسالة/شهر)", name: "SMS 500 Monthly", descriptionAr: "500 رسالة نصية شهرية — إشعارات وتنبيهات وتسويق للعملاء", category: "communication", price: 100, icon: "MessageSquare", sortOrder: 90, segments: [], plans: [], billingType: "monthly", quotaCount: 500, quotaLabel: "رسالة" },
      { nameAr: "خدمات البريد الإلكتروني (1000 رسالة)", name: "Transactional Email 1000", descriptionAr: "إرسال 1000 بريد إلكتروني — مجانية مع برو والإنفينتي، و50 ريال للإضافية", category: "communication", price: 50, icon: "Mail", sortOrder: 91, segments: [], plans: [], billingType: "one_time", quotaCount: 1000, quotaLabel: "رسالة بريدية", includedInPlans: ["pro","infinite"], freeQuotaForIncluded: 1000 },
    ] as any[];
    let seedAdded = 0;
    for (const d of addonDefaults) {
      const exists = await EAM.findOne({ nameAr: d.nameAr });
      if (!exists) { await EAM.create({ ...d, isActive: true, currency: "SAR" }); seedAdded++; }
    }
    if (seedAdded > 0) console.log(`[Seed] Extra addons: ${seedAdded} added`);
  } catch (e) { console.error("[Seed] Extra addons error:", e); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   قسط عبر كيروكس — Installment System Routes
   ═══════════════════════════════════════════════════════════════════════════ */
export async function registerInstallmentRoutes(app: Express) {
  const { InstallmentOfferModel, InstallmentApplicationModel, InstallmentPaymentModel, WalletTransactionModel, UserModel, NotificationModel } = await import("./models");

  const STAFF_ROLES = ["admin", "manager", "developer", "designer", "support", "sales_manager", "sales", "accountant", "merchant"];

  function serviceFeeByPeriod(period: string): number {
    if (period === "monthly") return 25;
    if (period === "sixmonth") return 50;
    return 100; // annual, lifetime
  }

  /* ── Admin: Offers ───────────────────────────────────────────────────── */
  app.get("/api/admin/installment/offers", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const offers = await InstallmentOfferModel.find().sort({ createdAt: -1 });
    res.json(offers);
  });

  app.post("/api/admin/installment/offers", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { title, titleAr, description, descriptionAr, planTier, planPeriod, planSegment, installmentCount, serviceFee, penaltyAmount, gracePeriodDays } = req.body;
    if (!title || !titleAr || !installmentCount) return res.status(400).json({ error: "البيانات ناقصة" });
    const fee = serviceFee ?? serviceFeeByPeriod(planPeriod || "annual");
    const offer = await InstallmentOfferModel.create({
      title, titleAr,
      description: description || "",
      descriptionAr: descriptionAr || "",
      planTier: planTier || "any",
      planPeriod: planPeriod || "any",
      planSegment: planSegment || "",
      installmentCount,
      serviceFee: fee,
      penaltyAmount: penaltyAmount ?? 50,
      gracePeriodDays: gracePeriodDays ?? 7,
      isActive: false,
      createdBy: (req.user as any)._id,
    });
    res.json(offer);
  });

  app.put("/api/admin/installment/offers/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { title, titleAr, description, descriptionAr, planTier, planPeriod, planSegment, installmentCount, serviceFee, penaltyAmount, gracePeriodDays, isActive } = req.body;
    const offer = await InstallmentOfferModel.findByIdAndUpdate(req.params.id, {
      $set: { title, titleAr, description, descriptionAr, planTier, planPeriod, planSegment, installmentCount, serviceFee, penaltyAmount, gracePeriodDays, isActive }
    }, { new: true });
    if (!offer) return res.status(404).json({ error: "العرض غير موجود" });
    res.json(offer);
  });

  app.delete("/api/admin/installment/offers/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    await InstallmentOfferModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/admin/installment/offers/:id/toggle", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const offer = await InstallmentOfferModel.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: "العرض غير موجود" });
    (offer as any).isActive = !(offer as any).isActive;
    await offer.save();
    res.json(offer);
  });

  /* ── Admin: Applications ─────────────────────────────────────────────── */
  app.get("/api/admin/installment/applications", async (req, res) => {
    if (!req.isAuthenticated() || !STAFF_ROLES.includes((req.user as any).role)) return res.sendStatus(403);
    const apps = await InstallmentApplicationModel.find()
      .populate("clientId", "fullName email")
      .populate("offerId", "title titleAr")
      .sort({ createdAt: -1 });
    res.json(apps);
  });

  app.get("/api/admin/installment/applications/:id", async (req, res) => {
    if (!req.isAuthenticated() || !STAFF_ROLES.includes((req.user as any).role)) return res.sendStatus(403);
    const app_ = await InstallmentApplicationModel.findById(req.params.id)
      .populate("clientId", "fullName email")
      .populate("offerId");
    if (!app_) return res.status(404).json({ error: "الطلب غير موجود" });
    const payments = await InstallmentPaymentModel.find({ applicationId: req.params.id }).sort({ installmentNumber: 1 });
    res.json({ application: app_, payments });
  });

  app.patch("/api/admin/installment/applications/:id/approve", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { adminNotes } = req.body;
    const appl = await InstallmentApplicationModel.findById(req.params.id);
    if (!appl) return res.status(404).json({ error: "الطلب غير موجود" });
    if ((appl as any).status !== "pending") return res.status(400).json({ error: "الطلب ليس في انتظار الموافقة" });

    (appl as any).status = "approved";
    (appl as any).adminNotes = adminNotes || "";
    (appl as any).approvedBy = (req.user as any)._id;
    (appl as any).approvedAt = new Date();
    await appl.save();

    // Create payment schedule
    const count = (appl as any).installmentCount;
    const baseAmount = (appl as any).installmentAmount;
    const now = new Date();
    for (let i = 1; i <= count; i++) {
      const dueDate = new Date(now);
      // First installment due now, rest monthly
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      await InstallmentPaymentModel.create({
        applicationId: appl._id,
        clientId: (appl as any).clientId,
        installmentNumber: i,
        amount: baseAmount,
        penalty: 0,
        totalDue: baseAmount,
        dueDate,
        status: "pending",
      });
    }

    // Notify client
    await NotificationModel.create({
      userId: (appl as any).clientId,
      title: "تمت الموافقة على طلب التقسيط",
      body: `تمت الموافقة على طلب التقسيط الخاص بك. يمكنك الآن دفع القسط الأول لتفعيل الباقة.`,
      type: "success",
      link: "/installments",
    });

    res.json({ success: true, application: appl });
  });

  app.patch("/api/admin/installment/applications/:id/reject", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const { rejectionReason } = req.body;
    const appl = await InstallmentApplicationModel.findById(req.params.id);
    if (!appl) return res.status(404).json({ error: "الطلب غير موجود" });
    (appl as any).status = "rejected";
    (appl as any).rejectionReason = rejectionReason || "";
    (appl as any).rejectedAt = new Date();
    await appl.save();

    await NotificationModel.create({
      userId: (appl as any).clientId,
      title: "رفض طلب التقسيط",
      body: `نأسف، تم رفض طلب التقسيط الخاص بك. السبب: ${rejectionReason || "لم يُحدد"}`,
      type: "error",
      link: "/installments",
    });

    res.json({ success: true });
  });

  app.patch("/api/admin/installment/applications/:id/lock", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const appl = await InstallmentApplicationModel.findById(req.params.id);
    if (!appl) return res.status(404).json({ error: "الطلب غير موجود" });
    (appl as any).status = "suspended";
    (appl as any).lockedAt = new Date();
    await appl.save();
    await UserModel.findByIdAndUpdate((appl as any).clientId, { $set: { subscriptionStatus: "suspended" } });
    await NotificationModel.create({
      userId: (appl as any).clientId,
      title: "تم تعليق خدمتك",
      body: "تم تعليق خدمتك بسبب التأخر في سداد أقساط التقسيط. يرجى السداد لاستعادة الخدمة.",
      type: "error",
      link: "/installments",
    });
    res.json({ success: true });
  });

  app.patch("/api/admin/installment/applications/:id/unlock", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const appl = await InstallmentApplicationModel.findById(req.params.id);
    if (!appl) return res.status(404).json({ error: "الطلب غير موجود" });
    (appl as any).status = "active";
    (appl as any).lockedAt = undefined;
    await appl.save();
    await UserModel.findByIdAndUpdate((appl as any).clientId, { $set: { subscriptionStatus: "active" } });
    await NotificationModel.create({
      userId: (appl as any).clientId,
      title: "تم رفع تعليق خدمتك",
      body: "تم استعادة خدمتك بنجاح. شكراً لسدادك.",
      type: "success",
      link: "/installments",
    });
    res.json({ success: true });
  });

  /* ── Client: Apply & Pay ─────────────────────────────────────────────── */
  app.get("/api/installment/offers", async (req, res) => {
    const offers = await InstallmentOfferModel.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(offers);
  });

  app.post("/api/installment/apply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (!["client", "customer"].includes(user.role)) return res.status(403).json({ error: "متاح للعملاء فقط" });

    const { offerId, planTier, planPeriod, planSegment, planSegmentNameAr, totalAmount, clientNotes } = req.body;
    if (!offerId || !planTier || !planPeriod || !totalAmount) return res.status(400).json({ error: "بيانات ناقصة" });

    const offer = await InstallmentOfferModel.findById(offerId);
    if (!offer || !(offer as any).isActive) return res.status(404).json({ error: "العرض غير متاح" });

    const existing = await InstallmentApplicationModel.findOne({ clientId: user._id, status: { $in: ["pending", "approved", "active"] } });
    if (existing) return res.status(400).json({ error: "لديك طلب تقسيط نشط بالفعل" });

    const serviceFee = (offer as any).serviceFee;
    const grandTotal = totalAmount + serviceFee;
    const installmentCount = (offer as any).installmentCount;
    const installmentAmount = Math.ceil(grandTotal / installmentCount);

    const appl = await InstallmentApplicationModel.create({
      clientId: user._id,
      offerId,
      planTier,
      planPeriod,
      planSegment: planSegment || "",
      planSegmentNameAr: planSegmentNameAr || "",
      totalAmount,
      serviceFee,
      grandTotal,
      installmentCount,
      installmentAmount,
      clientNotes: clientNotes || "",
      status: "pending",
    });

    // Notify admins
    await NotificationModel.create({
      userId: null,
      forAdmins: true,
      title: "طلب تقسيط جديد",
      body: `قدّم العميل ${user.fullName} طلب تقسيط جديد بقيمة ${grandTotal} ريال على ${installmentCount} أقساط`,
      type: "info",
      link: "/admin/installments",
    });

    res.json({ success: true, application: appl });
  });

  app.get("/api/installment/my", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const apps = await InstallmentApplicationModel.find({ clientId: user._id })
      .populate("offerId", "title titleAr")
      .sort({ createdAt: -1 });
    const result = await Promise.all(apps.map(async (a: any) => {
      const payments = await InstallmentPaymentModel.find({ applicationId: a._id }).sort({ installmentNumber: 1 });
      return { ...a.toJSON(), payments };
    }));
    res.json(result);
  });

  app.post("/api/installment/pay/:paymentId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const { walletPin } = req.body;

    const payment = await InstallmentPaymentModel.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ error: "القسط غير موجود" });
    if ((payment as any).clientId.toString() !== user._id.toString()) return res.status(403).json({ error: "غير مصرح" });
    if ((payment as any).status === "paid") return res.status(400).json({ error: "هذا القسط مدفوع بالفعل" });

    const appl = await InstallmentApplicationModel.findById((payment as any).applicationId);
    if (!appl) return res.status(404).json({ error: "الطلب غير موجود" });
    if (!["approved", "active", "suspended"].includes((appl as any).status)) return res.status(400).json({ error: "لا يمكن الدفع الآن" });

    const amountDue = (payment as any).totalDue;

    // Wallet balance check (atomic)
    const balance = await getWalletBalance(String(user._id));
    if (balance < amountDue) return res.status(400).json({ error: `رصيد المحفظة غير كافٍ. الرصيد: ${balance.toFixed(2)} ريال` });

    // Validate PIN if set (fetch fresh user from DB)
    const dbUser = await UserModel.findById(String(user._id)).select("+walletPin");
    if (dbUser?.walletPin) {
      if (!walletPin) return res.status(400).json({ error: "يجب إدخال رقم PIN المحفظة" });
      const bcrypt = await import("bcrypt");
      const valid = await bcrypt.compare(String(walletPin), dbUser.walletPin);
      if (!valid) return res.status(400).json({ error: "رقم PIN غير صحيح" });
    }

    // Deduct from wallet (atomic)
    const debitOk = await atomicWalletDebit(String(user._id), amountDue);
    if (!debitOk) return res.status(400).json({ error: `الرصيد غير كافٍ أو تم تعديله. يرجى المحاولة مجدداً` });
    const txn = await WalletTransactionModel.create({
      userId: user._id,
      type: "debit",
      amount: amountDue,
      description: `قسط رقم ${(payment as any).installmentNumber} - قسط عبر كيروكس`,
      note: `تقسيط طلب #${(appl as any)._id}`,
    });

    // Update payment
    (payment as any).status = "paid";
    (payment as any).paidAt = new Date();
    (payment as any).walletTransactionId = txn._id;
    await payment.save();

    // Update application
    (appl as any).paidInstallments = ((appl as any).paidInstallments || 0) + 1;

    const totalInstallments = (appl as any).installmentCount;
    const isFirstPayment = (payment as any).installmentNumber === 1;

    if ((appl as any).paidInstallments >= totalInstallments) {
      (appl as any).status = "completed";
      (appl as any).completedAt = new Date();
      await UserModel.findByIdAndUpdate(user._id, { $set: { subscriptionStatus: "active" } });
      await NotificationModel.create({
        userId: user._id,
        title: "اكتمل التقسيط",
        body: "مبروك! لقد أتممت سداد جميع الأقساط. شكراً لثقتك بنا.",
        type: "success",
        link: "/installments",
      });
    } else {
      if (isFirstPayment || (appl as any).status === "approved") {
        (appl as any).status = "active";
        // Activate subscription on first payment
        await UserModel.findByIdAndUpdate(user._id, { $set: { subscriptionStatus: "active" } });
      }
      if ((appl as any).status === "suspended") {
        (appl as any).status = "active";
        (appl as any).lockedAt = undefined;
        await UserModel.findByIdAndUpdate(user._id, { $set: { subscriptionStatus: "active" } });
      }
      // Find next pending payment
      const nextPayment = await InstallmentPaymentModel.findOne({ applicationId: appl._id, status: { $in: ["pending", "late", "penalized"] } }).sort({ installmentNumber: 1 });
      if (nextPayment) (appl as any).nextDueDate = (nextPayment as any).dueDate;
    }

    await appl.save();
    res.json({ success: true, paidAmount: amountDue });
  });

  /* ── Cron: Late payment checker ──────────────────────────────────────── */
  app.post("/api/admin/installment/check-late", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "manager"].includes((req.user as any).role)) return res.sendStatus(403);
    const result = await runInstallmentLateCheck();
    res.json(result);
  });
}

export async function runInstallmentLateCheck() {
  const { InstallmentApplicationModel, InstallmentPaymentModel, UserModel, NotificationModel } = await import("./models");
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Find all pending/late payments that are overdue
  const overduePayments = await InstallmentPaymentModel.find({
    status: { $in: ["pending", "late"] },
    dueDate: { $lt: now },
  });

  let locked = 0, penalized = 0;

  for (const payment of overduePayments) {
    const appl = await InstallmentApplicationModel.findById((payment as any).applicationId);
    if (!appl || !["active", "approved"].includes((appl as any).status)) continue;

    const offer = await (await import("./models")).InstallmentOfferModel.findById((appl as any).offerId);
    const penaltyAmount = offer ? (offer as any).penaltyAmount : 50;
    const graceDays = offer ? (offer as any).gracePeriodDays : 7;

    const dueDate = new Date((payment as any).dueDate);
    const graceCutoff = new Date(dueDate.getTime() + graceDays * 24 * 60 * 60 * 1000);

    // Any late → lock immediately
    if ((appl as any).status !== "suspended") {
      (appl as any).status = "suspended";
      (appl as any).lockedAt = now;
      await appl.save();
      await UserModel.findByIdAndUpdate((appl as any).clientId, { $set: { subscriptionStatus: "suspended" } });
      await NotificationModel.create({
        userId: (appl as any).clientId,
        title: "تم تعليق خدمتك",
        body: "تم تعليق خدمتك بسبب التأخر في سداد القسط. يرجى السداد فوراً لاستعادة الخدمة.",
        type: "error",
        link: "/installments",
      });
      locked++;
    }

    // After grace period → add penalty
    if (now > graceCutoff && (payment as any).status !== "penalized" && (payment as any).penalty === 0) {
      (payment as any).penalty = penaltyAmount;
      (payment as any).totalDue = (payment as any).amount + penaltyAmount;
      (payment as any).status = "penalized";
      await payment.save();
      await NotificationModel.create({
        userId: (appl as any).clientId,
        title: "تم إضافة غرامة تأخير",
        body: `تم إضافة غرامة تأخير بمبلغ ${penaltyAmount} ريال للقسط رقم ${(payment as any).installmentNumber}`,
        type: "warning",
        link: "/installments",
      });
      penalized++;
    } else if ((payment as any).status === "pending") {
      (payment as any).status = "late";
      await payment.save();
    }
  }

  return { checked: overduePayments.length, locked, penalized };
}
