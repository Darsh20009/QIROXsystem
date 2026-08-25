---
name: Mongoose pre-save hooks
description: Compatibility guidance for synchronous Mongoose pre-save hooks in this project.
---

For synchronous document transformations, use a callback-free pre-save hook, for example `schema.pre("save", function () { ... })`. Do not accept or call `next` unless the hook is deliberately written as an asynchronous callback-style hook.

**Why:** The current Mongoose runtime invokes simple pre-save hooks without a callback argument; calling an assumed `next()` then crashes saves with “next is not a function”.

**How to apply:** When adding or updating automatic field derivations in a save hook, prefer the synchronous callback-free form. Add an explicit `async` hook only when it actually awaits work.