---
name: Group Chat attachments
description: GroupChat (staff internal groups) supports image, voice, and file attachments.
---

## Rule
The server route `POST /api/groups/:id/messages` already accepts `attachmentUrl`, `attachmentType`, `attachmentName`, `attachmentSize` — no server change needed.

The client (`client/src/pages/GroupChat.tsx`) has:
- `GroupVoicePlayer` inline component (same as CSChat's VoicePlayer)
- Message bubble renders image/voice/file based on `m.attachmentType`
- `pendingAttachment` state holds the pre-uploaded file info
- `uploadFile(file)` posts to `/api/upload` and populates `pendingAttachment`
- `startVoiceRec` / `stopVoiceRec` record mic and upload as voice attachment
- Input area has Paperclip (file upload) and Mic (voice record) buttons

**Why:** Group chat previously only displayed text bodies. Voice/image messages were silently dropped from display even though the server stored them.
