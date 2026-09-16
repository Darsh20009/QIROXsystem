import { spawn } from "child_process";
import { getOpenAIClient } from "./lib/openai-client";
import { listTree, readFile, writeFile, getProjectDir } from "./sandbox-fs";
import { sanitizeCommand } from "./sandbox-runner";

const MAX_CONTEXT_FILES = 24;
const MAX_CONTEXT_BYTES = 100_000;
const MAX_PATCH_FILES = 32;
const MAX_PATCH_BYTES = 450_000;
const MAX_COMMANDS = 8;
const COMMAND_TIMEOUT_MS = 120_000;

export interface AgentLog {
  stream: "stdout" | "stderr";
  text: string;
}

export interface AgentPlan {
  summary?: string;
  patches?: Array<{ path: string; content: string }>;
  commands?: string[];
  config?: {
    entryFile?: string;
    startCmd?: string;
    installCmd?: string;
    buildCmd?: string;
  };
  done?: boolean;
}

export interface SandboxAgentResult {
  success: boolean;
  summary: string;
  iterations: number;
  filesChanged: string[];
  commandsRun: string[];
  verification: Array<{ command: string; ok: boolean; output: string }>;
  runtime?: { running: boolean; port?: number; output?: string };
  projectConfig?: AgentPlan["config"];
  error?: string;
}

interface AgentOptions {
  projectId: string;
  prompt: string;
  model?: string;
  maxIterations?: number;
  autoRun?: boolean;
  env?: Record<string, string>;
  log?: (entry: AgentLog) => void;
  startProject?: (startCmd?: string) => Promise<{ running: boolean; port?: number; output?: string }>;
}

function emit(options: AgentOptions, stream: AgentLog["stream"], text: string): void {
  options.log?.({ stream, text });
}

function flattenFiles(entries: any[], result: string[] = []): string[] {
  for (const entry of entries) {
    if (entry.type === "file") result.push(String(entry.path));
    if (entry.children) flattenFiles(entry.children, result);
  }
  return result;
}

