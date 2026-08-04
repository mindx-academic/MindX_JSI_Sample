# MindX JSI Final Reference Sample – MindX Smart Class Manager

Bộ mã nguồn tham chiếu chính thức (Final Reference) dành cho môn học **JSI – Web Developer Intermediate** (Master B6) tại **MindX Technology School**.

## Live Demonstration (GitHub Pages)

- **Official Live URL**: [https://mindx-academic.github.io/MindX_JSI_Sample/](https://mindx-academic.github.io/MindX_JSI_Sample/)

---

## Tổng Quan Dự Án & Tính Năng

**MindX Smart Class Manager** là ứng dụng quản lý bài tập và nhiệm vụ lớp học phân quyền người dùng:

1. **Trang Public Task Board (`index.html`)**:
   - Khách vãng lai xem danh sách nhiệm vụ lớp học mẫu từ tệp dữ liệu `data/tasks.json`.
   - Tìm kiếm, lọc nhiệm vụ theo trạng thái và độ ưu tiên.
2. **Xác thực Người Dùng (`login.html` & `register.html`)**:
   - Form Đăng ký / Đăng nhập tài khoản Học viên và Giáo viên.
3. **Phân Quyền Vai Trò (Role-Based Access Control)**:
   - **Học viên (Student)**: Quyền xem danh sách nhiệm vụ (Read-Only).
   - **Giáo viên (Teacher)**: Quyền quản trị toàn bộ (CRUD Dashboard: Thêm, Sửa, Xóa nhiệm vụ).

---

## Trạng Thái Tích Hợp Firebase (Firebase Backend Status)

- **UI & Public Task Board**: **OPERATIONAL (Chạy trực tuyến 100%)** với dữ liệu local `data/tasks.json`.
- **Firebase Auth & Firestore Backend**: Ở trạng thái chờ cấu hình (Pending Real Firebase Client Config). File `js/firebase-config.js` hiện chứa các thông số mẫu.

---

## Hướng Dẫn Chạy Local (Local Development)

1. Clone repository về máy:
   ```bash
   git clone https://github.com/mindx-academic/MindX_JSI_Sample.git
   cd MindX_JSI_Sample
   ```
2. Mở trình duyệt và chạy bằng HTTP Server:
   ```bash
   python3 -m http.server 8000
   ```
3. Truy cập `http://localhost:8000/` trên trình duyệt.

---

## Trạng Thái Triển Khai (Deployment Status)
- **Status**: `DEPLOYED (UI & Public Board Operational)`
- **Môi trường**: GitHub Pages (Branch: `main`)
- **Trạng thái lưu trữ**: Bản backup đầy đủ mã nguồn legacy lưu tại branch `archive/pre-final-deploy-2026-07-31` và tag `pre-final-deploy-2026-07-31`.

---
&copy; 2026 MindX Technology School — Academic & Research Department.
