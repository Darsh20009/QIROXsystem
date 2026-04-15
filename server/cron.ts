import cron, { ScheduledTask } from "node-cron";
import { CronJobModel } from "./models";

const activeTasks = new Map<string, ScheduledTask>();

const PORT = parseInt(process.env.PORT || "5000", 10);
const BASE_URL = `http://127.0.0.1:${PORT}`;

function resolveUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  if (url.startsWith("localhost")) return `http://${url}`;
  return url;
}

async function runJob(jobId: string, triggeredBy: "schedule" | "manual" = "schedule") {
  const job = await CronJobModel.findById(jobId);
  if (!job || !job.isActive) return;

  const start = Date.now();
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (job.headers) {
      for (const [k, v] of Object.entries(job.headers.toObject ? job.headers.toObject() : job.headers)) {
        headers[k as string] = v as string;
      }
    }

    const fetchOptions: RequestInit = {
      method: job.method || "GET",
      headers,
    };

    if (job.body && job.method !== "GET" && job.method !== "DELETE") {
      fetchOptions.body = job.body;
    }

    const resolvedUrl = resolveUrl(job.url);
    const res = await fetch(resolvedUrl, fetchOptions);
    const duration = Date.now() - start;
    const responseText = await res.text().catch(() => "");

    const logEntry = {
      runAt: new Date(),
      status: res.ok ? "success" : "error",
      duration,
      response: responseText.slice(0, 500),
      triggeredBy,
    };
    await CronJobModel.findByIdAndUpdate(jobId, {
      lastRunAt: logEntry.runAt,
      lastRunStatus: logEntry.status,
      lastRunResponse: logEntry.response,
      lastRunDuration: duration,
      $inc: res.ok ? { successCount: 1 } : { errorCount: 1 },
      $push: { runLogs: { $each: [logEntry], $slice: -100 } },
    });
  } catch (err: any) {
    const duration = Date.now() - start;
    const logEntry = {
      runAt: new Date(),
      status: "error",
      duration,
      response: err?.message || "Connection error",
      triggeredBy,
    };
    await CronJobModel.findByIdAndUpdate(jobId, {
      lastRunAt: logEntry.runAt,
      lastRunStatus: "error",
      lastRunResponse: logEntry.response,
      lastRunDuration: duration,
      $inc: { errorCount: 1 },
      $push: { runLogs: { $each: [logEntry], $slice: -100 } },
    });
  }
}

export function scheduleCronJob(jobId: string, schedule: string) {
  stopCronJob(jobId);
  if (!cron.validate(schedule)) return false;
  const task = cron.schedule(schedule, () => runJob(jobId), { timezone: "Asia/Riyadh" });
  activeTasks.set(jobId, task);
  return true;
}

export function stopCronJob(jobId: string) {
  const existing = activeTasks.get(jobId);
  if (existing) {
    existing.destroy();
    activeTasks.delete(jobId);
  }
}

export async function initCronJobs() {
  const jobs = await CronJobModel.find({ isActive: true });
  for (const job of jobs) {
    scheduleCronJob(String(job._id), job.schedule);
  }
  console.log(`Initialized ${jobs.length} cron jobs`);
}

export async function runJobNow(jobId: string) {
  return runJob(jobId, "manual");
}

export async function testJobConnection(url: string, method = "GET", headers: Record<string, string> = {}, body = "") {
  const start = Date.now();
  const resolvedUrl = resolveUrl(url);
  try {
    const h: Record<string, string> = { "Content-Type": "application/json", ...headers };
    const opts: RequestInit = { method, headers: h };
    if (body && method !== "GET" && method !== "DELETE") opts.body = body;
    const res = await fetch(resolvedUrl, opts);
    const duration = Date.now() - start;
    const text = await res.text().catch(() => "");
    return { success: res.ok, status: res.status, statusText: res.statusText, duration, response: text.slice(0, 300), resolvedUrl };
  } catch (err: any) {
    return { success: false, status: 0, statusText: err?.message || "Connection error", duration: Date.now() - start, response: "", resolvedUrl };
  }
}
