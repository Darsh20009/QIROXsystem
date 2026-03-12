# Add AdminContactMessages & ClientHelp Pages

## What & Why
Two new pages are needed: AdminContactMessages for admins to view and manage contact form submissions, and ClientHelp for clients to access help/support resources. This brings the page count from 104 to 106.

## Done looks like
- AdminContactMessages page is accessible to admin users, showing a list of contact messages with read/unread status, reply capability, and delete functionality
- ClientHelp page is accessible to client users, providing a help/support interface (FAQ, support ticket submission, or help articles — matching the existing app style)
- Both pages are registered in the router and accessible via navigation
- Backend API endpoints exist to support both pages (CRUD for contact messages, help content retrieval)

## Out of scope
- Changes to existing pages
- Email notification integration for contact messages

## Tasks
1. Create backend API endpoints for contact messages (list, read, delete, mark as read) and any needed model/schema if not already present.
2. Build the AdminContactMessages page with a message list view, read/unread indicators, message detail view, and delete action. Register it in the router and add it to the admin navigation.
3. Build the ClientHelp page with help content appropriate to the app's domain (support request form, FAQ section, or help articles). Register it in the router and add it to client navigation.

## Relevant files
- `client/src/App.tsx`
- `client/src/pages/`
- `server/routes.ts`
- `server/models.ts`
- `shared/schema.ts`
