# Architecture Diagram — Event & Notification Flow

**Version:** 1.0  
**Last updated:** Enterprise Governance migration

---

## Notification Delivery Architecture

```mermaid
graph TB
    subgraph Triggers["Event Triggers"]
        ORD["New Order"]
        TICK["New Ticket"]
        MSG["New Message"]
        PAY["Payment Update"]
        TASK["Task Assigned"]
        MEET["Meeting Invite"]
        EMAIL_MKT["Marketing Campaign"]
    end

    subgraph Notify["notify.ts — Notification Hub"]
        N["notifyUser(\n  userId,\n  type,\n  title,\n  message,\n  data?\n)"]
    end

    subgraph Layers["Delivery Layers (in order)"]
        L1["Layer 1: DB Persistence\n(NotificationModel.create)"]
        L2["Layer 2: WebSocket Push\n(ws.ts — pushToUser)"]
        L3["Layer 3: Web Push\n(push.ts — sendPushToUser)"]
    end

    subgraph Storage["Notification Store"]
        DB[("MongoDB\nNotificationModel")]
    end

    subgraph WS["WebSocket Server (ws.ts)"]
        ROOM["Room Map\n{ userId → ws.client }"]
        BROADCAST["pushToUser(userId, payload)"]
    end

    subgraph Push["Web Push (push.ts)"]
        VAPID["webpush.sendNotification\n(VAPID)"]
        SUBS[("MongoDB\nPushSubscriptionModel")]
    end

    subgraph Client["Client"]
        UI["🌐 Browser\n(real-time update)"]
        SW["Service Worker\n(browser push)"]
    end

    Triggers --> N
    N --> L1
    L1 --> DB
    N --> L2
    L2 --> ROOM
    ROOM -->|"user online"| BROADCAST
    BROADCAST --> UI
    ROOM -->|"user offline"| L3
    L3 --> SUBS
    SUBS --> VAPID
    VAPID --> SW
    SW --> UI
```

---

## Event Flow — New Order Example

```mermaid
sequenceDiagram
    actor C as Client
    participant API as POST /api/orders
    participant RH as Route Handler
    participant DB as MongoDB (OrderModel)
    participant N as notify.ts
    participant WS as ws.ts
    participant EMAIL as email domain
    participant SMTP as SMTP Server
    participant PUSH as push.ts
    participant SW as Service Worker

    C->>API: POST /api/orders { ... }
    API->>RH: Handler
    RH->>DB: OrderModel.create(...)
    DB-->>RH: New order document
    RH->>N: notifyUser(adminId, "new_order", ...)
    N->>DB: NotificationModel.create(...)
    N->>WS: pushToUser(adminId, payload)
    WS->>WS: Admin online?
    alt Admin online
        WS-->>WS: Send via WebSocket
    else Admin offline
        WS->>PUSH: sendPushToUser(adminId, payload)
        PUSH->>SW: VAPID push
        SW-->>WS: Browser notification shown
    end
    RH->>EMAIL: sendOrderConfirmationEmail(client.email, ...)
    EMAIL->>SMTP: nodemailer.sendMail(...)
    RH-->>C: 201 { order }
```

---

## Cron-Triggered Events

```mermaid
graph LR
    subgraph Cron["cron.ts (27 jobs)"]
        DAILY["Daily 9AM\n(Riyadh time)"]
        WEEKLY["Sunday 10AM\n(Riyadh time)"]
        OTHERS["Other scheduled jobs"]
    end

    DAILY -->|"sendWeeklyReportEmail (daily)"| EMAIL["email domain\n/ server/email.ts"]
    WEEKLY -->|"campaign dispatch"| EM["email-marketing.ts"]
    EM --> SMTP["SMTP via nodemailer"]
    EMAIL --> SMTP
    OTHERS -->|"backup, cleanup, sync"| DB[("MongoDB")]
```

---

## WebSocket Room Management

```mermaid
graph TB
    subgraph WS["ws.ts — WebSocket Server"]
        UPGRADE["HTTP Upgrade → WS"]
        AUTH_WS["Authenticate via session"]
        MAP["Room Map\n{ userId → Set of ws.WebSocket }"]
        QM_ROOM["QMeet Signal Room\n{ roomId → Set of ws.WebSocket }"]
    end

    UPGRADE --> AUTH_WS
    AUTH_WS -->|"Authenticated user"| MAP
    AUTH_WS -->|"QMeet join signal"| QM_ROOM

    MAP -->|"Notification push"| CLIENT["Client Browser"]
    QM_ROOM -->|"WebRTC signaling\n(offer/answer/ICE)"| CLIENT
```
