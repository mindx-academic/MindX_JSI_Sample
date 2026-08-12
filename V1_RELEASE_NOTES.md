# JSI 2026 OPTIONAL EXTENSIONS V1 - AUTHORITATIVE RELEASE NOTES

**Release Version:** V1 Final Lock Package (Kanban + Learning Resource Management)  
**Date:** 2026-08-12  
**Status:** READY FOR USER V1 LOCK  
**Base Golden Master:** `MASTER_B6_REFERENCE/` (Byte-for-byte immutable, 100% verified against complete 93-file checksum baseline)  

---

## 1. Environment & Environment Credentials

- **Firebase Project:** `mindx-jsi-b6-tmp-20260804` (Firebase Cloud Account: `academic@mindx.vn`)
- **Preview Accounts:**
  - **Teacher:** `teacher@mindx.edu.vn` (Role: `teacher` - Full CRUD, Kanban Column Transitions, Resource Management)
  - **Student:** `student@mindx.edu.vn` (Role: `student` - Read-Only Kanban Board, Resource Link Detector)
- **Canonical Seed Data:** T001–T008 baseline tasks loaded in Firestore & local JSON.

---

## 2. Runtime Capability & Security Verification

- **Runtime Features:**
  - 4-Column Kanban Board (`todo`, `doing`, `review`, `done`) with active/archived lifecycle filtering.
  - Resource Manager for URL resources (up to 20 resources per task).
  - Unified Task Detail view with dynamic role-based controls.
  - Automated Lifecycle Backfill & Bridge adapter.
- **Security & Firestore Rules:**
  - **Final Rules SHA-256:** `0f7813a3769f213b4ec26f907b1ecb6e14f29bca46aa6260324d9d91d03f483d`
  - Enforces list structure & `resources.size() <= 20`.
  - DENIES client hard deletes (`allow delete: false`).
  - Student write access strictly denied.
- **QA Evidence:**
  - **Targeted Rules Cases (R1–R8):** 8/8 PASS.
  - **V1 Automated Matrix (V1-QA-001 to V1-QA-025):** 25/25 PASS.

---

## 3. Package & Manifest References

- **Authoritative Derivation Manifest:** `DERIVATION_MANIFEST.md`
- **Package Checksums:** `CHECKSUMS.sha256`
- **Rollback Location:** `OPTIONAL_EXTENSIONS/rollback/core-compatible/` (verified functional & compatible with V1 Rules).
- **Golden Master Baseline:** `MASTER_B6_REFERENCE/` (100% untouched, 93 files verified in `checksums.txt`).

---

## 4. Known Limitations & Deferred Features

- **Drag-and-Drop Column Reordering:** Deferred to V1.1.
- **Class-wide Comments & Personal Progress Pills:** Deferred to V2.
- **Single Submission, File Upload (<= 5MB) & Teacher Feedback:** Deferred to V3.

---

&copy; 2026 MindX Technology School — Academic & Research Department.
