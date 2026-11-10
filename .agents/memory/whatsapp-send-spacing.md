---
name: WhatsApp send spacing
description: The user's required minimum interval between outbound WhatsApp messages.
---

All WhatsApp messages sent by QIROX systems or APIs must be serialized, with at least three seconds between completed deliveries. Do not send messages concurrently.

**Why:** The user explicitly requires a three-second gap and does not want simultaneous or batched sends.

**How to apply:** Route every outbound provider path through the same queue, including automated replies, system notifications, API sends, images, and documents. If deployment scales to multiple server processes, use shared coordination rather than relying only on an in-process queue.
