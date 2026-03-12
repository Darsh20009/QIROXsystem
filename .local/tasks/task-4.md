---
title: إضافة رابط واتساب في صفحة التواصل
---
# Add WhatsApp Link to Contact Page

## What & Why
Add a WhatsApp contact card to the Contact page sidebar, alongside the existing Email and Locations cards. The WhatsApp number should be read from the public system settings (already has a `whatsapp` field in AdminQiroxSettings). This gives visitors a quick way to reach support via WhatsApp.

## Done looks like
- A new WhatsApp card appears in the Contact page sidebar (right column) with the WhatsApp icon and a clickable link
- Clicking the link opens WhatsApp chat with the configured number (using `https://wa.me/` format)
- If no WhatsApp number is configured in settings, the card is hidden
- Supports both Arabic and English labels

## Out of scope
- Changes to the admin settings page (WhatsApp field already exists there)
- WhatsApp API integration or chatbot functionality

## Tasks
1. **Add WhatsApp card** — Add a new card in the Contact page sidebar between Email and Locations cards, with the WhatsApp icon from `react-icons/si`, the number displayed, and a clickable `wa.me` link. Read the number from the public settings API endpoint already used by the Footer component.

## Relevant files
- `client/src/pages/Contact.tsx`
- `client/src/components/Footer.tsx:24,50`
- `client/src/pages/AdminQiroxSettings.tsx:22,210`