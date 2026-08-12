# JSI 2026 OPTIONAL EXTENSIONS V1 - RELEASE DERIVATION MANIFEST

**Release Version:** V1 (Kanban + Resources)  
**Build Date:** 2026-08-07  
**Base Golden Master:** `MASTER_B6_REFERENCE/` (Byte-for-byte immutable)  
**Golden Master SHA-256 Checksum:** `bba93dd8e27b5f96fc02785719f33a28ef0751ec52559238be9e24344371489d` (93 files verified)

---

## Complete Self-Contained Release Inventory

| File Path | Classification | Parent Source | SHA-256 Hash |
|---|---|---|---|
| `login.html` | `COPIED_UNCHANGED` | `MASTER_B6_REFERENCE/login.html` | `098002519659af8128538c9fe302f0192252f12962ff6efeda94174ade74db76` |
| `register.html` | `COPIED_UNCHANGED` | `MASTER_B6_REFERENCE/register.html` | `e1658f2c88c3b8387632cf391cd839a448c032d62800e2bae34ba844dc6e6f5b` |
| `css/style.css` | `COPIED_UNCHANGED` | `MASTER_B6_REFERENCE/css/style.css` | `eb5e7d207e541b286ec52688a85532c1fae01e7f0150da7274f7c0c19e38dcaf` |
| `css/v1-kanban.css` | `NEW_FEATURE` | - | `[Generated]` |
| `js/firebase-config.js` | `DEPLOYMENT_ONLY` | `MASTER_B6_REFERENCE/js/firebase-config.example.js` | `6eff3df58094d75a8877609856db6a07ef44308855b75b02a29d6f58fa487935` |
| `js/auth.js` | `COPIED_UNCHANGED` | `MASTER_B6_REFERENCE/js/auth.js` | `7572f4157579e05b8a8a7da1ffdc4ff2d3eaf2473a67e84a9e2578303a05d680` |
| `js/role-helper.js` | `COPIED_UNCHANGED` | `MASTER_B6_REFERENCE/js/role-helper.js` | `977c6d8f939ac19d7a94e78715b289d73565342caa73469be27dbb4d1c056ea8` |
| `js/task-local-data.js` | `COPIED_UNCHANGED` | `MASTER_B6_REFERENCE/js/task-local-data.js` | `f321c7ba9fbae0f23872f2b527dae20aa1a73ba1f46ca3c0db56f8f8b1022e66` |
| `js/task-data-processing.js` | `COPIED_UNCHANGED` | `MASTER_B6_REFERENCE/js/task-data-processing.js` | `af468f90011a1e8a14f541a0f5c4c4c7cdd0a9e3226d4969460de82d09ae58b4` |
| `js/task-firestore.js` | `DERIVED_MODIFIED` | `MASTER_B6_REFERENCE/js/task-firestore.js` | `[Derived V1]` |
| `js/task-schema-adapter.js` | `NEW_FEATURE` | - | `[Generated]` |
| `js/task-ui.js` | `DERIVED_MODIFIED` | `MASTER_B6_REFERENCE/js/task-ui.js` | `[Derived V1]` |
| `js/version-config.js` | `NEW_FEATURE` | - | `[Generated]` |
| `js/app-bridge.js` | `NEW_FEATURE` | - | `[Generated]` |
| `js/resource-detector.js` | `NEW_FEATURE` | - | `[Generated]` |
| `js/resource-manager.js` | `NEW_FEATURE` | - | `[Generated]` |
| `js/kanban-ui.js` | `NEW_FEATURE` | - | `[Generated]` |
| `js/task-detail-controller.js` | `NEW_FEATURE` | - | `[Generated]` |
| `js/backfill-lifecycle.js` | `NEW_FEATURE` | - | `[Generated]` |
| `js/bootstrap.js` | `NEW_FEATURE` | - | `[Generated]` |
| `js/app.js` | `DERIVED_MODIFIED` | `MASTER_B6_REFERENCE/js/app.js` | `[Derived V1]` |
| `index.html` | `DERIVED_MODIFIED` | `MASTER_B6_REFERENCE/index.html` | `[Derived V1]` |
| `data/tasks.json` | `COPIED_UNCHANGED` | `MASTER_B6_REFERENCE/data/tasks.json` | `6f029ac301c0dada07f7a43bbac525a86ecc941e842f25e52d8c0b8e081b33f5` |
| `firestore.rules` | `DEPLOYMENT_ONLY` | - | `[V1 Versioned Rules]` |
| `firebase.json` | `DEPLOYMENT_ONLY` | `MASTER_B6_REFERENCE/firebase.json` | `[V1 Config]` |

---

## Derivation Integrity Summary

1. `MASTER_B6_REFERENCE/` is 100% untouched and byte-for-byte verified.
2. V1 release artifact is completely self-contained at `OPTIONAL_EXTENSIONS/v1/release/`.
3. Script load order strictly adheres to the 8-stage load order contract.
4. All 25 automated QA cases (`V1-QA-001` through `V1-QA-025`) execute with 100% PASS.
