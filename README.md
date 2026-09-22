# HLU TOOLS – Web/PWA

Web App/PWA triển khai tại **https://hlutools.github.io/hlu/**, đồng bộ theo source Android **220926.5**.

## Nguồn chuẩn

- Android: `HLU_TOOLS_VERSION_220926.5_FULL.zip` (`com.vnpt.nbh.tools`).
- Web: repository `hlutools/hlu`, base path cố định `/hlu/`.
- API: Google Apps Script dùng chung với Android, cấu hình tại `assets/config.js`.

## Đồng bộ Android 220926.5

- Design System mới: màu HLU, Header 60dp tương đương, Drawer phân nhóm và Bottom Navigation 5 mục.
- Bottom Navigation: **Trang chủ · Tìm kiếm · Toolkit · Đã lưu · Download**.
- Thông báo chuyển lên biểu tượng chuông ở Header Trang chủ.
- Home mới: Tình trạng kết nối, Công cụ mạng, Tài nguyên 2×2, Tin tức.
- Tài nguyên: SOFT, Tài liệu, Firmware, E-Learning + danh sách mới cập nhật.
- Network Toolkit đủ 10 card theo Android.
- E-Learning: ngân hàng online → IndexedDB → local fallback, schema 3, `multi_choice`, `true_false`, đề 20/30 câu, thời gian riêng theo chủ đề, tự nộp khi hết giờ, lịch sử kết quả local.
- Tin tức giữ badge **Mới** độc lập trạng thái Notification; chỉ bỏ Mới khi mở bài.
- Giữ Saved, Download history, Feedback, Google Drive image recovery, cache/offline PWA và analytics best-effort.
- Drawer: Tổng quan / Tài nguyên / Công cụ / Hệ thống, footer `Developed by Cường VNPT`.

## Chuyển lớp nền tảng Android → Web

| Android | Web/PWA |
|---|---|
| SharedPreferences | `localStorage` |
| AtomicFile exam cache | `IndexedDB` |
| assets/exam_bank.json | `assets/data/exam_bank.json` |
| DownloadManager | trình duyệt tải link + lịch sử local |
| NotificationManager | Web Notification API khi được cấp quyền |
| Activity/NavHost | query-string SPA routing (`?view=...`) |
| WorkManager | refresh khi app mở/online + chu kỳ 60 giây khi trang đang hoạt động |

### Giới hạn Network Toolkit trên Web

Trình duyệt không cho Web App quét Wi‑Fi/LAN, gửi ICMP/traceroute hay mở TCP socket tùy ý. Vì vậy UI vẫn giữ đúng 10 công cụ, nhưng các công cụ native-only hiển thị thông báo yêu cầu HLU TOOLS Android thay vì giả lập dữ liệu.

Web thực thi được:
- Subnet Calculator.
- MAC Vendor lookup theo OUI local (nếu CSDL OUI có dữ liệu).
- Public IP qua HTTPS.
- LibreSpeed thử nghiệm khi máy chủ cho phép CORS.

## Build

Yêu cầu Node.js 22+:

```bash
npm test
npm run build
```

`dist/` là nội dung deploy GitHub Pages.

## Deploy

Workflow `.github/workflows/pages.yml` chạy khi push/merge vào `main`:
1. Verify source và asset.
2. Build static site.
3. Upload artifact.
4. Deploy GitHub Pages.

Không đổi base path `/hlu/` khi repository vẫn mang tên `hlu`.
