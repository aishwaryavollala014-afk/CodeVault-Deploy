# Implementation Plan: Messaging System

## Objective
Allow users to send direct messages to each other within CodeVault, similar to LinkedIn messaging.

## 1. Database & Schema Updates
Add a new model to `schema.prisma`:
```prisma
model Message {
  id         String   @id @default(cuid())
  senderId   String
  receiverId String
  content    String
  createdAt  DateTime @default(now())
  readAt     DateTime?

  sender     User     @relation("SentMessages", fields: [senderId], references: [id])
  receiver   User     @relation("ReceivedMessages", fields: [receiverId], references: [id])

  @@index([senderId, receiverId])
}
```

## 2. Backend (Express) Updates
- **New Routes:** Create `src/routes/message.routes.ts`.
  - `GET /api/messages` - Get list of recent conversations (latest message per user).
  - `GET /api/messages/:handle` - Get chat history with a specific user.
  - `POST /api/messages/:handle` - Send a new message.
- **Real-time Engine (Optional but Recommended):** 
  - Integrate `Socket.io` into the Express server so messages appear instantly without refreshing.
  - If we skip WebSockets for v1, we can use HTTP polling (fetch every 5 seconds) for simplicity.

## 3. Frontend (Next.js) Updates
- **New Page:** `src/app/(app)/messages/page.tsx`
  - Two-pane layout: Left sidebar with conversation list, right pane with active chat thread.
- **Message Button:** Add a "Message" button to the Public Portfolio Page (`/u/[handle]`) so users can initiate contact easily.
- **Notifications:** Show an unread message badge in the main navigation bar.

## 4. Open Questions for Review
- Should we restrict messaging so that you can only message people who follow you (to prevent spam), or keep it completely open?
- Do you want real-time WebSockets (instant chat) for Version 1, or is simple HTTP polling acceptable to start?
