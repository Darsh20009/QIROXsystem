# Customer restaurant system

This is the original full cluny React/Express/Mongoose application with its independent MongoDB schema, route handlers, and source UI. Template source is sanitized and does not include archived customer data, customer logos/product media, uploads, certificates, or seed records.

## Required deployment environment

Set these values as deployment secrets/environment variables; do not commit a populated .env file:

- MONGODB_URI — a MongoDB URI with a dedicated database name for this customer. A database named QIROX is rejected.
- TENANT_ID — a new tenant identifier unique within this database.
- PROJECT_PLAN_TIER — the purchased tier: lite, pro, or infinity. The API checks this server-side for direct API calls.
- SESSION_SECRET — random secret with at least 32 characters.
- BOOTSTRAP_ADMIN_PASSWORD — the initial owner password, at least 16 characters. It is hashed and only used to create the first owner account; it never resets an existing account.
- BUSINESS_CONFIG_JSON — JSON object using the BuilderConfig fields: businessName, businessNameEn, commercialRegNumber, taxNumber, commercialRegUrl, bankName, bankAccountName, iban, logoUrl, primaryColor, phone, address, websiteUrl.

Build with npm ci --include=dev && npm run build; start with npm start. Vite builds the original React customer/employee/admin system and esbuild keeps native/server packages external. Configure public business identity and banking/legal details through environment configuration, not source code.

The fresh database bootstrap creates the requested tenant, applies only the purchased tier, stores the supplied business identity, and creates one owner account only when that tenant has no employees. It does not import an archive database or any source-customer record.
