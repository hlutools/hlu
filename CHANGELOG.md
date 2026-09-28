# Changelog

## 280926-web

- Dựng lại Web/PWA theo full source Android 280926.
- Đồng bộ bộ header riêng: Home, Tìm kiếm, Đã lưu, Download, Thông báo, Tài nguyên, Cài đặt, Giới thiệu, Tin tức, Soft, Tài liệu, Firmware và E‑Learning.
- Đổi nhãn Tin tức theo Android 280926; bài mở từ Tin tức giữ header Tin tức khi đi vào tài nguyên gốc và viewer.
- Thêm `sourceSection` / `sourceId` vào model Web để hỗ trợ tin tự sinh trỏ tới tài nguyên gốc.
- Search: tối đa 6 từ khóa phổ biến 2×3, lịch sử, gợi ý và voice search best-effort bằng Web Speech API.
- Giữ E‑Learning schema 3 và cấu hình thi 20/30 câu; migrate lịch sử E‑Learning từ bản Web cũ.
- Giữ Saved, Download history, Notification, Feedback, Analytics và Google Drive image recovery.
- **Loại bỏ hoàn toàn Network Toolkit khỏi Web**: không route, không menu, không Bottom Navigation, không Home quick tools, không module JS/toolkit data, không PWA shortcut.
- Service Worker cache: `hlu-tools-280926-no-toolkit-v1`.
- Thêm backup/rollback branch và cơ chế smoke-test → rollback Pages tự động nếu release mới không đạt marker production.

## 220926.5-web-sync

- Đồng bộ Web/PWA theo Android 220926.5.
- Thay Home, Header, Drawer, Resources và Bottom Navigation theo UI mới.
- Thêm Network Toolkit 10 công cụ với fallback an toàn cho tính năng native-only.
- Thêm E-Learning: remote/cache/local, IndexedDB, 20/30 câu, multi-choice/true-false, timer, auto-submit, lịch sử kết quả.
- Chuyển Notification về Header và dùng Web Notification API khi người dùng cấp quyền.
- Giữ và hợp nhất logic Tin tức Mới, Saved, Download, Feedback, Google Drive thumbnail recovery và analytics.
