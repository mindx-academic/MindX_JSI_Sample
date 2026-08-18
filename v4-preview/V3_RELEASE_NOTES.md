# JSI 2026 OPTIONAL EXTENSIONS V3 - RELEASE NOTES

**Release Date:** 2026-08-12  
**Status:** V3 FINAL LOCKED RELEASE  
**Parent Version:** V2 Locked Baseline  
**Base Golden Master:** `MASTER_B6_REFERENCE/` (Byte-for-byte immutable, 93 files verified)  

---

## 1. Feature Highlights

### V1 Optional Extension Features:
- **Task Kanban Board:** 4-column layout (`Cần làm`, `Đang thực hiện`, `Đang kiểm tra`, `Hoàn thành`).
- **Resource Manager:** Embedded link/document management for tasks.
- **Archive Lifecycle:** Archive section, restore, and 30-day soft-delete lifecycle.

### V1.1 Optional Extension Feature:
- **Teacher Kanban Drag & Drop:** Teacher drag-and-drop support across Kanban columns with WebKit support (`-webkit-user-drag: element`), visual drag handle grip (`⠿`), and optimistic UI placement.

### V2 Optional Extension Features:
- **Class-wide Comments:** Firestore collection `/tasks/{taskId}/comments` displaying real-time comments for authenticated users with Teacher moderation deletion.
- **Personal Progress:** Student-owned individual task progress tracker (`/tasks/{taskId}/progress/{studentUid}`).
- **Teacher Progress Overview:** Dynamic 4-card progress summary (Chưa bắt đầu, Đang thực hiện, Cần hỗ trợ, Hoàn thành) for Teachers.

### V3 Optional Extension Features:
- **Student Submission Workflow:** Link submission, notes, and Cloudinary file attachments (`not_submitted` → `draft` → `submitted` → `needs_revision` → `completed`).
- **Cloudinary Integration:** Node.js Express backend (`v3/server/server.js`) signed upload payloads supporting max 5 MB per file, max 3 files, and whitelist formats (`JPEG, PNG, GIF, WebP, PDF, ZIP`).
- **Teacher Feedback & Review:** Dedicated Teacher submission review panel with `Tải xuống` (for ZIPs using `fl_attachment`) and `Xem tệp` (for PNG/PDF), plus `Yêu cầu sửa lại` and `Đánh dấu hoàn thành` feedback actions.
- **Firebase Storage Status:** **SUPERSEDED / NOT REQUIRED**.

---

## 2. Security & Compliance

- **Firestore Rules File:** `v3/release/firestore.rules`
- **Firestore Rules SHA-256:** `cf89c30b8776910554b2f6f4cfefb0623577132239e55765cbdbae1dc3426432`
- **Secret Protection:** `CLOUDINARY_API_SECRET` is strictly server-side (`v3/server/.env`). No private API secrets are exposed in client assets.
- **Server Authentication:** Firebase ID tokens are validated via Firebase Admin SDK.

---

## 3. Cloudinary Free Plan Limitations

- Max 5 MB per file attachment.
- Max 3 files per submission.
- Formats: `JPEG`, `PNG`, `GIF`, `WebP`, `PDF`, `ZIP`.
- Usage credits apply to transformations and storage. Periodic cleanup of orphan test assets is recommended for production rollouts.
