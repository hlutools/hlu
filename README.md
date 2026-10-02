# HLU TOOLS Web/PWA 02102026

Đồng bộ từ Android **HLU_TOOLS_02102026_SOURCE.zip**, trên nền Web **280926.4** tại commit `d428d623eeaeb5b68b1259a95dcf3623a9c8a0bd`. **Toolkit tiếp tục bị loại bỏ hoàn toàn khỏi Web.**

- Giữ JavaScript thuần, router `?view=`, localStorage, IndexedDB và Service Worker hiện có.
- Menu dùng SVG chuyển trực tiếp từ vector XML Android; Bottom Navigation dùng đúng Home / Search / BookmarkBorder / Download.
- Home thêm slide bài mới 48px, tối đa 5 bài Soft/Tài liệu/Firmware, xoay 4 giây; card dùng ảnh Android mới theo tỷ lệ gốc và chỉ giữ tên ngắn.
- Profile dùng state trình bày, avatar tròn, họ tên/nơi làm việc, rồi Tài khoản / Số điện thoại / Email. Mặc định chưa đăng nhập; không bổ sung backend Auth hoặc thao tác Đăng xuất giả.
- Tài nguyên dùng các tab Tất cả / Tài liệu / Hướng dẫn / Mẫu biểu / Khác; facet không đổi category gốc. Favorite và Download nằm dọc bên phải; chỉ có Download khi có link tải thật.
- Cài đặt bổ sung màu nhấn, cỡ chữ 75/100/120%, chất lượng ảnh và Tiếng Việt/English ở lớp hiển thị. Nội dung tài nguyên, đề thi, đáp án, dữ liệu và route không bị dịch.
- Giới thiệu hiển thị `v02102026`, đúng lịch sử Android; Kiểm tra cập nhật là dòng thông tin chưa có action theo baseline.
- E-Learning giữ engine/schema 3, cấu hình 20/30, timer và online → IndexedDB → local; ngân hàng bundled trùng byte với Android 02102026.
- Sửa đăng ký Service Worker khi bootstrap async hoàn tất sau sự kiện `load`; cache mới `hlu-tools-02102026-v2` để thay toàn bộ asset sau bản PR #8.

Browser chỉ cung cấp online/offline, loại kết nối nếu hỗ trợ, Public IP best-effort và API RTT; không giả SSID, IP LAN hoặc ICMP Ping. Trình duyệt quản lý file tải, ứng dụng chỉ lưu lịch sử yêu cầu tải.

Node.js 22+:

```bash
npm test
npm run build
```

`npm test` kiểm tra source/compile/asset/PWA và regression category, slide, facets, link tải, Favorite. Không có script lint riêng hoặc TypeScript trong dự án. `dist/` là nội dung GitHub Pages; không commit thư mục này.

`HLU_SYNC_NEWS=1 npm run build` thử cập nhật snapshot Tin tức từ Apps Script, giữ fallback thật nếu không truy cập được. Lần kiểm tra 2026-10-02 bị timeout; source vẫn chứa 4 tin fallback.

Báo cáo bàn giao `HLU_TOOLS_WEB_02102026_REPORT.md` liệt kê bảng đối chiếu, icon, danh sách file, kiểm tra và giới hạn. Xem [BACKUP_ROLLBACK.md](BACKUP_ROLLBACK.md) để dùng baseline rollback. Google Material Icons dùng giấy phép Apache-2.0 tại `MATERIAL_ICONS_LICENSE.txt`.
