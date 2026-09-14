# HLU TOOLS – GitHub Pages

Web App/PWA giao diện chuẩn Android 130926, phát hành tại:

https://hlutools.github.io/hlu/

## Dữ liệu Google Apps Script

Ứng dụng ưu tiên URL trong `localStorage.hlu_api_url`, sau đó dùng `HLU_CONFIG.API_URL` trong `assets/config.js`.
Đặt URL Web App Apps Script dạng `https://script.google.com/macros/s/.../exec` vào `API_URL` nếu muốn cấu hình cố định.

API hỗ trợ mảng JSON trực tiếp hoặc `{data:[...]}`, với các trường:
`id, section, title, brand, model, version, size, description, viewUrl, downloadUrl, fileType, visible, sortOrder, updatedAt, iconUrl, note`.

## Phát hành

Mỗi lần push lên nhánh `main`, workflow `Deploy HLU TOOLS to GitHub Pages` sẽ:

1. Kiểm tra đường dẫn base `/hlu/`, manifest, service worker và JavaScript.
2. Đóng gói artifact `HLU_TOOLS_GITHUB_PAGES_HLU.zip`.
3. Deploy thư mục nguồn lên GitHub Pages.

Trong Settings → Pages, chọn Source là **GitHub Actions** nếu GitHub chưa tự bật.