function buildProjectContext(projectId: string): string {
  const paths = flattenFiles(listTree(projectId, "", 4));
  const priority = [
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "vite.config.ts",
    "vite.config.js",
    "tsconfig.json",
    "src/main.tsx",
    "src/main.jsx",
    "src/App.tsx",
    "src/App.jsx",
    "index.js",
    "server/index.ts",
  ];
  const ordered = [...priority.filter((path) => paths.includes(path)), ...paths.filter((path) => !priority.includes(path))]
    .filter((path, index, list) => list.indexOf(path) === index)
    .slice(0, MAX_CONTEXT_FILES);

  let bytes = 0;
  const sections: string[] = [`PROJECT FILES:\n${paths.slice(0, 160).join("\n")}`];
  for (const filePath of ordered) {
    try {
      const content = readFile(projectId, filePath);
      const remaining = MAX_CONTEXT_BYTES - bytes;
      if (remaining <= 0) break;
      const clipped = content
        .slice(0, Math.min(remaining, 24_000))
        .replace(
          /((?:api[_-]?key|secret|password|token|private[_-]?key|mongodb[_-]?uri)\s*[:=]\s*["']?)[^"'`\s,}]+/gi,
          "$1[REDACTED]",
        );
      bytes += clipped.length;
      sections.push(`FILE: ${filePath}\n${clipped}`);
    } catch {
      // A deleted or unreadable file should not abort the agent context.
    }
  }
  return sections.join("\n\n");
}

function cleanModelJson(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parsePlan(raw: string): AgentPlan {
  const cleaned = cleanModelJson(raw);
  try {
    return JSON.parse(cleaned) as AgentPlan;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as AgentPlan;
    throw new Error("لم يرجع الوكيل خطة JSON صالحة");
  }
}

function validateProjectPath(filePath: string): string {
  const normalized = String(filePath || "").trim().replace(/\\/g, "/");
  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized.includes("..") ||
    normalized.startsWith(".git/") ||
    normalized.startsWith("node_modules/") ||
    normalized === ".env" ||
    normalized.startsWith(".env.") ||
    /(^|\/)(id_rsa|.*\.(pem|key|p12|pfx))$/i.test(normalized)
  ) {
    throw new Error(`مسار ملف غير مسموح: ${normalized}`);
  }
  return normalized;
}

function validatePatch(patch: any): { path: string; content: string } {
  const path = validateProjectPath(patch?.path);
  const content = String(patch?.content ?? "");
  if (Buffer.byteLength(content, "utf8") > MAX_PATCH_BYTES) {
    throw new Error(`الملف كبير جداً: ${path}`);
  }
  return { path, content };
}

function validateAgentCommand(command: string): string {
  const safe = sanitizeCommand(String(command || "").trim());
  if (
    /\b(git\s+(push|reset|clean|checkout|commit|rebase)|rm\s+-rf|curl\b|wget\b|ssh\b|scp\b|chmod\b|chown\b|mkfs\b|dd\b)/i.test(safe)
  ) {
    throw new Error(`أمر محظور على الوكيل: ${safe}`);
  }
  return safe;
}

function validateConfig(config: AgentPlan["config"]): AgentPlan["config"] {
  if (!config) return undefined;
  const result: AgentPlan["config"] = {};
  if (config.entryFile) result.entryFile = validateProjectPath(config.entryFile);
  for (const key of ["startCmd", "installCmd", "buildCmd"] as const) {
    const value = config[key];
    if (value) result[key] = validateAgentCommand(value);
  }
  return result;
}

function runCommand(
  projectId: string,
  command: string,
  env: Record<string, string>,
  options: AgentOptions,
): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    const safeCommand = validateAgentCommand(command);
    const child = spawn("/bin/sh", ["-c", safeCommand], {
      cwd: getProjectDir(projectId),
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    let settled = false;
    const append = (stream: AgentLog["stream"], chunk: Buffer) => {
      const text = chunk.toString();
      output = `${output}${text}`.slice(-24_000);
      emit(options, stream, text);
    };
    const finish = (ok: boolean, message?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (message) output = `${output}\n${message}`.slice(-24_000);
      resolve({ ok, output });
    };
    const timeout = setTimeout(() => {
      try { child.kill("SIGTERM"); } catch {}
      finish(false, "⏱ انتهت مهلة الأمر");
    }, COMMAND_TIMEOUT_MS);
    child.stdout?.on("data", (chunk: Buffer) => append("stdout", chunk));
    child.stderr?.on("data", (chunk: Buffer) => append("stderr", chunk));
    child.on("error", (error) => finish(false, error.message));
    child.on("exit", (code) => finish(code === 0, `انتهى الأمر (كود: ${code ?? "unknown"})`));
  });
}

function buildSystemPrompt(context: string): string {
  return `أنت QIROX Builder Agent، مهندس برمجيات مستقل يعمل داخل مشروع حقيقي.
مهمتك تعديل المشروع وتشغيله والتحقق منه، وليس الاكتفاء باقتراح كود.

قواعد إلزامية:
1. أرجع JSON فقط بدون Markdown بهذا الشكل:
{
  "summary": "ملخص قصير بالعربية",
  "patches": [{"path": "relative/path", "content": "الملف كاملاً"}],
  "commands": ["npm install", "npm run build"],
  "config": {"entryFile": "...", "startCmd": "...", "installCmd": "...", "buildCmd": "..."},
  "done": false
}
2. عدّل الملفات المطلوبة فقط. لا تلمس .env أو الأسرار أو node_modules أو ملفات الشهادات والمفاتيح.
3. استخدم أوامر بسيطة آمنة فقط مثل npm install وnpm run build وnpm test وnode وpython وgit status.
4. لا تستخدم git push أو الحذف الجماعي أو الشبكة أو تغيير صلاحيات الملفات.
5. إذا ظهر خطأ في التحقق، أصلح السبب في patches ثم أعد أمر التحقق.
6. اجعل تطبيقات الويب تستمع على 0.0.0.0 وتستخدم $PORT عند الحاجة.
7. لا تقل إن المهمة مكتملة قبل نجاح البناء، وإذا كان auto-run مفعلاً قبل نجاح التشغيل أيضاً.
8. لا تعيد ملفات لم تتغير. عند عدم وجود تعديل مطلوب أرسل patches فارغة.

حالة المشروع الحالية:
${context}`;
}

export async function runSandboxAgent(options: AgentOptions): Promise<SandboxAgentResult> {
  const maxIterations = Math.max(1, Math.min(5, options.maxIterations || 4));
  const { client, model } = await getOpenAIClient();
  const verification: SandboxAgentResult["verification"] = [];
  const filesChanged = new Set<string>();
  const commandsRun: string[] = [];
  let feedback = "";
  let summary = "";
  let runtime: SandboxAgentResult["runtime"];
  let projectConfig: AgentPlan["config"];

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const context = buildProjectContext(options.projectId);
    const userMessage = `المطلوب من المستخدم:
${options.prompt}

${feedback ? `نتيجة المحاولة السابقة — أصلحها ولا تكرر الخطأ:\n${feedback}` : "ابدأ بفحص المشروع وحدد أقل تغييرات لازمة."}

auto-run: ${options.autoRun !== false ? "true" : "false"}`;
    emit(options, "stdout", `\n🤖 محاولة الوكيل ${iteration}/${maxIterations}\n`);

    const completion = await client.chat.completions.create({
      model: options.model || model,
      messages: [
        { role: "system", content: buildSystemPrompt(context) },
        { role: "user", content: userMessage },
      ],
      temperature: 0.15,
      max_tokens: 12_000,
    });
    const plan = parsePlan(completion.choices[0]?.message?.content || "{}");
    summary = String(plan.summary || summary || "تم تحليل المشروع");

    const patches = Array.isArray(plan.patches) ? plan.patches.slice(0, MAX_PATCH_FILES).map(validatePatch) : [];
    for (const patch of patches) {
      writeFile(options.projectId, patch.path, patch.content);
      filesChanged.add(patch.path);
    }
    if (patches.length) emit(options, "stdout", `✅ تم تطبيق ${patches.length} تعديل ملف\n`);

    const config = validateConfig(plan.config);
    projectConfig = config || projectConfig;
    const commands = Array.isArray(plan.commands)
      ? plan.commands.slice(0, MAX_COMMANDS).map(validateAgentCommand)
      : [];
    if (!commands.length && config?.buildCmd) commands.push(config.buildCmd);

    feedback = "";
    for (const command of commands) {
      commandsRun.push(command);
      emit(options, "stdout", `\n▶ ${command}\n`);
      const result = await runCommand(options.projectId, command, { ...process.env as Record<string, string>, ...(options.env || {}) }, options);
      verification.push({ command, ok: result.ok, output: result.output });
      if (!result.ok) {
        feedback += `فشل الأمر ${command}:\n${result.output}\n`;
        break;
      }
    }

    if (feedback) continue;

    if (options.autoRun !== false && options.startProject && (plan.done !== false || iteration === maxIterations)) {
      runtime = await options.startProject(config?.startCmd);
      if (!runtime.running) {
        feedback = `فشل تشغيل المشروع بعد التعديلات:\n${runtime.output || "العملية توقفت دون تفاصيل"}`;
        continue;
      }
      emit(options, "stdout", `\n✅ المشروع يعمل على المنفذ ${runtime.port || "غير معروف"}\n`);
    }

    if (plan.done !== false) {
      return {
        success: true,
        summary,
        iterations: iteration,
        filesChanged: Array.from(filesChanged),
        commandsRun,
        verification,
        runtime,
        projectConfig,
      };
    }
  }

  return {
    success: false,
    summary: summary || "تعذر إكمال المهمة تلقائياً",
    iterations: maxIterations,
    filesChanged: Array.from(filesChanged),
    commandsRun,
    verification,
    runtime,
    projectConfig,
    error: feedback || "انتهت محاولات الوكيل قبل نجاح التحقق",
  };
}