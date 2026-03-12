# Objective
Task #12: Add portfolio files (PDF+video), platform URL, and usage instructions to services

# Tasks

### T001: Update service schema + large file upload endpoint
- **Blocked By**: []
- **Details**:
  - Add portfolioFiles [{url, type, name}], platformUrl, usageInstructions to serviceSchema in models.ts
  - Create uploadLarge multer config (500MB limit) and POST /api/upload/large endpoint
  - Files: server/models.ts, server/routes.ts

### T002: Update AdminServices UI
- **Blocked By**: [T001]
- **Details**:
  - Add file upload section for PDF+video using /api/upload/large
  - Add platformUrl field, usageInstructions textarea
  - Show attached files with delete capability
  - Update FormData, toPayload, handleEdit
  - Files: client/src/pages/AdminServices.tsx

### T003: Client-facing view of portfolio files
- **Blocked By**: [T002]
- **Details**:
  - The Systems page uses hardcoded data, not DB services
  - Need to add a service detail view or enhance the Systems page
  - Show embedded video player + download button, PDF download/open links
  - Show usage instructions text
