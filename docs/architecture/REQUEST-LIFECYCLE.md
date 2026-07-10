# Architecture Diagram — Request Lifecycle

**Version:** 1.0  
**Last updated:** Enterprise Governance migration

---

## Full Request Lifecycle

```mermaid
sequenceDiagram
    actor C as Client (Browser)
    participant RP as Replit Proxy
    participant RL as Rate Limiter
    participant Sess as Session MW
    participant PP as Passport
    participant PR as Public Route Check
    participant RH as Route Handler
    participant Auth as Auth Guard
    participant SVC as Domain Service
    participant REPO as Repository
    participant DB as MongoDB
    participant RESP as Response

    C->>RP: HTTP Request
    RP->>RL: Forward (mTLS terminated)
    RL->>RL: Check IP + rate window
    alt Rate limit exceeded
        RL-->>C: 429 Too Many Requests
    end
    RL->>Sess: Pass
    Sess->>Sess: Deserialise session cookie → req.session
    Sess->>PP: Pass
    PP->>PP: Populate req.user from session
    PP->>PR: Pass
    PR->>PR: Is route in public whitelist?
    alt Public route
        PR->>RH: Skip auth checks
    else Protected route
        PR->>Auth: Enforce authentication
        Auth->>Auth: req.user present?
        alt Not authenticated
            Auth-->>C: 401 Unauthorised
        end
        Auth->>Auth: user.role allowed for this route?
        alt Insufficient role
            Auth-->>C: 403 Forbidden
        end
        Auth->>RH: Proceed
    end
    RH->>SVC: Call domain service
    SVC->>REPO: Query / mutate
    REPO->>DB: Mongoose operation
    DB-->>REPO: Document(s)
    REPO-->>SVC: Typed result
    SVC-->>RH: Service response
    RH->>RESP: res.json(result)
    RESP-->>C: HTTP 200 / 201 / 204
```

---

## WebSocket Request Lifecycle

```mermaid
sequenceDiagram
    actor C as Client (Browser)
    participant WS as ws.ts (WebSocket Server)
    participant DB as MongoDB (NotificationModel)
    participant Push as push.ts (VAPID)

    C->>WS: WS Upgrade (Sec-WebSocket-Key)
    WS->>WS: Authenticate connection (session-based)
    WS->>WS: Register client in room map

    Note over WS: Platform event occurs (e.g. new order)

    WS->>DB: Persist notification (notify.ts)
    WS->>WS: Is user online (in room map)?
    alt User online
        WS-->>C: pushToUser (real-time delivery)
    else User offline
        WS->>Push: sendPushToUser (VAPID)
        Push-->>C: Browser Push Notification
    end
```

---

## Static Asset Request Lifecycle

```mermaid
sequenceDiagram
    actor C as Client (Browser)
    participant RP as Replit Proxy
    participant Static as Express Static (dist/public)

    C->>RP: GET /assets/... or GET /
    RP->>Static: Forward
    Static->>Static: Serve pre-built Vite bundle
    Note over Static: Vite HMR is DISABLED (SIGBUS in this env)\nPre-built dist/public is served instead
    Static-->>C: HTML / JS / CSS / images
```
