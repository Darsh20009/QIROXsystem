import DigestFetch from "digest-fetch";

const ATLAS_BASE = "https://cloud.mongodb.com/api/atlas/v2";
const TOKEN_URL = "https://cloud.mongodb.com/api/oauth/token";

function headers(token?: string) {
  return {
    "Content-Type": "application/json",
    "Accept": "application/vnd.atlas.2023-01-01+json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
}

async function getOAuthToken(clientId: string, clientSecret: string): Promise<string> {
  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth token error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

function isServiceAccount(publicKey: string): boolean {
  return publicKey.startsWith("mdb_sa_id_");
}

async function atlasGet(url: string, publicKey: string, privateKey: string): Promise<any> {
  if (isServiceAccount(publicKey)) {
    const token = await getOAuthToken(publicKey, privateKey);
    const res = await fetch(url, { headers: headers(token) });
    if (!res.ok) throw new Error(`Atlas error ${res.status}: ${await res.text()}`);
    return res.json();
  } else {
    const client = new DigestFetch(publicKey, privateKey, {});
    const res = await client.fetch(url, { headers: headers() });
    if (!res.ok) throw new Error(`Atlas error ${res.status}: ${await res.text()}`);
    return res.json();
  }
}

async function atlasPost(url: string, publicKey: string, privateKey: string, body: any): Promise<any> {
  if (isServiceAccount(publicKey)) {
    const token = await getOAuthToken(publicKey, privateKey);
    const res = await fetch(url, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Atlas error ${res.status}: ${await res.text()}`);
    return res.json();
  } else {
    const client = new DigestFetch(publicKey, privateKey, {});
    const res = await client.fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Atlas error ${res.status}: ${await res.text()}`);
    return res.json();
  }
}

async function atlasDelete(url: string, publicKey: string, privateKey: string): Promise<boolean> {
  if (isServiceAccount(publicKey)) {
    const token = await getOAuthToken(publicKey, privateKey);
    const res = await fetch(url, { method: "DELETE", headers: headers(token) });
    return res.ok;
  } else {
    const client = new DigestFetch(publicKey, privateKey, {});
    const res = await client.fetch(url, { method: "DELETE", headers: headers() });
    return res.ok;
  }
}

export async function atlasListProjects(publicKey: string, privateKey: string) {
  const data = await atlasGet(`${ATLAS_BASE}/groups`, publicKey, privateKey);
  return data.results || [];
}

export async function atlasListClusters(publicKey: string, privateKey: string, projectId: string) {
  const data = await atlasGet(`${ATLAS_BASE}/groups/${projectId}/clusters`, publicKey, privateKey);
  return data.results || [];
}

export async function atlasCreateDbUser(
  publicKey: string, privateKey: string,
  projectId: string, clusterName: string,
  username: string, password: string, databaseName: string
) {
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
  return atlasPost(`${ATLAS_BASE}/groups/${projectId}/databaseUsers`, publicKey, privateKey, body);
}

export async function atlasGetConnectionString(
  publicKey: string, privateKey: string,
  projectId: string, clusterName: string,
  username: string, password: string, databaseName: string
): Promise<string> {
  const data = await atlasGet(`${ATLAS_BASE}/groups/${projectId}/clusters/${clusterName}`, publicKey, privateKey);

  const srvHost = data.connectionStrings?.standardSrv;
  if (!srvHost) return "";

  const match = srvHost.match(/mongodb\+srv:\/\/(.+)/);
  if (!match) return srvHost;

  const encodedPass = encodeURIComponent(password);
  return `mongodb+srv://${username}:${encodedPass}@${match[1]}/${databaseName}?retryWrites=true&w=majority`;
}

export async function atlasListDbUsers(publicKey: string, privateKey: string, projectId: string) {
  const data = await atlasGet(`${ATLAS_BASE}/groups/${projectId}/databaseUsers`, publicKey, privateKey);
  return data.results || [];
}

export async function atlasDeleteDbUser(publicKey: string, privateKey: string, projectId: string, username: string) {
  return atlasDelete(`${ATLAS_BASE}/groups/${projectId}/databaseUsers/admin/${username}`, publicKey, privateKey);
}

export async function atlasTestConnection(publicKey: string, privateKey: string): Promise<{ success: boolean; message: string; projects?: any[] }> {
  try {
    const projects = await atlasListProjects(publicKey, privateKey);
    return { success: true, message: "اتصال ناجح", projects };
  } catch (err: any) {
    return { success: false, message: err.message || "فشل الاتصال" };
  }
}
