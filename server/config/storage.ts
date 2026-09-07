// ── Storage Configuration ─────────────────────────────────────────────────────
// Local file upload settings and allowed MIME types.
//
// Purpose:
//   Centralizes upload directory paths, size limits, and allowed file types
//   currently hardcoded in server/routes.ts (the multer setup).
//
// Usage:
//   import { buildStorageConfig } from "./config/storage";
//   const config = buildStorageConfig(process.env);
//
// Future migration role:
//   Feeds the multer factory in server/routes.ts once the DI container
//   injects StorageConfig into route registration.

import {
  type EnvBag,
  type ConfigModule,
  type ConfigValidationResult,
  envInt,
  validResult,
  invalidResult,
} from "./types";

// ── Interface ─────────────────────────────────────────────────────────────────

export interface StorageConfig {
  /**
   * Absolute or CWD-relative directory for user uploads.
   * Maps to: UPLOADS_DIR. Default: "uploads"
   */
  uploadsDir: string;

  /**
   * Absolute or CWD-relative directory for sandbox IDE project files.
   * Maps to: SANDBOX_DIR. Default: "sandbox-projects"
   */
  sandboxDir: string;

  /**
   * Maximum single-file upload size in bytes.
   * Maps to: UPLOAD_MAX_BYTES. Default: 20971520 (20 MB)
   */
  maxFileSizeBytes: number;

  /**
   * Allowed file extensions (lowercase, without leading dot).
   * Maps to: UPLOAD_ALLOWED_EXTS (comma-separated).
   * Default covers images, documents, archives, and media.
   */
  allowedExtensions: string[];

  /**
   * Whether to preserve original filenames.
   * When false (default), filenames are replaced with random hex strings.
   * Maps to: UPLOAD_PRESERVE_NAMES
   */
  preserveFilenames: boolean;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_ALLOWED_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "webp",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "zip", "rar",
  "mp4", "mov", "avi", "mp3", "wav", "webm", "ogg",
  "oga", "weba", "m4a", "aac", "opus",
];

export const STORAGE_DEFAULTS: Readonly<Partial<StorageConfig>> = {
  uploadsDir:         "uploads",
  sandboxDir:         "sandbox-projects",
  maxFileSizeBytes:   20 * 1024 * 1024,
  allowedExtensions:  DEFAULT_ALLOWED_EXTENSIONS,
  preserveFilenames:  false,
};

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildStorageConfig(env: EnvBag = process.env): StorageConfig {
  const rawExts = env.UPLOAD_ALLOWED_EXTS;
  const allowedExtensions = rawExts
    ? rawExts.split(",").map(s => s.trim().replace(/^\./, "").toLowerCase()).filter(Boolean)
    : DEFAULT_ALLOWED_EXTENSIONS;

  return {
    uploadsDir:        env.UPLOADS_DIR ?? "uploads",
    sandboxDir:        env.SANDBOX_DIR ?? "sandbox-projects",
    maxFileSizeBytes:  envInt(env.UPLOAD_MAX_BYTES, 20 * 1024 * 1024),
    allowedExtensions,
    preserveFilenames: env.UPLOAD_PRESERVE_NAMES === "true",
  };
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validateStorageConfig(config: StorageConfig): ConfigValidationResult {
  const issues = [];
  if (config.maxFileSizeBytes < 1) {
    issues.push({ field: "storage.maxFileSizeBytes", message: "Max file size must be positive", severity: "error" as const });
  }
  if (config.allowedExtensions.length === 0) {
    issues.push({ field: "storage.allowedExtensions", message: "No allowed extensions configured — all uploads will be rejected", severity: "warning" as const });
  }
  return issues.length ? invalidResult("storage", issues) : validResult("storage");
}

// ── Module ────────────────────────────────────────────────────────────────────

export const storageConfigModule: ConfigModule<StorageConfig> = {
  moduleName: "storage",
  defaults:   STORAGE_DEFAULTS,
  build:      buildStorageConfig,
  validate:   validateStorageConfig,
};
