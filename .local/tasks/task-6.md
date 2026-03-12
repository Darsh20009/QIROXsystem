---
title: إصلاح حذف المميزات الإضافية (لا تُحذف فعلياً)
---
# Fix Extra Addon Delete Not Persisting

## What & Why
When deleting an addon from the "المميزات الإضافية" page, the item disappears from the UI but reappears after page refresh. The backend DELETE endpoint returns `{ ok: true }` without verifying the document was actually deleted, and the frontend has no error feedback or confirmation dialog.

## Done looks like
- Deleting an addon actually removes it from the database permanently
- A confirmation dialog appears before deletion ("هل أنت متأكد من حذف هذه الإضافة؟")
- A success toast appears after successful deletion
- An error toast appears if deletion fails
- The item does NOT reappear after page refresh

## Out of scope
- Changes to the seed-defaults endpoint behavior
- Other admin CRUD pages

## Tasks
1. **Fix backend DELETE endpoint** — Check the return value of `findByIdAndDelete`: if it returns null (document not found), respond with 404 status. Add a console log for debugging. This ensures the API does not silently swallow failures.
2. **Add frontend confirmation + feedback** — Add a confirmation dialog before deleting, a success toast on completion, and an error toast on failure. Also ensure the mutation properly refetches data after deletion.

## Relevant files
- `server/routes.ts:6966-6972`
- `client/src/pages/AdminExtraAddons.tsx:118-121,254`