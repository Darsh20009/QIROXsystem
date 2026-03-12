import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
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

  const MemoryStore = createMemoryStore(session);

  const sessionSettings: session.SessionOptions = {
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
    secret: process.env.SESSION_SECRET || "qirox_super_secret_key",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: SESSION_MS,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
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
