# HLU TOOLS – Web/PWA

**Phiên bản Web: 280926.4** · dựng theo full source Android `HLU_TOOLS_VERSION_280926_FULL_SOURCE.zip`.

Production: **https://hlutools.github.io/hlu/**

## 280926.4 — sửa Tin tức, phân loại và action card

- Sửa lỗi JavaScript `Array.map(normalize)`: callback của `map` truyền mảng nguồn vào tham số thứ 3, làm tham số `forced` bị hiểu nhầm là category và khiến `soft`, `firmware`, `news` rơi về `docs`. Tất cả luồng normalize API/cache/fallback nay truyền rõ `(row, index)` và `normalize()` chỉ chấp nhận forced section khi là chuỗi.
- Nhờ sửa normalize, Tin tức từ API/snapshot được giữ đúng `section=news` và hiển thị ở Trang chủ ngay từ lần render đầu; Soft/Firmware trở về đúng khối.
- Các card trong màn Soft/Tài liệu/Firmware dùng đúng cụm action Android: Yêu thích + Download xếp dọc bên phải; Download chỉ bật khi có `downloadUrl` hợp lệ.
- Giữ nguyên các module khác và tiếp tục loại Network Toolkit khỏi Web.

## 280926.2 — đồng bộ UI Android và Tin tức

- Bottom Navigation dùng icon vector Home / Search / BookmarkBorder / Download đúng với Android 280926.
- Màn Tài nguyên: mỗi bài có cụm Favorite + Download; Download bị vô hiệu hóa khi bài chưa có link tải.
- Cài đặt > Giới thiệu: đồng bộ bố cục Android gồm thông tin app, Giới thiệu, Kiểm tra cập nhật, Nhật ký phiên bản, Facebook, Zalo, Điện thoại, Góp ý và Đơn vị phát triển; dùng icon/tài nguyên tương ứng Android.
- E-Learning: hàng Thi thử dùng icon Timer đúng Android.
- Tin tức: snapshot cùng-origin được nạp trước lần render đầu tiên và luôn được merge theo ID với dữ liệu API/cache; API vẫn ưu tiên khi có cùng ID.
- Giữ Network Toolkit ngoài phạm vi Web.

## 280926.1 — sửa UI và Tin tức

- Tạo lại icon chuông Header theo vector chuông 24dp của Android 280926; badge thông báo giữ riêng, không bake vào header.
- Chuẩn hóa icon Menu trái theo đúng chức năng.
- Đồng bộ màn Cài đặt theo cấu trúc 5 nhóm của Android: Tài khoản & hồ sơ, Giao diện, Ngôn ngữ, Đồng bộ dữ liệu, Giới thiệu.
- Xóa khỏi footer Menu trái các dòng “Đồng hành cùng VNPT / vì một kết nối tốt đẹp hơn / Version 280926”; giữ `Developed by Cường VNPT`.
- Tin tức: Apps Script vẫn là nguồn chính; thêm `assets/data/news_fallback.json` cùng-origin để Safari/Web có dữ liệu dự phòng khi API bị CORS/redirect/network chặn. GitHub Pages build refresh snapshot này best-effort bằng `HLU_SYNC_NEWS=1`.


## Phạm vi đồng bộ 280926

- Giữ cấu trúc nội dung của Android 280926: Trang chủ, Tin tức, Soft, Tài liệu, Firmware, E‑Learning, Tìm kiếm, Đã lưu, Download, Thông báo, Cài đặt, Giới thiệu và Tài nguyên.
- Dùng đúng bộ header Android 280926 cho từng mục; bài viết/trình xem dùng header theo Section, riêng bài mở từ Tin tức giữ header Tin tức.
- Tin tức dùng `sourceSection` + `sourceId` để mở tài nguyên gốc khi API cung cấp mapping.
- Tìm kiếm hiển thị tối đa 6 từ khóa phổ biến (2 dòng × 3), có lịch sử/gợi ý và Web Speech API khi trình duyệt hỗ trợ.
- E‑Learning giữ schema 3, `multi_choice`, `true_false`, cấu hình thi 20/30 câu, thời lượng theo chủ đề, online → IndexedDB → local fallback.
- Saved, Download history, Notification, Feedback, Analytics và Google Drive image recovery được giữ lại theo cơ chế Web/PWA hiện có.

## Network Toolkit

**Network Toolkit không được đưa vào Web App 280926.**

Web đã xóa/không deploy:
- màn hình Toolkit và màn hình từng tool;
- route `toolkit` / `toolkit/{tool}`;
- mục Network Toolkit trong Drawer;
- nút Toolkit ở Bottom Navigation;
- khối Công cụ mạng trên Trang chủ;
- `assets/toolkit.js` và dữ liệu OUI dành riêng cho Toolkit;
- shortcut PWA Toolkit.

Phiên bản Android **không thay đổi** và vẫn giữ Network Toolkit native.

## Khác biệt nền tảng Web

Một số API Android không có tương đương an toàn trên trình duyệt. Khung **Tình trạng kết nối** trên Web chỉ hiển thị dữ liệu trình duyệt có thể lấy hợp lệ: online/offline, loại kết nối khi browser cung cấp, Public IP best-effort và API RTT. Download được giao cho trình duyệt quản lý file; app lưu lịch sử thao tác tải.

## Build

Node.js 22+:

```bash
npm test
npm run build
```

`dist/` là nội dung deploy GitHub Pages.

## Backup / rollback

Xem `BACKUP_ROLLBACK.md`.

Các mốc backup trước khi thay Web 280926:
- `backup/web-2809262-before-fix-20260928`: Web 280926.2 ngay trước bản sửa 280926.4.
- `backup/web-2809261-before-fix-20260928`: Web 280926.1 ngay trước bản sửa 280926.2.
- `backup/web-before-280926-20260928`: trạng thái `main` ngay trước đợt dựng này.
- `backup/web-2209265-pre-archive`: Web App 220926.5 đầy đủ trước khi từng chuyển sang trang archive.

Workflow deploy chỉ chạy Pages sau khi Verify/Build pass. Sau deploy có smoke test; nếu smoke test thất bại, workflow tự deploy lại backup `backup/web-2809262-before-fix-20260928` cho release 280926.4.