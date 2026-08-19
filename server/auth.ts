import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

const scryptAsync = promisify(scrypt);

const PUBLIC_ROUTE_PREFIXES = [
  "/api/public/",
  "/api/pricing",
  "/api/news",
  "/api/jobs",
  "/api/partners",
  "/api/products",
  "/api/services",
  "/api/sectors",
];

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix));
}

const userCache = new Map<string, { user: User; expiresAt: number }>();
const USER_CACHE_TTL = 5 * 60_000;

function getCachedUser(id: string): User | undefined {
  const entry = userCache.get(id);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    userCache.delete(id);
    return undefined;
  }
  return entry.user;
}

function setCachedUser(id: string, user: User): void {
  userCache.set(id, { user, expiresAt: Date.now() + USER_CACHE_TTL });
}

export function invalidateUserCache(id?: string): void {
  if (id) {
    userCache.delete(id);
  } else {
    userCache.clear();
  }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const SESSION_DAYS = 14;
  const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

  // SEC-CRIT-001: SESSION_SECRET must be set — no hardcoded fallback allowed.
  // In production a missing secret is a hard crash. In development a random
  // ephemeral secret is generated so developers don't need to configure it,
  // but sessions will not persist across server restarts.
  let sessionSecret: string;
  if (process.env.SESSION_SECRET) {
    sessionSecret = process.env.SESSION_SECRET;
  } else if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[SECURITY] SESSION_SECRET environment variable is required in production. " +
      "Generate one with: openssl rand -hex 32"
    );
  } else {
    sessionSecret = randomBytes(32).toString("hex");
    console.warn("[auth] SESSION_SECRET not set — using ephemeral random secret (sessions will not persist across restarts).");
  }

  const mongoUri = (process.env.MONGODB_URI || "").replace(/\s+/g, "");
  const configuredSameSite = String(process.env.SESSION_COOKIE_SAMESITE || "").toLowerCase();
  const hasCrossOriginFrontend = String(process.env.CORS_ORIGINS || "").split(",").some(Boolean);
  const sameSite: "lax" | "strict" | "none" =
    configuredSameSite === "strict" || configuredSameSite === "none"
      ? configuredSameSite
      : hasCrossOriginFrontend ? "none" : "lax";

  const sessionSettings: session.SessionOptions = {
    store: mongoUri
      ? MongoStore.create({
          mongoUrl: mongoUri,
          collectionName: "sessions",
          ttl: SESSION_MS / 1000,
          autoRemove: "native",
          touchAfter: 24 * 3600,
        })
      : undefined,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: SESSION_MS,
      secure: process.env.NODE_ENV === "production" || sameSite === "none",
      sameSite,
      httpOnly: true,
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  const sessionMiddleware = session(sessionSettings);

  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          setCachedUser(user.id, user);
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    const id = (user as User).id;
    done(null, id ? id.toString() : null);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const cached = getCachedUser(id);
      if (cached) return done(null, cached);

      const user = await storage.getUser(id);
      if (user) setCachedUser(id, user);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  return { hashPassword, comparePasswords };
}
