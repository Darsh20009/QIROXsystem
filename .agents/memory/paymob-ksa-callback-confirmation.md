---
name: Paymob KSA callback confirmation
description: Reliable server-side confirmation for CLUNY's Saudi Paymob checkout.
---

Only use a Paymob success callback after HMAC validation, and bind it to the initiated payment by merchant reference, transaction ID, amount, currency, and integration. In this project, KSA intention/transaction status lookups returned 404/405 even while a signed transaction webhook reported success. A success webhook may arrive before an order document exists because checkout creates the order after the browser returns.

Create the paid order only through the server-side token confirmation path. Persist the non-secret payment-session record ID on the order, atomically claim the token after provider verification, and recover the order by that ID if the token's final update fails. Set the stored order status to `payment_confirmed`; the browser must use its returned order number and never submit a second order after success.

**Why:** a real Apple Pay transaction reached the authenticated callback, but API polling stayed unverified and the customer return page remained pending. A separate failure window existed if payment verification succeeded but order persistence or token finalization failed.

**How to apply:** use a strictly matched authenticated webhook record as a server-verification fallback; never trust browser return parameters alone. Keep order creation idempotent across retries/crashes, release a failed token claim for retry, keep a single server-side creation path, and pass its confirmed order number back to the checkout UI.
