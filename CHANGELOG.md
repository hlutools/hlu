# Changelog

## Archived — 23/09/2026

- Dừng phát triển HLU TOOLS Web App do giới hạn sandbox/bảo mật của Web và Safari/iOS khiến Network Toolkit và Tình trạng kết nối không thể tương đương Android.
- Giữ nguyên source Web 220926.5 để tham khảo/khôi phục.
- Chuyển GitHub Pages sang trang thông báo dự án đã dừng.
- Lưu các file runtime gốc bị thay đổi trong `archive/original-final-220926.5/`.
- HLU TOOLS Android tiếp tục phát triển độc lập và không bị ảnh hưởng.

## 220926.5-web-sync

- Đồng bộ Web/PWA theo Android 220926.5.
- Thay Home, Header, Drawer, Resources và Bottom Navigation theo UI mới.
- Thêm Network Toolkit 10 công cụ với fallback an toàn cho tính năng native-only.
- Thêm E-Learning: remote/cache/local, IndexedDB, 20/30 câu, multi-choice/true-false, timer, auto-submit, lịch sử kết quả.
- Chuyển Notification về Header và dùng Web Notification API khi người dùng cấp quyền.
- Giữ và hợp nhất logic Tin tức Mới, Saved, Download, Feedback, Google Drive thumbnail recovery và analytics.
- Nâng Service Worker cache lên `hlu-tools-220926-5-v1`.