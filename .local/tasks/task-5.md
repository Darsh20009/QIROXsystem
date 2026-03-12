---
title: إضافة حقل واتساب في قسم التواصل الاجتماعي
---
# Add WhatsApp to Social Media Section

## What & Why
Add a WhatsApp field to the "منصات التواصل الاجتماعي" (Social Media Platforms) section in AdminQiroxSettings, alongside Instagram, Twitter, LinkedIn, YouTube, Snapchat, and TikTok. Currently WhatsApp only appears in the "بيانات التواصل" (Contact) section, but users expect it in the social media section too.

## Done looks like
- A WhatsApp entry appears in the social media grid in AdminQiroxSettings alongside the other platforms
- Uses a WhatsApp-branded icon and green color
- The field reads/writes the same `whatsapp` key already in the settings form
- No duplicate data — both the contact section field and the social section field bind to the same `form.whatsapp` value

## Out of scope
- Backend changes (the whatsapp field is already persisted)
- Changes to the Contact page (already done in Task #4)

## Tasks
1. **Add WhatsApp entry to social media array** — Add a WhatsApp item to the social platforms array in the "social" section, using a phone/message icon with green (#25D366) color, binding to the existing `whatsapp` form key.

## Relevant files
- `client/src/pages/AdminQiroxSettings.tsx:222-236`