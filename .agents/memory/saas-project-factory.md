---
name: SaaS project factory
description: User requirements for creating branded restaurant and cafe systems from supplied Infinity templates.
---

Create client systems from the supplied cafe templates (Black Rose and Cluny) and restaurant templates (Tasali Qurumsh and Chef Palace). The supplied source systems represent the Infinity package; generated systems must follow the package selected on the project's order and the restaurant/cafe features advertised by QIROX.

**Why:** The user wants to stop opening an older customer's code and manually changing its name, logo, bank details, commercial registration, and tax number for every new customer.

**How to apply:** Keep creation within the existing project workflow, with business identity, optional tax number, commercial-registration link, logo background removal, a clearly labeled design preview, and project GitHub/Render/database configuration. Logo attachment and explicit conversion to a public partner are required for all projects, not only eligible restaurant/cafe builder projects.

Customer source files must be preparable and staged without a customer MongoDB connection. Missing, invalid, or platform-database links must not block file creation; a dedicated database is still required before runtime or deployment.

**Why:** The user explicitly requires system preparation to continue when a customer database cannot be connected, without treating that condition as a generation failure.

**How to apply:** Never substitute the platform database. Mark MongoDB as optional during source preparation, identify whether a rejected link is malformed or points to the platform, and clearly retain the runtime/deployment prerequisite.

Atlas connection strings with no database path should receive a deterministic, project-specific database name only after confirming the host is not the platform database. Preserve explicitly named databases and save the normalized URI only after a successful connection check.

**Why:** Atlas commonly supplies a valid cluster URI without a database name. Rejecting it before any network attempt made a formatting requirement look like a connectivity failure, while projects still need separate database namespaces.

**How to apply:** Compare the original endpoint against the platform first; assign a unique project database only when the path is empty, then validate, ping, and persist the normalized URI.

Never carry an earlier customer's credentials, default privileged accounts, business records, bank/legal identifiers, or database into a new client system.

**Why:** Uploaded archives are copies of operating customer applications, not clean starter templates.

**How to apply:** Sanitize and validate reusable sources first. Match capabilities to the authoritative order tier server-side, preserve GitHub backups before replacement, and distinguish generated source, verified build, configured database, and live deployment in status messages.

Use the current public restaurant pricing-package list as the entitlement authority, rather than the imported Infinity applications' plan defaults or a simplified sector summary.

**Why:** Those sources describe different package boundaries. The factory must deliver what QIROX advertises for the customer's purchased package, including its core operational features.

**How to apply:** Reconcile the factory UI, server-side feature restrictions, and generated tenant settings with the current pricing list together. Treat support, post-delivery work, and provider allowances separately from automatic external-service provisioning.

Do not assume an integration is durable or production-ready just because it came from a full original application archive.

**Why:** One supplied original used an in-memory object-storage adapter that could report success without persistent uploads. A successful build would not reveal that data-loss risk.

**How to apply:** Check provider adapters before reusing them. Use a real compatible provider implementation when configured, and explicitly fail closed when configuration is missing; never retain simulated upload success.

Reuse business identity, logo, commercial registration, and tax information already supplied during registration and project creation; do not make the customer enter the same information again.

**Why:** The user says these details already exist in the original registration/project flow.

**How to apply:** Prefill from the linked project's existing data, request only missing information, and preserve explicit saved overrides.

Derive the generated system's colors from its uploaded client logo. The client logo must also identify its invoices and external project card.

**Why:** The user requires the client's branding to be consistent inside and outside the generated system, rather than generic template branding.

**How to apply:** Treat client branding as project-specific; never replace the global QIROX identity.

Project conversion to a public partner must exclude all financial information.

**Why:** The user explicitly requested partner export without any financial information.

**How to apply:** Publish only an explicit allowlist of approved public branding and service information, never the project's private records.

The user chose manual hero-image and admin/shared-staff password setup. Extra features are administrator-authorized customization without increasing the purchased package price.

**Why:** These were the user's explicit answers about how the new builder should work.

**How to apply:** Keep setup under administrator control, preserve the purchased tier and prices, and carry approved extras through both generated UI and server permissions.

Verify generated customer authentication by registering and then signing in again against the original template's actual model; compile the whole generated frontend graph, not only new components.

The user wants deep presentation customization in the system builder — “تخصيص كل شئ حرفيا” — including uploading a separate customer splash-screen image.

**Why:** This is the user's explicit product requirement, not just a request to reuse the existing business logo.

**How to apply:** Keep splash artwork independent of the logo and hero image. Future presentation controls should affect both the preview and delivered customer system, without changing the purchased package or copying old customer data.

**Why:** Mongoose silently stripped fields assumed by the new onboarding flow; compilation passed while customer identity and repeat sign-in would have failed. Isolated component builds also missed old image references on other routes after archived customer artwork was excluded.

**How to apply:** Test the complete session/identity round trip and preserve each template's existing customer identity semantics and dedicated-database isolation boundary. Replace old customer artwork with app-owned branding rather than copying archived screenshots back.

Project delivery should prepare one source artifact first, then let the administrator choose ZIP download or GitHub upload; both choices must use the same generated files. An active build is progress, not a destructive error. Prepared artifacts are temporary and must be regenerated if they expire or are unavailable after a restart.

**Why:** The user asked to separate code generation from delivery and avoid treating an already-running build as a failure.

**How to apply:** Keep ZIP and GitHub delivery downstream of the same prepared output. Show progress for active work, preserve the existing GitHub backup/confirmation flow, and never include deployment secrets in source archives.