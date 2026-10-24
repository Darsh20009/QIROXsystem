---
name: Paymob KSA callback confirmation
description: Reliable server-side confirmation for CLUNY's Saudi Paymob checkout.
---

Only use a Paymob success callback after HMAC validation, and bind it to the initiated payment by merchant reference, transaction ID, amount, currency, and integration. In this project, KSA intention/transaction status lookups returned 404/405 even while a signed transaction webhook reported success. A success webhook may arrive before an order document exists because checkout creates the order after the browser returns.

Create the paid order only through the server-side token confirmation path. The browser should use the confirmed order number returned by that path and must not submit a second order after a success message; embedded checkout should retry the idempotent token confirmation when it receives the return-page message.

**Why:** a real Apple Pay transaction reached the authenticated callback, but API polling stayed unverified and the customer return page remained pending.

**How to apply:** use a strictly matched authenticated webhook record as a server-verification fallback; never trust browser return parameters alone. Keep order creation idempotent, keep a single server-side creation path, and pass its confirmed order number back to the checkout UI.
