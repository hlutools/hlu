# HLU TOOLS Web App — ARCHIVED

- **Tên dự án:** HLU TOOLS Web App
- **Trạng thái:** **DỪNG PHÁT TRIỂN / ARCHIVED**
- **Ngày dừng:** **23/09/2026**
- **Phiên bản Web cuối:** **220926.5**
- **Repository:** `hlutools/hlu`
- **Production:** `https://hlutools.github.io/hlu/`

## Lý do dừng

HLU TOOLS Web App được phát triển từ cấu trúc và logic của HLU TOOLS Android để hỗ trợ người dùng trên nền Web/PWA, đặc biệt là iOS. Tuy nhiên, chính sách bảo mật và sandbox của trình duyệt — đáng chú ý trên Safari/iOS — không cho Web App truy cập đầy đủ các API mạng mức thấp cần cho những chức năng kỹ thuật của HLU TOOLS.

Các giới hạn chính gồm quét Wi‑Fi/AP, đọc SSID/BSSID/RSSI/kênh và thông tin interface, quét LAN, ICMP Ping, Traceroute, TCP socket/Port Check, cùng một số phép đo tốc độ/phân loại kết nối phụ thuộc CORS hoặc API trình duyệt không ổn định giữa các nền tảng. Vì vậy Network Toolkit và khung Tình trạng kết nối không thể đạt độ chính xác/tính năng tương đương Android trên iOS/Web.

Tiếp tục duy trì hai nền tảng với mức chênh lệch chức năng như trên không còn hiệu quả, nên dự án Web được dừng và lưu trữ.

## Khuyến nghị

Vui lòng sử dụng **HLU TOOLS phiên bản Android** cho các chức năng kỹ thuật đầy đủ, đặc biệt là Network Toolkit.

## Chính sách lưu trữ

- Không xóa source code Web.
- Không xóa lịch sử Git.
- Source Web cuối vẫn được giữ để tham khảo hoặc khôi phục trong tương lai.
- Các file runtime trước khi chuyển production sang trang thông báo được lưu tại `archive/original-final-220926.5/`.
- Production GitHub Pages được giữ lại dưới dạng **trang thông báo dự án đã dừng**, không còn chạy Web App đầy đủ.
- Việc dừng/archiving repo Web **không áp dụng và không ảnh hưởng** đến dự án HLU TOOLS Android.

## Khôi phục về Web App cuối cùng

Nếu cần phục hồi:

1. Unarchive repository trên GitHub.
2. Khôi phục các file trong `archive/original-final-220926.5/` về đúng vị trí ở root repo.
3. Giữ nguyên các source module hiện có trong `assets/`.
4. Chạy `npm test` và `npm run build`.
5. Deploy lại GitHub Pages từ `main`.

Mốc source ứng dụng ngay trước khi archive là commit `7ed1f21182fd6cf21a1bf777edcf0d9ffa7c720a`.