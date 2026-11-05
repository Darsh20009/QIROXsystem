# Architecture Diagram — Authentication Flow

**Version:** 1.0  
**Last updated:** Enterprise Governance migration

---

## Local (Username / Password) Authentication

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React Frontend
    participant API as POST /api/login
    participant PP as Passport Local Strategy
    participant DB as UserModel (MongoDB)
    participant BCR as bcrypt.compare
    participant SESS as express-session

    U->>FE: Enter email + password
    FE->>API: POST /api/login { username, password }
    API->>PP: passport.authenticate("local")
    PP->>DB: UserModel.findOne({ username })
    DB-->>PP: User document (or null)
    alt User not found
        PP-->>FE: 401 Incorrect credentials
    end
    PP->>BCR: bcrypt.compare(password, user.passwordHash)
    alt Password mismatch
        PP-->>FE: 401 Incorrect credentials
    end
    PP-->>API: Authenticated user
    API->>SESS: req.session.save() — store user.id
    SESS->>SESS: Persist to MongoDB (connect-mongo)
    API-->>FE: 200 { user } + Set-Cookie: session
```

---

## Google OAuth Flow

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React Frontend
    participant API as Express
    participant PP as passport-google-oauth20
    participant Google as Google OAuth Server
    participant DB as UserModel

    U->>FE: Click "Sign in with Google"
    FE->>API: GET /api/auth/google
    API->>Google: Redirect to Google consent screen
    Google->>U: Show consent dialog
    U->>Google: Approve
    Google->>API: Callback /api/auth/google/callback?code=...
    API->>PP: Exchange code → access_token → profile
    PP->>DB: findOne({ googleId }) or createUser
    PP-->>API: User
    API->>API: req.logIn(user)
    API-->>FE: Redirect to /dashboard
```

---

## GitHub OAuth Flow (also used for DeploymentCloud)

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React
    participant API as Express
    participant GH as GitHub OAuth
    participant DB as UserModel

    U->>FE: Click "Sign in with GitHub" or "Connect GitHub"
    FE->>API: GET /api/auth/github
    API->>GH: Redirect to GitHub authorize
    GH->>U: Consent screen
    U->>GH: Approve
    GH->>API: Callback /api/auth/github/callback
    API->>DB: Find or create user; store githubDeployToken
    API-->>FE: Redirect to /dashboard or /employee/deployment-cloud
```

---

## TOTP (Two-Factor Authentication)

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React
    participant API as POST /api/auth/totp/verify
    participant SPK as speakeasy.totp.verify
    participant DB as UserModel
    participant SESS as express-session

    Note over U,FE: After successful password login

    U->>FE: Enter 6-digit TOTP code
    FE->>API: POST { token }
    API->>DB: Load user.totpSecret
    API->>SPK: speakeasy.totp.verify({ secret, token, window: 1 })
    alt TOTP invalid
        SPK-->>API: false
        API-->>FE: 401 Invalid code
    end
    SPK-->>API: true
    API->>SESS: Mark session as 2fa-verified
    API-->>FE: 200 { verified: true }
```

---

## WebAuthn / Passkey Flow

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React (@simplewebauthn/browser)
    participant API as Express
    participant SWA as @simplewebauthn/server
    participant DB as UserModel (passkey stored)

    Note over U,FE: Registration
    U->>FE: Register passkey
    FE->>API: POST /api/auth/webauthn/register/options
    API->>SWA: generateRegistrationOptions()
    SWA-->>API: options (challenge)
    API-->>FE: options
    FE->>U: Browser authenticator prompt
    U->>FE: Biometric / device confirmation
    FE->>API: POST /api/auth/webauthn/register/verify { credential }
    API->>SWA: verifyRegistrationResponse()
    SWA-->>API: verified + credentialID
    API->>DB: Store credentialID + publicKey
    API-->>FE: 200 registered

    Note over U,FE: Authentication
    U->>FE: Sign in with passkey
    FE->>API: POST /api/auth/webauthn/auth/options
    API->>SWA: generateAuthenticationOptions()
    API-->>FE: options
    FE->>U: Authenticator prompt
    FE->>API: POST /api/auth/webauthn/auth/verify { credential }
    API->>SWA: verifyAuthenticationResponse()
    SWA-->>API: verified
    API->>API: req.logIn(user)
    API-->>FE: 200 authenticated
```

---

## Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Anonymous : No session cookie
    Anonymous --> Authenticated : Successful login (any strategy)
    Authenticated --> TwoFARequired : User has TOTP enabled
    TwoFARequired --> FullyAuthenticated : TOTP verified
    Authenticated --> FullyAuthenticated : No TOTP configured
    FullyAuthenticated --> Anonymous : POST /api/logout or session expiry
    FullyAuthenticated --> Anonymous : Session timeout (express-session maxAge)
```
