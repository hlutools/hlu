# 02102026 — 2026-10-02

- Đồng bộ source Android 02102026 trên Web 280926.4; giữ kiến trúc và loại Toolkit.
- Chuyển vector Menu XML, bổ sung hồ sơ, slide bài mới 48px, ảnh Home mới và icon action/E-Learning theo baseline.
- Đồng bộ tab Tài nguyên bằng facet; giữ category gốc; chỉ hiện Download nếu có link thật.
- Đồng bộ Profile, tùy chọn hiển thị/ngôn ngữ, Giới thiệu và lịch sử phiên bản; bỏ action Kiểm tra cập nhật.
- Giữ bank/engine thi; sửa thời điểm đăng ký Service Worker, precache asset mới.
- Hoàn thành test source, regression logic, browser 20/30 và PWA offline. Chưa publish lên GitHub/production.

# Changelog

## 280926.4-web-about-parity

- Đồng bộ Cài đặt > Giới thiệu với Android 280926: text, thứ tự, icon, kích thước, typography và spacing.
- Sửa hành vi `Kiểm tra cập nhật` để chỉ nút trailing thực hiện action như Android.
- Đồng bộ Nhật ký phiên bản với AlertDialog + dữ liệu `release_history.json` Android 280926.
- Đồng bộ màn con Giới thiệu HLU TOOLS theo `HluAboutShell`.
- Không thay đổi các module ngoài phạm vi Cài đặt/Giới thiệu.

# 280926.4

- Sửa normalize category: không còn truyền nhầm tham số thứ 3 của `Array.map` vào `forced section`.
- Khôi phục đúng Tin tức trên Trang chủ và phân loại Soft/Firmware/Tài liệu.
- Thêm cụm Yêu thích + Download xếp dọc cho card trong các màn Soft/Tài liệu/Firmware; Download chỉ bật khi có link tải thật.
- Không thay đổi các module ngoài phạm vi.

# 280926.2

- Đồng bộ Bottom Navigation icon theo Android.
- Thêm Download action cho card Tài nguyên.
- Đồng bộ Cài đặt > Giới thiệu và icon liên hệ theo Android.
- Sửa icon Timer trong Thi thử E-Learning.
- Tin tức hiển thị ngay từ same-origin fallback và merge ổn định với API/cache.

# Changelog

## 280926.1-web-fix

- Sửa icon chuông Header theo Android 280926.
- Chuẩn hóa icon Menu trái theo chức năng.
- Đồng bộ cấu trúc Cài đặt Web theo Android 280926.
- Xóa tagline + version khỏi footer Drawer, giữ Developed by Cường VNPT.
- Sửa Tin tức bằng API-first + same-origin fallback snapshot; Pages build refresh snapshot best-effort từ Apps Script.
- Không thay đổi E-Learning, Saved, Download, Search hay các module ngoài phạm vi.

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