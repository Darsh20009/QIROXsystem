import crypto from "crypto";

/**
 * Secret used to authenticate internal cron-to-server calls.
 * Override via the INTERNAL_CRON_SECRET environment variable.
 * If not set, a strong random value is generated at startup — valid
 * for the lifetime of the process, rotated on each restart.
 */
export const INTERNAL_CRON_SECRET: string =
  process.env.INTERNAL_CRON_SECRET || crypto.randomBytes(32).toString("hex");
