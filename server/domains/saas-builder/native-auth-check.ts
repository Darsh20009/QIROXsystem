import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

/** Isolated HTTP contract check: real archived schema, memory persistence,
 * session cookies, and a simulated provider. Never contacts live recipients. */
export async function checkNativeCustomerAuth(output: string) {
  await fs.symlink(path.join(process.cwd(), "node_modules"), path.join(output, "node_modules"), "dir");
  const script = `
import assert from "node:assert/strict";
import express from "express";
import session from "express-session";
import { CustomerModel } from "./shared/schema";
import { registerSaasServices } from "./server/saas-services";
process.env.BUSINESS_CONFIG_JSON = JSON.stringify({businessName:"Fixture",customerWhatsappRegistration:true,notificationEmail:true});
process.env.TENANT_ID = "fixture-tenant";
process.env.SESSION_SECRET = "isolated-test-session-secret-with-at-least-32-characters";
process.env.QIROX_PLATFORM_URL = "https://provider.example.invalid";
process.env.QIROX_WHATSAPP_API_KEY = "fixture-key";
process.env.QIROX_WHATSAPP_API_PATH = "/api/v1/projects/fixture/whatsapp";
process.env.QIROX_EMAIL_API_KEY = "fixture-email-key";
process.env.QIROX_EMAIL_API_PATH = "/api/v1/projects/fixture/email";
const tables = new Map();
function matches(doc,query) {
  return Object.entries(query).every(([key,value]) => {
    if (value && typeof value === "object" && !(value instanceof Date)) {
      if ("$gt" in value) return doc[key] > value.$gt;
      if ("$lt" in value) return doc[key] < value.$lt;
    }
    return doc[key] === value;
  });
}
function table(name) {
  if (!tables.has(name)) tables.set(name,[]);
  const rows = tables.get(name);
  function change(doc,update) {
    Object.assign(doc,update.$set || {});
    for (const [key,value] of Object.entries(update.$inc || {})) doc[key]=(doc[key]||0)+value;
  }
  return {
    createIndex: async()=>{},
    findOne: async q=>rows.find(d=>matches(d,q)) || null,
    insertOne: async d=>{rows.push(d);return {insertedId:d._id};},
    deleteOne: async q=>{const i=rows.findIndex(d=>matches(d,q));if(i>=0)rows.splice(i,1);},
    findOneAndUpdate: async(q,u,o)=>{
      let d=rows.find(d=>matches(d,q));
      if (!d && o.upsert) {d={...q,...u.$setOnInsert};rows.push(d);}
      if (!d) return null;
      const before={...d};change(d,u);return o.returnDocument==="after" ? {...d} : before;
    },
    updateOne: async(q,u)=>{const d=rows.find(d=>matches(d,q));if(!d)return {modifiedCount:0};change(d,u);return {modifiedCount:1};},
  };
}
CustomerModel.db.collection = table;
let savedCustomer;
CustomerModel.findOne = q=>({lean:async()=>savedCustomer?.phone===q.phone ? savedCustomer : null});
CustomerModel.create = async input=>{
  const doc = new CustomerModel(input);
  await doc.validate();
  savedCustomer=doc.toObject();return doc;
};
const nativeFetch = globalThis.fetch;
let deliveredCode;
let failEmail=false;
globalThis.fetch = async(input,options)=>{
  if (String(input).startsWith("https://provider.example.invalid/")) {
    const payload=JSON.parse(options.body);
    if (String(input).endsWith("/email") && failEmail) return new Response(JSON.stringify({ok:true,delivery:{status:"failed"}}),{status:202,headers:{"Content-Type":"application/json"}});
    if (String(input).endsWith("/whatsapp")) {
      assert.ok(payload.message && payload.message.includes(payload.code));
      deliveredCode=payload.code;
    }
    return new Response(JSON.stringify({ok:true,delivery:{status:"queued"}}),{status:202,headers:{"Content-Type":"application/json"}});
  }
  return nativeFetch(input,options);
};
const app=express();app.use(express.json());app.use(session({secret:process.env.SESSION_SECRET,resave:false,saveUninitialized:false}));
registerSaasServices(app);
app.get("/fixture/session",(req,res)=>res.json({customer:req.session.customer}));
const server=app.listen(0,"127.0.0.1");await new Promise(resolve=>server.once("listening",resolve));
const base="http://127.0.0.1:"+server.address().port;
async function post(url,body,cookie) {
  const response=await fetch(base+url,{method:"POST",headers:{"Content-Type":"application/json",...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
  return {status:response.status,body:await response.json(),cookie:response.headers.get("set-cookie")?.split(";")[0]};
}
try {
  const phone="500000001";
  assert.equal((await post("/api/customers/register",{phone})).status,403);
  assert.equal((await post("/api/customers/login",{phone})).status,403);
  const challenge=await post("/api/saas/customer/send-code",{phone});
  assert.equal(challenge.status,200);
  assert.equal(challenge.body.code,undefined);
  const wrong=await post("/api/saas/customer/verify-code",{phone,challengeId:challenge.body.challengeId,code:"000000",name:"Fixture"});
  assert.equal(wrong.status,400);
  const registration=await post("/api/saas/customer/verify-code",{phone,challengeId:challenge.body.challengeId,code:deliveredCode,name:"Fixture",email:"fixture@example.invalid"});
  assert.equal(registration.status,200);
  assert.match(registration.body.id,/^[a-f0-9]{24}$/);
  assert.equal(registration.body.password,undefined);
  assert.equal(registration.body.emailStatus,"queued");
  const sessionResponse=await fetch(base+"/fixture/session",{headers:{Cookie:registration.cookie}});
  assert.equal((await sessionResponse.json()).customer.id,registration.body.id);
  assert.equal((await post("/api/saas/customer/verify-code",{phone,challengeId:challenge.body.challengeId,code:deliveredCode})).status,400);
  for (const row of tables.get("saas_customer_challenges")) row.createdAt=new Date(Date.now()-70000);
  const nextChallenge=await post("/api/saas/customer/send-code",{phone});
  assert.equal(nextChallenge.status,200);
  const login=await post("/api/saas/customer/verify-code",{phone,challengeId:nextChallenge.body.challengeId,code:deliveredCode});
  assert.equal(login.status,200);
  assert.equal(login.body.id,registration.body.id);
  failEmail=true;
  const secondPhone="500000002";
  const emailFailureChallenge=await post("/api/saas/customer/send-code",{phone:secondPhone});
  const emailFailureSignup=await post("/api/saas/customer/verify-code",{phone:secondPhone,challengeId:emailFailureChallenge.body.challengeId,code:deliveredCode,name:"Fixture",email:"fixture@example.invalid"});
  assert.equal(emailFailureSignup.status,200);
  assert.equal(emailFailureSignup.body.emailStatus,"failed");
  assert.equal(tables.get("saas_notification_failures")[0].customerId,emailFailureSignup.body.id);
  console.log("Native customer register/session/replay/login contract passed");
} finally {await new Promise(resolve=>server.close(resolve));}
`;
  const file = path.join(output, "native-auth-fixture.ts");
  await fs.writeFile(file, script);
  execFileSync(path.join(process.cwd(), "node_modules/.bin/tsx"), [file], { cwd: output, stdio: "pipe", timeout: 30000 });
}