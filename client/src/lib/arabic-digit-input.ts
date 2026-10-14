import { normalizeArabicDigits } from "@shared/arabic-digits";

type EditableTarget = HTMLInputElement | HTMLTextAreaElement;
type TextRange = { start: number; end: number; direction?: "forward" | "backward" | "none" };

const dispatchingNormalizedInput = new WeakSet<EditableTarget>();
const selectedAllNumberInputs = new WeakSet<HTMLInputElement>();
const excludedInputTypes = new Set([
  "button",
  "checkbox",
  "color",
  "date",
  "datetime-local",
  "file",
  "hidden",
  "image",
  "month",
  "radio",
  "range",
  "reset",
  "submit",
  "time",
  "week",
]);

function getEditableTarget(target: EventTarget | null): EditableTarget | null {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return target;
  return null;
}

function shouldNormalize(target: EditableTarget): boolean {
  if (target.disabled || target.readOnly) return false;
  if (target instanceof HTMLTextAreaElement) return true;

  if (excludedInputTypes.has(target.type)) return false;
  if (target.type === "password" && !["numeric", "decimal", "tel"].includes(target.inputMode)) return false;
  return true;
}

function getTextRange(target: EditableTarget): TextRange {
  if (target instanceof HTMLInputElement && target.type === "number") {
    if (selectedAllNumberInputs.has(target)) {
      selectedAllNumberInputs.delete(target);
      return { start: 0, end: target.value.length };
    }
    return { start: target.value.length, end: target.value.length };
  }

  try {
    return {
      start: target.selectionStart ?? target.value.length,
      end: target.selectionEnd ?? target.value.length,
      direction: target.selectionDirection ?? undefined,
    };
  } catch {
    return { start: target.value.length, end: target.value.length };
  }
}

function replaceValueAndNotify(target: EditableTarget, value: string, range?: TextRange): void {
  if (value === target.value) return;

  const prototype = target instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  if (!setter) return;

  dispatchingNormalizedInput.add(target);
  try {
    setter.call(target, value);
    if (range && !(target instanceof HTMLInputElement && target.type === "number")) {
      const caret = Math.min(range.start, value.length);
      try {
        target.setSelectionRange(caret, caret, range.direction);
      } catch {
        // Some input types do not support text selection.
      }
    }
    target.dispatchEvent(new Event("input", { bubbles: true }));
  } finally {
    dispatchingNormalizedInput.delete(target);
  }
}

function insertText(target: EditableTarget, text: string): void {
  const range = getTextRange(target);
  const nextValue =
    target.value.slice(0, range.start) +
    text +
    target.value.slice(range.end);
  replaceValueAndNotify(target, nextValue, {
    start: range.start + text.length,
    end: range.start + text.length,
    direction: "none",
  });
}

function onBeforeInput(event: Event): void {
  const inputEvent = event as InputEvent;
  const target = getEditableTarget(event.target);
  if (!target || !shouldNormalize(target) || !inputEvent.data || !event.cancelable) return;

  const normalized = normalizeArabicDigits(inputEvent.data);
  if (normalized === inputEvent.data) return;

  event.preventDefault();
  insertText(target, normalized);
}

function onPaste(event: ClipboardEvent): void {
  const target = getEditableTarget(event.target);
  if (!target || !shouldNormalize(target)) return;

  const pastedText = event.clipboardData?.getData("text");
  if (!pastedText) return;
  const normalized = normalizeArabicDigits(pastedText);
  if (normalized === pastedText) return;

  event.preventDefault();
  insertText(target, normalized);
}

function onInput(event: Event): void {
  const target = getEditableTarget(event.target);
  if (!target || dispatchingNormalizedInput.has(target) || !shouldNormalize(target)) return;

  const normalized = normalizeArabicDigits(target.value);
  if (normalized !== target.value) {
    replaceValueAndNotify(target, normalized, getTextRange(target));
  }
}

function onKeyDown(event: KeyboardEvent): void {
  const target = getEditableTarget(event.target);
  if (!(target instanceof HTMLInputElement) || target.type !== "number") return;

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
    selectedAllNumberInputs.add(target);
  } else if (!["Control", "Meta", "Shift"].includes(event.key)) {
    selectedAllNumberInputs.delete(target);
  }
}

function onFocusOut(event: FocusEvent): void {
  const target = getEditableTarget(event.target);
  if (target instanceof HTMLInputElement) selectedAllNumberInputs.delete(target);
}

/**
 * Normalize digits as they are typed or pasted, before React-controlled forms
 * consume the value. The input-event fallback also covers mobile keyboards and
 * autofill paths that do not expose beforeinput data.
 */
export function installArabicDigitInputNormalization(): void {
  document.addEventListener("beforeinput", onBeforeInput, true);
  document.addEventListener("paste", onPaste, true);
  document.addEventListener("input", onInput, true);
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("focusout", onFocusOut, true);
}
