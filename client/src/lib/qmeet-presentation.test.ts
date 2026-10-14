import test from "node:test";
import assert from "node:assert/strict";
import { createPresentationModel, paintPresentation } from "./qmeet-presentation";
test("presentation marks and text are painted into shared pixel coordinates", () => {
  const model = createPresentationModel();
  model.marks = [
    { id: "a", kind: "pen", points: [{ x: 0.25, y: 0.5 }, { x: 0.75, y: 0.5 }], color: "#ef4444", width: 3 },
    { id: "b", kind: "text", points: [{ x: 0.1, y: 0.2 }], color: "#ffffff", width: 3, text: "ملاحظات" },
  ];
  const calls: unknown[] = [];
  const context = { save() {}, restore() {}, beginPath() {}, stroke() {}, moveTo: (...p: unknown[]) => calls.push(p),
    lineTo: (...p: unknown[]) => calls.push(p), fillText: (...p: unknown[]) => calls.push(p) };
  paintPresentation(context as any, model, 1000, 500);
  assert.deepEqual(calls, [[250, 250], [750, 250], ["ملاحظات", 100, 100]]);
});