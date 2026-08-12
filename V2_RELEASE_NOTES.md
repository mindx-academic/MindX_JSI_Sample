# JSI 2026 OPTIONAL EXTENSIONS V2 - AUTHORITATIVE RELEASE NOTES

**Release Version:** V2 Release Package (Class-wide Comments + Personal Progress)  
**Date:** 2026-08-12  
**Status:** READY FOR AG SELF-QA & GOVERNANCE REVIEW  
**Parent Baseline:** `OPTIONAL_EXTENSIONS/v1/release/` (V1 Locked Baseline)  
**Base Golden Master:** `MASTER_B6_REFERENCE/` (Byte-for-byte immutable, 100% verified)  

---

## 1. Environment & Credentials

- **Firebase Project:** `mindx-jsi-b6-tmp-20260804` (Account: `academic@mindx.vn`)
- **Preview Accounts:**
  - **Teacher:** `teacher@mindx.edu.vn` (Role: `teacher` - Full CRUD, Class Progress Overview Table, Comment Moderation)
  - **Student:** `student@mindx.edu.vn` (Role: `student` - Read-Only Kanban Board, Class-wide Discussion, Personal Progress Selector)

---

## 2. V2 Feature Deliverables

1. **Class-wide Discussion (`/tasks/{taskId}/comments/{commentId}`):**
   - Student & Teacher can post and view class-wide comments on tasks.
   - Text-only with automatic HTTP/HTTPS URL linkification.
   - Author edit rule: Owner can edit within 15 minutes of `createdAt` (`text`, `updatedAt`, `isEdited`).
   - Moderation rule: Owner can delete own comment; Teacher can delete ANY comment. Teacher CANNOT edit Student comment.
2. **Personal Progress (`/tasks/{taskId}/progress/{studentUid}`):**
   - Student 4-status selector (`not_started`, `in_progress`, `need_help`, `completed`).
   - Private per student: Student reads/writes own progress document.
   - Teacher Class Overview: Teacher reads progress docs across class, but CANNOT write student progress.
   - Does NOT alter shared Kanban `task.status`.

---

## 3. Package References & Integrity

- **Authoritative Derivation Manifest:** `v2/release/DERIVATION_MANIFEST.md`
- **V2 Firestore Security Rules Hash:** `f23abea891cb740ee5909f0a1ccf8cfaa0969b06b2414fe7c4134a6b1011ccd3`

---

&copy; 2026 MindX Technology School — Academic & Research Department.
