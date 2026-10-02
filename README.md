# HLU TOOLS Web/PWA — 02102026

Android baseline: **HLU_TOOLS_02102026_SOURCE.zip**. Web baseline: **280926.4**, GitHub commit `d428d623eeaeb5b68b1259a95dcf3623a9c8a0bd`.

Ứng dụng dùng HTML/CSS/JavaScript thuần; router `?view=`, localStorage cho dữ liệu/đã lưu/lịch sử/tùy chọn, IndexedDB cho ngân hàng đề, Apps Script cho nội dung/E-Learning/feedback/analytics và Service Worker cho offline. Không đổi framework, API hay dependency.

## Đồng bộ Android 02102026

- Drawer: avatar/tên/tài khoản, 10 mục Web theo thứ tự Android, vector drawer gốc (chuyển path XML sang SVG), footer artwork gốc; chỉ Cường VNPT mở Zalo.
- Home: slide 48px dưới header, tối đa 5 bài Soft/Tài liệu/Firmware theo ngày tạo → ngày cập nhật; chuyển sau 4 giây, dừng khi tab ẩn hoặc đang tương tác. Bốn ảnh 300926 gốc, giữ tỉ lệ và nhãn tên nhóm.
- Tài khoản & hồ sơ: avatar, tên/nơi làm việc, Tài khoản → Số điện thoại → Email; giá trị trống giống Android. `window.HLU_PROFILE` là input hiển thị tùy chọn, chưa có backend Auth.
- Tài nguyên: Tất cả → Tài liệu → Hướng dẫn → Mẫu biểu → Khác; facet không thay `section`. Favorite + Download thẳng hàng bên phải, chỉ hiện Download khi có URL tải thật.
- Giao diện: system/light/dark, ba màu nhấn, cỡ chữ 75/100/120%, chất lượng ảnh Drive; VI/EN chỉ dịch các nhãn presentation đã đánh dấu, giữ nguyên dữ liệu nguồn/câu hỏi/đáp án/payload.
- Giới thiệu: đúng nhóm, text/thứ tự/contact; version nguồn 02102026. Kiểm tra cập nhật là hàng thông tin không có action như Android hiện tại. Lịch sử lấy nguyên asset Android.
- Icon Material chuẩn cho bottom nav, Settings, Search, Saved và E-Learning. Drawer/bell dùng path từ Android; Zalo dùng asset cũ đã lấy từ Android.

| Khu vực | Icon Android → Web |
|---|---|
| Bottom Nav | Home / Search / BookmarkBorder / Download, cùng icon khi active; đổi màu/trọng số và chỉ thị 38×3 |
| Drawer | drawer_icon_{home,news,soft,docs,firmware,learning,search,saved,download,settings}_300926.xml → SVG paths |
| Settings | Person / Palette / Language / Sync / Info |
| Liên hệ | Facebook / ic_zalo.png / Phone / Email / Business |
| E-Learning | School / Quiz / Timer / PlayArrow / Article / MenuBook / Shuffle / Bookmark(Border) / ArrowBack / ChevronRight / Send / CheckCircle / Cancel / EmojiEvents / ListAlt |
| Tài nguyên/detail | Favorite(Border) / Download / CalendarMonth / Visibility / Article |
| Search/Saved | Search / Mic / LocalFireDepartment / History / DeleteOutline / FolderOpen / PlayCircleOutline / Image / Description / ViewList / GridView / Star(Border) |

Icon Material lấy từ `google/material-design-icons`, style **materialicons**, không đổi sang Material Symbols. License: `assets/icons/MATERIAL_LICENSE.txt`. Không fallback âm thầm sang icon khác.

## Giới hạn nền tảng

Web chưa có Auth/session nên không thêm đăng nhập/đăng xuất hay backend mới. Trình duyệt quản lý file tải; lịch sử không được gắn nhãn đã hoàn tất. Không có API để đọc SSID/RSSI/IP LAN hoặc ICMP; giữ Online/kết nối trình duyệt/IP Public/API RTT đúng ý nghĩa. Android foreground downloader/finishAffinity/update APK không được port. Hình header có chữ Việt theo asset gốc; tùy chọn EN dịch nhãn điều khiển, không sửa chữ trong ảnh.

Ngân hàng local hiện có 16 câu/4 chủ đề, giống Android; nếu offline mỗi chủ đề chỉ có 4 câu, engine giữ giới hạn dữ liệu thật. 20/30 được kiểm với fixture riêng đủ câu, không bổ sung câu giả vào production.

**Toolkit tiếp tục bị loại bỏ hoàn toàn** khỏi menu, route, runtime, icon, asset, manifest và cache. Không có toolkit.js/OUI; verifier chặn regression.

## Kiểm tra và triển khai

```sh
npm test
npm run build
```

Không có lint/TypeScript script vì dự án là JS thuần. `npm test` kiểm cú pháp, asset, PWA, icon, version và regression chạy thật về mapping/facet/slide/download. GitHub Pages build có thể refresh snapshot Tin tức thật từ Apps Script. Workflow không tạo ZIP source. Mốc backup/rollback: `backup/web-2809264-before-02102026-20261002`.
