# Security Specification — CAMPUSFIX AI

## 1. Data Invariants
1. **PII Isolation**: Private user data (`email`, `campusId`, `bookmarks`) lives strictly under `/users/{userId}/private/{docId}` and is readable/writable ONLY by `request.auth.uid == userId` or verified admin. Public `/users/{userId}` never stores email or phone.
2. **No Self-Assigned Roles**: Users creating `/users/{userId}` can only assign `role == 'student'` unless they are a verified admin in `/admins/{uid}` or bootstrapped admin email (`marcenzoo44@gmail.com` with `email_verified == true`). Role updates are blocked for non-admins.
3. **Identity Integrity**: Every user-authored record (`complaints`, `listings`, `notices`, `resources`, `lostItems`, `opportunities`, `mentorSessions`, `notes`) requires `authorId/sellerId/organizerId/uploaderId/reporterId/creatorId/userId == request.auth.uid` on create and keeps that owner field immutable on update.
4. **Temporal Integrity**: `createdAt` and `updatedAt` are validated against `request.time` on create and `updatedAt == request.time` on update. `createdAt` is immutable.
5. **Terminal State Locking**: Once a complaint reaches `status == 'resolved'`, a listing reaches `status == 'sold'`, or a lost item reaches `status == 'claimed'`, non-admin clients cannot reopen or mutate it.
6. **Strict Key & Size Guards**: Every `create` checks `hasAll` + `hasOnly`, every `update` uses `affectedKeys().hasOnly(...)` per named action, every string has explicit `.size()` bounds, and every document ID matches `^[a-zA-Z0-9_\-]+$`.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated write to `/complaints/cmp_1`.
2. Unverified email user writing to `/complaints/cmp_2`.
3. Student creating `/users/{uid}` with `role: 'admin'`.
4. Student updating `/users/{uid}` to escalate `role: 'faculty'`.
5. Non-owner reading `/users/{otherUid}/private/profile` (PII leak).
6. Creating `/complaints/bad$id` with invalid characters in document ID.
7. Shadow field injection: adding `isVerified: true` to `/listings/{id}`.
8. Spoofed author: creating `/complaints/{id}` with `authorId: 'someone_else'`.
9. Client-forged timestamp: creating `/notes/{id}` with `createdAt` in the past instead of `request.time`.
10. Reopening a terminal complaint (`status: 'resolved' -> 'open'`) as a non-admin student.
11. Unbounded string Resource Poisoning: 50KB description on `/lostItems/{id}`.
12. Cross-user list scraping on `/mentorSessions` or `/notes` without filtering by `userId == request.auth.uid`.
