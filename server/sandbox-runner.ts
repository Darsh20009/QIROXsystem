import { ChildProcess, spawn, execSync } from "child_process";
import path from "path";
import { getProjectDir } from "./sandbox-fs";
import { pushToUser, broadcastSandboxLog } from "./ws";

const ALLOWED_COMMANDS = [
  "node", "npm", "npx", "python", "python3", "pip", "pip3",
  "serve", "vite", "next", "nuxt", "tsx", "ts-node",
];

function sanitizeCommand(cmd: string): string {
  const dangerous = /[;&|`(){}!><\n\r]/;
  if (dangerous.test(cmd)) {
    throw new Error("أمر غير آمن — يحتوي رموز ممنوعة");
  }
  const parts = cmd.trim().split(/\s+/);
  const base = parts[0].replace(/^(npx|npm\s+run)\s+/, "");
  const baseCmd = path.basename(parts[0]);
  if (!ALLOWED_COMMANDS.includes(baseCmd) && !parts[0].startsWith("npm") && !parts[0].startsWith("npx")) {
    throw new Error(`أمر غير مسموح: ${baseCmd}`);
  }
  return cmd.trim();
}

interface RunningProcess {
  process: ChildProcess;
  projectId: string;
  ownerId: string;
  port: number;
  startedAt: number;
}

const runningProcesses = new Map<string, RunningProcess>();
const PORT_MIN = 6100;
const PORT_MAX = 6999;
const usedPorts = new Set<number>();

function allocatePort(): number {
  for (let p = PORT_MIN; p <= PORT_MAX; p++) {
    if (!usedPorts.has(p)) {
      usedPorts.add(p);
      return p;
    }
  }
  throw new Error("No available ports");
}

function releasePort(port: number): void {
  usedPorts.delete(port);
}

function broadcastLog(ownerId: string, projectId: string, stream: "stdout" | "stderr", text: string): void {
  broadcastSandboxLog(projectId, stream, text);
  pushToUser(ownerId, {
    type: "sandbox-log",
    projectId,
    stream,
    text,
    ts: Date.now(),
  });
}

export async function startProcess(
  projectId: string,
  ownerId: string,
  opts: { startCmd: string; installCmd?: string; env?: Record<string, string>; runtime?: string }
): Promise<{ port: number; pid: number }> {
  if (runningProcesses.has(projectId)) {
    await stopProcess(projectId);
  }

  const cwd = getProjectDir(projectId);
  const port = allocatePort();

  const envVars: Record<string, string> = {
    ...process.env as Record<string, string>,
    PORT: String(port),
    NODE_ENV: "development",
    ...(opts.env || {}),
  };

  if (opts.installCmd) {
    broadcastLog(ownerId, projectId, "stdout", `⏳ تثبيت التبعيات: ${opts.installCmd}\n`);
    try {
      await runCommand(opts.installCmd, cwd, envVars, ownerId, projectId);
      broadcastLog(ownerId, projectId, "stdout", "✅ تم التثبيت بنجاح\n");
    } catch (err: any) {
      broadcastLog(ownerId, projectId, "stderr", `❌ فشل التثبيت: ${err.message}\n`);
      releasePort(port);
      throw err;
    }
  }

  const sanitizedCmd = sanitizeCommand(opts.startCmd);
  broadcastLog(ownerId, projectId, "stdout", `🚀 بدء التشغيل: ${sanitizedCmd} (منفذ ${port})\n`);

  const child = spawn("/bin/sh", ["-c", sanitizedCmd], {
    cwd,
    env: envVars,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (data: Buffer) => {
    broadcastLog(ownerId, projectId, "stdout", data.toString());
  });

  child.stderr?.on("data", (data: Buffer) => {
    broadcastLog(ownerId, projectId, "stderr", data.toString());
  });

  child.on("exit", (code) => {
    broadcastLog(ownerId, projectId, "stdout", `\n⏹ العملية توقفت (كود: ${code})\n`);
    runningProcesses.delete(projectId);
    releasePort(port);
    pushToUser(ownerId, { type: "sandbox-status", projectId, status: "stopped" });
  });

  child.on("error", (err) => {
    broadcastLog(ownerId, projectId, "stderr", `❌ خطأ: ${err.message}\n`);
    runningProcesses.delete(projectId);
    releasePort(port);
    pushToUser(ownerId, { type: "sandbox-status", projectId, status: "error" });
  });

  runningProcesses.set(projectId, {
    process: child,
    projectId,
    ownerId,
    port,
    startedAt: Date.now(),
  });

  return { port, pid: child.pid || 0 };
}

function runCommand(cmd: string, cwd: string, env: Record<string, string>, ownerId: string, projectId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, { cwd, env, shell: true, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout?.on("data", (d: Buffer) => broadcastLog(ownerId, projectId, "stdout", d.toString()));
    child.stderr?.on("data", (d: Buffer) => broadcastLog(ownerId, projectId, "stderr", d.toString()));
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Exit code ${code}`)));
    child.on("error", reject);
    setTimeout(() => { try { child.kill(); } catch {} reject(new Error("Install timeout")); }, 120000);
  });
}

export async function stopProcess(projectId: string): Promise<void> {
  const entry = runningProcesses.get(projectId);
  if (!entry) return;
  try {
    const pid = entry.process.pid;
    if (pid) {
      try { execSync(`kill -- -${pid} 2>/dev/null || true`); } catch {}
    }
    entry.process.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        try { entry.process.kill("SIGKILL"); } catch {}
        if (pid) { try { execSync(`kill -9 -- -${pid} 2>/dev/null || true`); } catch {} }
        resolve();
      }, 5000);
      entry.process.on("exit", () => { clearTimeout(timeout); resolve(); });
    });
  } catch {}
  releasePort(entry.port);
  runningProcesses.delete(projectId);
}

export function getProcessInfo(projectId: string): { port: number; pid: number; startedAt: number } | null {
  const entry = runningProcesses.get(projectId);
  if (!entry) return null;
  return { port: entry.port, pid: entry.process.pid || 0, startedAt: entry.startedAt };
}

export function isRunning(projectId: string): boolean {
  return runningProcesses.has(projectId);
}

export function getAllRunning(): { projectId: string; ownerId: string; port: number; startedAt: number }[] {
  return [...runningProcesses.values()].map(e => ({
    projectId: e.projectId,
    ownerId: e.ownerId,
    port: e.port,
    startedAt: e.startedAt,
  }));
}

export async function stopAllProcesses(): Promise<void> {
  const ids = [...runningProcesses.keys()];
  await Promise.all(ids.map(id => stopProcess(id)));
}
