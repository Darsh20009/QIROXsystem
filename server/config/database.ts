// ── Database Configuration ────────────────────────────────────────────────────
// MongoDB connection settings for primary, QMeet, and system databases.
//
// Purpose:
//   Centralizes all MongoDB URI and connection-pool settings.
//   Supports dynamic connection switching (the connManager pattern) by
//   exposing each connection as a named slot.
//
// Usage:
//   import { buildDatabaseConfig } from "./config/database";
//   const config = buildDatabaseConfig(process.env);
//
// Future migration role:
//   The DI container will call buildDatabaseConfig() at startup and pass the
//   result to connectToDatabase() and connManager, eliminating scattered
//   process.env reads in server/db.ts and server/connection-manager.ts.

import {
  type EnvBag,
  type ConfigModule,
  type ConfigValidationResult,
  envInt,
  envBool,
  validResult,
  invalidResult,
} from "./types";

// ── Interface ─────────────────────────────────────────────────────────────────

/** Settings for one MongoDB connection slot. */
export interface MongoConnectionConfig {
  /** Full MongoDB connection URI. Maps to: MONGODB_URI (primary), QMEET_MONGODB_URI, etc. */
  uri: string;

  /** Human-readable label for diagnostics (e.g. "primary", "qmeet"). */
  label: string;

  /** Max connections in the pool. Maps to: DB_POOL_SIZE. Default: 10. */
  poolSize: number;

  /** Connection timeout in ms. Maps to: DB_CONNECT_TIMEOUT_MS. Default: 10000. */
  connectTimeoutMs: number;

  /** Socket timeout in ms. Maps to: DB_SOCKET_TIMEOUT_MS. Default: 45000. */
  socketTimeoutMs: number;

  /** Retry on initial connection failure. Default: true. */
  retryWrites: boolean;
}

export interface DatabaseConfig {
  /** Primary application database. */
  primary: MongoConnectionConfig;

  /**
   * QMeet conferencing database.
   * Falls back to primary URI when QMEET_MONGODB_URI is not set.
   */
  qmeet: MongoConnectionConfig;

  /**
   * System-settings / bootstrap database.
   * Falls back to primary URI when SYSTEM_MONGODB_URI is not set.
   */
  system: MongoConnectionConfig;

  /**
   * Mongoose global settings applied to all connections.
   */
  mongoose: {
    /** Disable Mongoose's built-in buffering (fail fast). Default: false. */
    bufferCommands: boolean;
    /** Automatically create indexes in development. Default: true in dev. */
    autoIndex: boolean;
  };
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const CONNECTION_DEFAULTS: Omit<MongoConnectionConfig, "uri" | "label"> = {
  poolSize:         10,
  connectTimeoutMs: 10_000,
  socketTimeoutMs:  45_000,
  retryWrites:      true,
};

export const DATABASE_DEFAULTS: Readonly<Partial<DatabaseConfig>> = {
  mongoose: { bufferCommands: false, autoIndex: true },
};

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildDatabaseConfig(env: EnvBag = process.env): DatabaseConfig {
  const primaryUri = env.MONGODB_URI ?? "";
  const poolSize   = envInt(env.DB_POOL_SIZE, CONNECTION_DEFAULTS.poolSize);
  const connTo     = envInt(env.DB_CONNECT_TIMEOUT_MS, CONNECTION_DEFAULTS.connectTimeoutMs);
  const sockTo     = envInt(env.DB_SOCKET_TIMEOUT_MS, CONNECTION_DEFAULTS.socketTimeoutMs);
  const isDev      = (env.NODE_ENV ?? "development") !== "production";

  return {
    primary: {
      ...CONNECTION_DEFAULTS,
      uri:              primaryUri,
      label:            "primary",
      poolSize,
      connectTimeoutMs: connTo,
      socketTimeoutMs:  sockTo,
    },
    qmeet: {
      ...CONNECTION_DEFAULTS,
      uri:              env.QMEET_MONGODB_URI ?? primaryUri,
      label:            "qmeet",
      poolSize,
      connectTimeoutMs: connTo,
      socketTimeoutMs:  sockTo,
    },
    system: {
      ...CONNECTION_DEFAULTS,
      uri:              env.SYSTEM_MONGODB_URI ?? primaryUri,
      label:            "system",
      poolSize:         2, // System DB needs fewer connections.
      connectTimeoutMs: connTo,
      socketTimeoutMs:  sockTo,
    },
    mongoose: {
      bufferCommands: envBool(env.DB_BUFFER_COMMANDS, false),
      autoIndex:      isDev,
    },
  };
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validateDatabaseConfig(config: DatabaseConfig): ConfigValidationResult {
  const issues = [];
  if (!config.primary.uri) {
    issues.push({ field: "database.primary.uri", message: "MONGODB_URI is required", severity: "error" as const });
  } else if (!config.primary.uri.startsWith("mongodb")) {
    issues.push({ field: "database.primary.uri", message: "MONGODB_URI must start with mongodb:// or mongodb+srv://", severity: "error" as const });
  }
  if (config.primary.poolSize < 1 || config.primary.poolSize > 100) {
    issues.push({ field: "database.primary.poolSize", message: "Pool size must be between 1 and 100", severity: "warning" as const });
  }
  return issues.length ? invalidResult("database", issues) : validResult("database");
}

// ── Module ────────────────────────────────────────────────────────────────────

export const databaseConfigModule: ConfigModule<DatabaseConfig> = {
  moduleName: "database",
  defaults:   DATABASE_DEFAULTS,
  build:      buildDatabaseConfig,
  validate:   validateDatabaseConfig,
};
