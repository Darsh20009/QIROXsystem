import DigestFetch from "digest-fetch";

const ATLAS_BASE = "https://cloud.mongodb.com/api/atlas/v2";

function getClient(publicKey: string, privateKey: string) {
  return new DigestFetch(publicKey, privateKey, {});
}

function headers() {
  return { "Content-Type": "application/json", "Accept": "application/vnd.atlas.2023-01-01+json" };
}

export async function atlasListProjects(publicKey: string, privateKey: string) {
  const client = getClient(publicKey, privateKey);
  const res = await client.fetch(`${ATLAS_BASE}/groups`, { headers: headers() });
  if (!res.ok) throw new Error(`Atlas error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.results || [];
}

export async function atlasListClusters(publicKey: string, privateKey: string, projectId: string) {
  const client = getClient(publicKey, privateKey);
  const res = await client.fetch(`${ATLAS_BASE}/groups/${projectId}/clusters`, { headers: headers() });
  if (!res.ok) throw new Error(`Atlas error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.results || [];
}

export async function atlasCreateDbUser(
  publicKey: string, privateKey: string,
  projectId: string, clusterName: string,
  username: string, password: string, databaseName: string
) {
  const client = getClient(publicKey, privateKey);

  const body = {
    databaseName: "admin",
    username,
    password,
    roles: [
      { databaseName, roleName: "readWrite" },
      { databaseName, roleName: "dbAdmin" },
    ],
    scopes: [{ name: clusterName, type: "CLUSTER" }],
  };

  const res = await client.fetch(`${ATLAS_BASE}/groups/${projectId}/databaseUsers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Atlas error ${res.status}: ${text}`);
  }
  return await res.json();
}

export async function atlasGetConnectionString(
  publicKey: string, privateKey: string,
  projectId: string, clusterName: string,
  username: string, password: string, databaseName: string
): Promise<string> {
  const client = getClient(publicKey, privateKey);
  const res = await client.fetch(`${ATLAS_BASE}/groups/${projectId}/clusters/${clusterName}`, { headers: headers() });
  if (!res.ok) throw new Error(`Atlas error ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const srvHost = data.connectionStrings?.standardSrv;
  if (!srvHost) return "";

  const match = srvHost.match(/mongodb\+srv:\/\/(.+)/);
  if (!match) return srvHost;

  const encodedPass = encodeURIComponent(password);
  return `mongodb+srv://${username}:${encodedPass}@${match[1]}/${databaseName}?retryWrites=true&w=majority`;
}

export async function atlasListDbUsers(publicKey: string, privateKey: string, projectId: string) {
  const client = getClient(publicKey, privateKey);
  const res = await client.fetch(`${ATLAS_BASE}/groups/${projectId}/databaseUsers`, { headers: headers() });
  if (!res.ok) throw new Error(`Atlas error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.results || [];
}

export async function atlasDeleteDbUser(publicKey: string, privateKey: string, projectId: string, username: string) {
  const client = getClient(publicKey, privateKey);
  const res = await client.fetch(`${ATLAS_BASE}/groups/${projectId}/databaseUsers/admin/${username}`, {
    method: "DELETE",
    headers: headers(),
  });
  return res.ok;
}

export async function atlasTestConnection(publicKey: string, privateKey: string): Promise<{ success: boolean; message: string; projects?: any[] }> {
  try {
    const projects = await atlasListProjects(publicKey, privateKey);
    return { success: true, message: "اتصال ناجح", projects };
  } catch (err: any) {
    return { success: false, message: err.message || "فشل الاتصال" };
  }
}
