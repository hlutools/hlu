# HLU TOOLS – GitHub Pages / 150926.3

Bản Web App/PWA của HLU TOOLS được đồng bộ theo **Android Version 150926.3** để hai nền tảng giống nhau tối đa về giao diện, điều hướng và trạng thái dữ liệu.

Địa chỉ phát hành: https://hlutools.github.io/hlu/

## Đồng bộ theo Android 150926.3

- Giữ nguyên bộ ảnh giao diện Android: Header Trang chủ, Drawer, 3 card SOFT/Tài liệu/Firmware và các header Tìm kiếm/Thông báo/Đã lưu/Download.
- Drawer đúng thứ tự: **Trang chủ → Tin tức → Soft → Tài liệu → Firmware → Đã lưu → Download → Cài đặt**.
- Bottom navigation: **Trang chủ · Tìm kiếm · Thông báo · Đã lưu · Download**.
- Tin tức có badge **Mới** độc lập với trạng thái đã đọc của Notification. Badge chỉ mất khi người dùng thật sự mở chi tiết bài tin.
- “Đọc hết” Notification không làm mất badge **Mới** của Tin tức.
- Trang Tin tức ưu tiên nội dung chưa đọc, có banner số bài mới và giao diện card tương ứng Android.
- Danh mục SOFT/Tài liệu/Firmware dùng card, tìm kiếm và bộ lọc hãng (Tài liệu/Firmware) gần với Android.
- Tìm kiếm khi chưa nhập từ khóa hiển thị toàn bộ nội dung như Android.
- Chi tiết nội dung dùng màn hình riêng, hỗ trợ mô tả, ghi chú, ảnh, metadata, tải xuống và xem nội dung.
- Lịch sử Download lưu theo tên nội dung như Android.
- Cài đặt chia nhóm **DỮ LIỆU / HỖ TRỢ / LIÊN HỆ / THÔNG TIN**, có Facebook, Zalo, điện thoại, đơn vị và phiên bản 150926.3.
- Có màn **Góp ý cho nhà phát triển**, POST dữ liệu về Apps Script với action `feedback`.
- Đồng bộ dữ liệu xóa cache dữ liệu rồi tải lại từ máy chủ.
- Web/PWA vẫn giữ cache ngoại tuyến, Service Worker và khả năng cài lên màn hình chính.

## Khác biệt bắt buộc do nền tảng Web

Một số chức năng hệ điều hành Android (DownloadManager, WorkManager và quyền notification nền) không thể giống 1:1 trên trình duyệt. Web giữ hành vi người dùng tương đương trong giới hạn PWA: lịch sử tải, tự đồng bộ khi đang mở/online, cache offline và Web Notification khi trình duyệt đã cấp quyền.

## Google Apps Script

URL API được khai báo tại `assets/config.js`:

`https://script.google.com/macros/s/AKfycbzwUuTpjfE57a5IBFdOpomOuMPvBQySGWr4VPptnoTxEa-ubuO8-YGczIM-mzBeM0ND/exec`

Web hỗ trợ đầy đủ các trường chính của bản Android: `id`, `section`, `title`, `brand`, `model`, `version`, `size`, `description`, `viewUrl`, `downloadUrl`, `resolvedViewUrl`, `resolvedDownloadUrl`, `fileType`, `visible`, `sortOrder`, `createdAt`, `updatedAt`, `iconUrl`, `imageUrl`, `note`.

## Phát hành GitHub Pages

Repository: `hlutools/hlu`, base path cố định `/hlu/`.

1. Push lên `main`.
2. GitHub Actions chạy Verify/Build và deploy Pages.
3. Khi Service Worker cũ còn cache, tải lại trang hoặc đóng/mở lại PWA để nhận cache `150926.3`.

## Kiểm tra cục bộ

Yêu cầu Node.js 22 trở lên:

```bash
npm test
npm run build
```

Mỗi workflow thành công tạo bản tĩnh trong `dist/` để deploy lên GitHub Pages.
