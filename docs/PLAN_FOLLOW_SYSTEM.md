# Implementation Plan: Followers & Following System

## Objective
Build a social graph where users can follow each other, establishing a community aspect within CodeVault.

## 1. Database & Schema Updates
Add a new self-referential relation in `schema.prisma`:
```prisma
model Follows {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower    User @relation("Following", fields: [followerId], references: [id])
  following   User @relation("Followers", fields: [followingId], references: [id])

  @@id([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```
Update the `User` model to include relations to `Follows`.

## 2. Backend (Express) Updates
- **New Routes:** Create `src/routes/follow.routes.ts`.
  - `POST /api/users/:handle/follow` - Follow a user.
  - `DELETE /api/users/:handle/follow` - Unfollow a user.
  - `GET /api/users/:handle/followers` - Get followers list.
  - `GET /api/users/:handle/following` - Get following list.
- **Stats Integration:** The `GET /api/public/u/:handle` endpoint will now include `followerCount` and `followingCount`.

## 3. Frontend (Next.js) Updates
- **Public Profile UI:** Add a "Follow" / "Unfollow" button to the public portfolio page (`/u/[handle]`).
- **Stats Display:** Show "X Followers • Y Following" prominently on user profiles.
- **List Modals:** Clicking on "Followers" opens a modal showing a list of users (avatar, handle, display name) that you can click to view their profiles.
- **Activity Feed (Future Scope):** Once following is implemented, we can eventually add an Activity Feed to the dashboard showing "Gaurav just solved Two Sum on LeetCode".

## 4. Open Questions for Review
- Should users receive an in-app notification or email when someone follows them?
- Do we need a "Private Account" feature where follow requests must be explicitly approved, or are all profiles strictly public like GitHub/Twitter?
