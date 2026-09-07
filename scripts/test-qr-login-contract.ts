import assert from "node:assert/strict";
import { classifyEmployeeQrValue } from "../client/src/lib/qr-login";

const token = `qrl_${"a".repeat(64)}`;
const canonical = `https://qiroxstudio.online/api/qr-login/${token}`;

assert.equal(classifyEmployeeQrValue(canonical, "https://qiroxstudio.online").kind, "login");
assert.equal(classifyEmployeeQrValue(`http://localhost:5000/api/qr-login/${token}`, "http://localhost:5000").kind, "login");
assert.equal(classifyEmployeeQrValue(`https://qiroxstudio.online/ep/EMP-100`, "https://qiroxstudio.online").kind, "public-profile");
assert.deepEqual(
  classifyEmployeeQrValue(`https://attacker.example/api/qr-login/${token}`, "https://qiroxstudio.online"),
  { kind: "invalid", reason: "untrusted-origin" },
);
assert.deepEqual(
  classifyEmployeeQrValue(`${canonical}?next=/admin`, "https://qiroxstudio.online"),
  { kind: "invalid", reason: "invalid-login" },
);
assert.deepEqual(
  classifyEmployeeQrValue("not-a-url", "https://qiroxstudio.online"),
  { kind: "invalid", reason: "malformed" },
);
console.log("PASS: QR scanner accepts only trusted canonical login values and distinguishes public profiles.");