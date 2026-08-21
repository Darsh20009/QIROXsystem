# Employee QR login contract

Employee login QR values have one canonical format:

```
https://qiroxstudio.online/api/qr-login/qrl_<64 lowercase hexadecimal characters>
```

The profile ID card and an Apple Wallet pass request the same server-managed
token. The server creates a token when one is missing, returns the canonical
URL to the profile, and embeds that URL in both modern and legacy Wallet QR
fields.

## Validity and rotation

- New QR tokens are random bearer values and expire after 90 days.
- Regenerating a QR rotates the token immediately; the prior token no longer
  signs a user in.
- Existing cards keep their current token during migration. The first profile
  or Wallet request adds an expiry without changing that token, so a card in
  circulation remains usable.
- Expired tokens must be refreshed from the employee profile and any Wallet
  pass should be downloaded again.

## Scanner behavior

The in-app scanner accepts only canonical QIROX-origin QR-login URLs with the
exact token format. URLs from another origin, altered login URLs, and arbitrary
links are rejected without a navigation or authentication attempt. A trusted
`/ep/<code>` QR is recognized as a public employee profile, not a login QR; the
user is given an explicit option to open it.

## Server protections

QR login is limited to 10 attempts per token and IP address every 15 minutes.
Malformed, unknown, expired, denied, rate-limited, 2FA-required, failed, and
successful uses are recorded in the activity log using a token fingerprint
instead of the token. Accounts with 2FA enabled must finish their existing
challenge before a QR scan establishes a session.