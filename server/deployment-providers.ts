// @ts-nocheck
/**
 * Provider adapters for QIROX Deployment Cloud.
 *
 * Access tokens are deliberately read only from server environment variables.
 * DeploymentProject documents retain provider resource identifiers, never the
 * credentials used to reach Railway or Render.
 */

export type DeploymentProvider = "simulation" | "vercel" | "railway" | "render";

const RAILWAY_GRAPHQL_URL = "https://backboard.railway.app/graphql/v2";
const RENDER_API_URL = "https://api.render.com/v1";
// A server-side kill switch for the newly added adapters. It defaults to on
// for this released feature; set FEATURE_DEPLOYMENT_PROVIDERS=false to retain
// Vercel and simulation while immediately preventing Railway/Render actions.
const MANAGED_PROVIDERS_ENABLED = process.env.FEATURE_DEPLOYMENT_PROVIDERS !== "false";

const PROVIDER_LABELS: Record<DeploymentProvider, string> = {
  simulation: "محاكاة QIROX",
  vercel: "Vercel",
  railway: "Railway",
  render: "Render",
};

function configuredCapacityGb(provider: DeploymentProvider): number | null {
  const key = provider === "railway"
    ? "RAILWAY_CAPACITY_GB"
    : provider === "render"
      ? "RENDER_CAPACITY_GB"
      : "";
  const value = Number(key ? process.env[key] : 0);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function configuredUsageGb(provider: DeploymentProvider): number | null {
  const key = provider === "railway"
    ? "RAILWAY_USAGE_GB"
    : provider === "render"
      ? "RENDER_USAGE_GB"
      : "";
  const value = Number(key ? process.env[key] : 0);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function providerToken(provider: DeploymentProvider): string {
  if (provider === "railway") return process.env.RAILWAY_API_TOKEN || "";
  if (provider === "render") return process.env.RENDER_API_KEY || "";
  if (provider === "vercel") return process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN || "";
  return "";
}

function safeProviderError(provider: DeploymentProvider, status: number, body?: string): Error {
  const summary = String(body || "")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/[A-Za-z0-9_-]{28,}/g, "[redacted]")
    .slice(0, 220);
  return new Error(`${PROVIDER_LABELS[provider]} API ${status}${summary ? `: ${summary}` : ""}`);
}

export function isDeploymentProvider(value: unknown): value is DeploymentProvider {
  return ["simulation", "vercel", "railway", "render"].includes(String(value));
}

export function getDeploymentProvidersConfig() {
  const provider = (id: DeploymentProvider, configured: boolean, description: string) => ({
    id,
    label: PROVIDER_LABELS[id],
    configured,
    deployable: id === "simulation" || id === "vercel" ? configured || id === "simulation" : MANAGED_PROVIDERS_ENABLED && configured,
    description,
    capacityGb: configuredCapacityGb(id),
    usageGb: configuredUsageGb(id),
  });

  return [
    provider("railway", Boolean(providerToken("railway")), "الخيار الموصى به للخدمات والخوادم الدائمة."),
    provider("render", Boolean(providerToken("render")), "بديل للخدمات والمواقع الثابتة والمهام الخلفية."),
    provider("vercel", Boolean(providerToken("vercel")), "يبقى مدعوماً للتدفق الحالي دون أي تغيير."),
    provider("simulation", true, "وضع تجريبي آمن لا ينشئ خدمة خارجية."),
  ];
}

export function assertProviderReady(provider: DeploymentProvider) {
  if ((provider === "railway" || provider === "render") && !MANAGED_PROVIDERS_ENABLED) {
    throw new Error("تم إيقاف موفري النشر المُدارين مؤقتاً. يظل Vercel ووضع المحاكاة متاحين.");
  }
  if (provider === "simulation") return;
  if (!providerToken(provider)) {
    const secret = provider === "railway" ? "RAILWAY_API_TOKEN" : provider === "render" ? "RENDER_API_KEY" : "VERCEL_TOKEN";
    throw new Error(`حساب ${PROVIDER_LABELS[provider]} غير متصل. أضف ${secret} كسِرّ خادمي أولاً.`);
  }
}

export function getCapacitySnapshot(provider: DeploymentProvider) {
  if (provider === "simulation") {
    return { state: "not_applicable", confirmed: true, limitGb: null, usedGb: null, message: "لا تنطبق سعة مزود خارجي في وضع المحاكاة." };
  }
  const limitGb = configuredCapacityGb(provider);
  const usedGb = configuredUsageGb(provider);
  if (!limitGb) {
    return {
      state: "unknown",
      confirmed: false,
      limitGb: null,
      usedGb,
      message: `لا توجد سعة مؤكدة لـ ${PROVIDER_LABELS[provider]}. أضف ${provider === "railway" ? "RAILWAY_CAPACITY_GB" : "RENDER_CAPACITY_GB"} بعد التحقق من خطة المزود.`,
    };
  }
  if (usedGb !== null && usedGb >= limitGb) {
    return { state: "exceeded", confirmed: true, limitGb, usedGb, message: "تم تجاوز حد السعة المكوّن." };
  }
  const warning = usedGb !== null && usedGb >= limitGb * 0.8;
  return {
    state: warning ? "warning" : "healthy",
    confirmed: true,
    limitGb,
    usedGb,
    message: warning ? "استهلاك المزود قريب من حد السعة." : "السعة المكوّنة متاحة للنشر.",
  };
}

async function railwayGraphql(query: string, variables: Record<string, unknown> = {}) {
  const token = providerToken("railway");
  if (!token) throw new Error("حساب Railway غير متصل.");
  const response = await fetch(RAILWAY_GRAPHQL_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.text();
  if (!response.ok) throw safeProviderError("railway", response.status, body);
  const parsed = JSON.parse(body || "{}");
  if (Array.isArray(parsed.errors) && parsed.errors.length) {
    throw new Error(`Railway API: ${String(parsed.errors[0]?.message || "GraphQL error").slice(0, 240)}`);
  }
  return parsed.data || {};
}

async function renderFetch(path: string, method = "GET", body?: Record<string, unknown>) {
  const token = providerToken("render");
  if (!token) throw new Error("حساب Render غير متصل.");
  const response = await fetch(`${RENDER_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw safeProviderError("render", response.status, text);
  return text ? JSON.parse(text) : {};
}

function renderServiceType(type: string) {
  if (type === "static") return "static_site";
  if (type === "worker") return "background_worker";
  if (type === "cron") return "cron_job";
  return "web_service";
}

function renderPlan(plan: string) {
  return plan === "free" ? "free" : plan === "pro" || plan === "enterprise" ? "pro" : "starter";
}

function renderRegion(region: string) {
  if (region === "eu" || region === "frankfurt") return "frankfurt";
  if (region === "asia" || region === "singapore") return "singapore";
  return "frankfurt";
}

function railwayStatus(status: string) {
  const value = String(status || "").toUpperCase();
  if (["SUCCESS", "DEPLOYED", "ACTIVE"].includes(value)) return "success";
  if (["FAILED", "CRASHED", "REMOVED", "CANCELLED"].includes(value)) return "failed";
  return "building";
}

function renderStatus(status: string) {
  const value = String(status || "").toLowerCase();
  if (["live", "deactivated"].includes(value)) return value === "live" ? "success" : "suspended";
  if (["build_failed", "update_failed", "canceled", "pre_deploy_failed"].includes(value)) return "failed";
  return "building";
}

export function normalizeRenderServiceResponse(created: any) {
  const service = created?.service || created || {};
  const providerServiceId = String(service.id || "");
  if (!providerServiceId) throw new Error("استجابة Render لم تتضمن معرف الخدمة.");
  return {
    providerServiceId,
    providerDeploymentId: String(created?.deployId || service.deployId || ""),
    domain: String(service.serviceDetails?.url || "").replace(/^https?:\/\//, ""),
  };
}

export async function ensureRailwayService(project: any) {
  let projectId = String(project.providerProjectId || "");
  if (!projectId) {
    const created = await railwayGraphql(
      "mutation projectCreate($input: ProjectCreateInput!) { projectCreate(input: $input) { id } }",
      { input: { name: project.name } },
    );
    projectId = String(created.projectCreate?.id || "");
    if (!projectId) throw new Error("تعذر إنشاء مشروع Railway.");
  }

  let environmentId = String(project.providerEnvironmentId || "");
  if (!environmentId) {
    const environments = await railwayGraphql(
      "query environments($projectId: String!) { environments(projectId: $projectId) { edges { node { id name } } } }",
      { projectId },
    );
    environmentId = String(environments.environments?.edges?.[0]?.node?.id || "");
    if (!environmentId) throw new Error("تعذر العثور على بيئة Railway الافتراضية.");
  }

  let serviceId = String(project.providerServiceId || "");
  if (!serviceId) {
    const created = await railwayGraphql(
      "mutation serviceCreate($input: ServiceCreateInput!) { serviceCreate(input: $input) { id name } }",
      {
        input: {
          projectId,
          name: project.name,
          source: { repo: `${project.githubOwner}/${project.githubRepo}` },
        },
      },
    );
    serviceId = String(created.serviceCreate?.id || "");
    if (!serviceId) throw new Error("تعذر إنشاء خدمة Railway.");
  }

  await railwayGraphql(
    "mutation serviceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) { serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input) }",
    {
      serviceId,
      environmentId,
      input: {
        buildCommand: project.buildCommand || undefined,
        startCommand: project.startCommand || undefined,
        region: project.region || undefined,
      },
    },
  );

  const variables = Object.fromEntries((project.envVars || []).filter((item: any) => item?.key).map((item: any) => [item.key, String(item.value || "")]));
  if (Object.keys(variables).length) {
    await railwayGraphql(
      "mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) { variableCollectionUpsert(input: $input) }",
      { input: { projectId, environmentId, serviceId, variables } },
    );
  }

  let domain = String(project.domain || "");
  try {
    const createdDomain = await railwayGraphql(
      "mutation serviceDomainCreate($input: ServiceDomainCreateInput!) { serviceDomainCreate(input: $input) { domain } }",
      { input: { serviceId, environmentId } },
    );
    domain = String(createdDomain.serviceDomainCreate?.domain || domain);
  } catch {
    // A Railway-generated domain can already exist. Status polling still gives
    // a usable URL once the deployment becomes live.
  }
  return { providerProjectId: projectId, providerEnvironmentId: environmentId, providerServiceId: serviceId, domain };
}

export async function triggerRailwayDeployment(project: any) {
  const resource = await ensureRailwayService(project);
  await railwayGraphql(
    "mutation serviceInstanceDeploy($serviceId: String!, $environmentId: String!) { serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId) }",
    { serviceId: resource.providerServiceId, environmentId: resource.providerEnvironmentId },
  );
  const deployments = await railwayGraphql(
    "query deployments($input: DeploymentListInput!, $first: Int) { deployments(input: $input, first: $first) { edges { node { id status createdAt url staticUrl } } } }",
    { input: { projectId: resource.providerProjectId, serviceId: resource.providerServiceId, environmentId: resource.providerEnvironmentId }, first: 1 },
  );
  const deployment = deployments.deployments?.edges?.[0]?.node || {};
  return {
    ...resource,
    providerDeploymentId: String(deployment.id || ""),
    status: railwayStatus(deployment.status),
    domain: String(deployment.staticUrl || deployment.url || resource.domain || "").replace(/^https?:\/\//, ""),
  };
}

export async function getRailwayDeployment(project: any) {
  if (!project.providerDeploymentId) return { status: "idle", logs: [], domain: project.domain || "" };
  const [deploymentResult, logsResult] = await Promise.all([
    railwayGraphql(
      "query deployment($id: String!) { deployment(id: $id) { id status url staticUrl createdAt } }",
      { id: String(project.providerDeploymentId) },
    ),
    railwayGraphql(
      "query deploymentLogs($deploymentId: String!, $limit: Int) { deploymentLogs(deploymentId: $deploymentId, limit: $limit) { timestamp message severity } }",
      { deploymentId: String(project.providerDeploymentId), limit: 120 },
    ).catch(() => ({ deploymentLogs: [] })),
  ]);
  const deployment = deploymentResult.deployment || {};
  return {
    status: railwayStatus(deployment.status),
    providerStatus: deployment.status || "",
    domain: String(deployment.staticUrl || deployment.url || project.domain || "").replace(/^https?:\/\//, ""),
    logs: (logsResult.deploymentLogs || []).map((entry: any) => ({
      time: entry.timestamp ? new Date(entry.timestamp) : new Date(),
      level: String(entry.severity || "").toLowerCase().includes("error") ? "error" : "stdout",
      message: String(entry.message || ""),
    })),
  };
}

export async function stopRailwayService(project: any) {
  if (!project.providerDeploymentId) throw new Error("لا يوجد نشر Railway نشط لإيقافه.");
  await railwayGraphql(
    "mutation deploymentStop($id: String!) { deploymentStop(id: $id) }",
    { id: String(project.providerDeploymentId) },
  );
}

export async function ensureRenderService(project: any) {
  if (project.providerServiceId) {
    return { providerServiceId: String(project.providerServiceId), domain: String(project.domain || ""), providerDeploymentId: String(project.providerDeploymentId || "") };
  }
  const ownerId = process.env.RENDER_OWNER_ID || "";
  if (!ownerId) throw new Error("أضف RENDER_OWNER_ID كسِرّ خادمي لربط الخدمة بمساحة العمل الصحيحة.");
  const type = renderServiceType(project.serviceType);
  const serviceDetails = type === "static_site"
    ? { buildCommand: project.buildCommand || "npm run build", publishPath: project.outputDir || "dist" }
    : {
        env: "node",
        buildCommand: project.buildCommand || "npm run build",
        startCommand: project.startCommand || "npm start",
        plan: renderPlan(project.plan),
        region: renderRegion(project.region),
      };
  const created = await renderFetch("/services", "POST", {
    type,
    name: project.name,
    ownerId,
    repo: `https://github.com/${project.githubOwner}/${project.githubRepo}.git`,
    branch: project.githubBranch || "main",
    autoDeploy: project.autoDeploy === false ? "no" : "yes",
    envVars: (project.envVars || []).filter((item: any) => item?.key).map((item: any) => ({ key: item.key, value: String(item.value || "") })),
    serviceDetails,
  });
  return normalizeRenderServiceResponse(created);
}

export async function triggerRenderDeployment(project: any) {
  const resource = await ensureRenderService(project);
  const created = await renderFetch(`/services/${resource.providerServiceId}/deploys`, "POST", {
    clearCache: "do_not_clear",
    deployMode: "build_and_deploy",
  });
  return {
    ...resource,
    providerDeploymentId: String(created.id || resource.providerDeploymentId || ""),
    status: renderStatus(created.status),
  };
}

export async function getRenderDeployment(project: any) {
  if (!project.providerServiceId) return { status: "idle", logs: [], domain: project.domain || "" };
  let deployment: any = null;
  if (project.providerDeploymentId) {
    deployment = await renderFetch(`/services/${project.providerServiceId}/deploys/${project.providerDeploymentId}`).catch(() => null);
  }
  if (!deployment) {
    const list = await renderFetch(`/services/${project.providerServiceId}/deploys?limit=1`);
    deployment = Array.isArray(list) ? list[0] : list?.[0] || list?.deploys?.[0] || {};
  }
  const serviceDetails = await renderFetch(`/services/${project.providerServiceId}`).catch(() => ({}));
  const service = serviceDetails.service || serviceDetails;
  return {
    status: renderStatus(deployment?.status),
    providerStatus: deployment?.status || service?.suspended || "",
    domain: String(service?.serviceDetails?.url || project.domain || "").replace(/^https?:\/\//, ""),
    logs: [],
  };
}

export async function stopRenderService(project: any) {
  if (!project.providerServiceId) throw new Error("لا توجد خدمة Render لإيقافها.");
  await renderFetch(`/services/${project.providerServiceId}/suspend`, "POST");
}

export async function triggerManagedDeployment(provider: DeploymentProvider, project: any) {
  assertProviderReady(provider);
  if (provider === "railway") return triggerRailwayDeployment(project);
  if (provider === "render") return triggerRenderDeployment(project);
  throw new Error(`المزود ${provider} لا يستخدم هذا المحول.`);
}

export async function getManagedDeployment(provider: DeploymentProvider, project: any) {
  assertProviderReady(provider);
  if (provider === "railway") return getRailwayDeployment(project);
  if (provider === "render") return getRenderDeployment(project);
  throw new Error(`المزود ${provider} لا يستخدم هذا المحول.`);
}

export async function stopManagedService(provider: DeploymentProvider, project: any) {
  assertProviderReady(provider);
  if (provider === "railway") return stopRailwayService(project);
  if (provider === "render") return stopRenderService(project);
  throw new Error(`المزود ${provider} لا يستخدم هذا المحول.`);
}

export async function deleteManagedService(provider: DeploymentProvider, project: any) {
  assertProviderReady(provider);
  if (provider === "railway") {
    if (!project.providerServiceId) return;
    await railwayGraphql(
      "mutation serviceDelete($id: String!) { serviceDelete(id: $id) }",
      { id: String(project.providerServiceId) },
    );
    return;
  }
  if (provider === "render") {
    if (!project.providerServiceId) return;
    await renderFetch(`/services/${project.providerServiceId}`, "DELETE");
    return;
  }
  throw new Error(`المزود ${provider} لا يستخدم هذا المحول.`);
}