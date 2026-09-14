# HLU TOOLS – GitHub Pages

Bộ source tĩnh Web App/PWA dùng giao diện ảnh gốc của bản Android 130926.

Địa chỉ phát hành: https://hlutools.github.io/hlu/

## Thành phần đã tích hợp

- Giao diện ngang và bộ header/drawer/card gốc Android 130926.
- Tìm kiếm toàn bộ dữ liệu và lọc theo danh mục/hãng.
- Lưu bài, thông báo nội dung mới và lịch sử download bằng bộ nhớ trên thiết bị.
- Xem nội dung ngay trong Web App và mở/tải liên kết ngoài.
- Đồng bộ Google Apps Script, có dữ liệu cache khi ngoại tuyến.
- PWA cho Android và iOS, manifest và service worker chạy dưới base path /hlu/.
- GitHub Actions tự kiểm tra, build, đóng gói source và deploy Pages.

## Phát hành trên GitHub Pages

1. Đặt toàn bộ file và thư mục của gói source tại thư mục gốc nhánh main của repository hlutools/hlu.
2. Mở Settings → Pages trên GitHub.
3. Trong Build and deployment, chọn Source là GitHub Actions.
4. Push lên main hoặc chạy workflow Build and deploy HLU TOOLS bằng nút Run workflow.
5. Chờ hai job Verify and package và Deploy GitHub Pages chuyển sang màu xanh.
6. Mở https://hlutools.github.io/hlu/ và tải lại trang nếu trình duyệt còn cache bản cũ.

Không đổi base path /hlu/ nếu repository vẫn có tên hlu.

## Cài trên iPhone/iPad

Mở địa chỉ bằng Safari, chạm Chia sẻ, chọn Thêm vào Màn hình chính, rồi chạm Thêm. Sau lần mở đầu tiên, các tài nguyên giao diện được lưu để có thể khởi động khi ngoại tuyến.

## Google Apps Script

URL Web App hiện dùng được khai báo trong assets/config.js:

https://script.google.com/macros/s/AKfycbzwUuTpjfE57a5IBFdOpomOuMPvBQySGWr4VPptnoTxEa-ubuO8-YGczIM-mzBeM0ND/exec

Ứng dụng nhận mảng JSON trực tiếp, các khóa data, items, result, rows, resources, hoặc các mảng nhóm news, soft, docs, firmware. Các trường tiếng Anh và một số tên trường tiếng Việt thông dụng đều được chuẩn hóa.

Các trường chính gồm: id, section, title, brand, model, version, size, description, viewUrl, downloadUrl, resolvedDownloadUrl, fileType, visible, sortOrder, updatedAt, iconUrl.

## Kiểm tra cục bộ

Yêu cầu Node.js 22 trở lên:

    npm test
    npm run build

Thư mục dist là nội dung tĩnh dùng để phát hành. Mỗi workflow thành công cũng tạo artifact tải xuống có tên HLU_TOOLS_GITHUB_PAGES_HLU.zip.
