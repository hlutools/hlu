# Lessons Learned — HLU TOOLS Web App

Dự án Web/PWA được dừng ngày **23/09/2026** sau khi đồng bộ đến phiên bản **220926.5**.

## 1. Các giới hạn kỹ thuật quan trọng trên Web/iOS

### Network Toolkit không thể tương đương Android

Trình duyệt Web, đặc biệt Safari/iOS, chủ động giới hạn truy cập mạng mức thấp vì lý do bảo mật và quyền riêng tư. Những chức năng sau không thể triển khai đáng tin cậy như native Android:

- **WiFi Analyzer:** không thể quét AP lân cận, kênh, RSSI, BSSID đầy đủ.
- **LAN Scan:** không thể chủ động quét dải IP nội bộ bằng socket/ARP như native.
- **ICMP Ping:** JavaScript trình duyệt không gửi ICMP echo trực tiếp.
- **Traceroute:** không có quyền raw socket/TTL tương đương native.
- **TCP Port Check:** không được mở TCP socket tùy ý tới host/port.
- **Wi‑Fi Info:** không thể đọc ổn định SSID, BSSID, RSSI, channel, gateway, DNS và interface nội bộ.
- **Speed Test:** có thể làm bằng HTTP/fetch nhưng phụ thuộc CORS, server và chính sách trình duyệt; kết quả không tương đương native trong mọi môi trường.
- **Loại kết nối:** Network Information API không được Safari/iOS hỗ trợ đầy đủ và không nên dùng làm dữ liệu nghiệp vụ quan trọng.

### Tình trạng kết nối

`navigator.onLine` chỉ phản ánh trạng thái kết nối mạng theo cách trình duyệt hiểu, không chứng minh Internet/API thực sự truy cập được. Public IP cần dịch vụ HTTPS bên ngoài. ISP, gateway, DNS, Wi‑Fi RSSI và loại kết nối chi tiết không thể lấy ổn định trên iOS Safari.

## 2. Phần Web làm tốt

Các nhóm sau phù hợp với Web/PWA và có thể tái sử dụng nếu dự án được khởi động lại:

- Tra cứu nội dung/tài nguyên từ API HTTPS.
- Tin tức, tìm kiếm, Saved, Download history.
- E‑Learning với `IndexedDB` + dữ liệu online/local.
- Subnet Calculator thuần JavaScript.
- Public IP qua dịch vụ HTTPS khi CORS cho phép.
- PWA/offline cho nội dung tĩnh và cache dữ liệu phù hợp.

## 3. Bài học kiến trúc

- Không cố mô phỏng API native bằng Web khi trình duyệt không cung cấp primitive tương đương; kết quả dễ gây hiểu nhầm.
- Tách rõ **logic nghiệp vụ** và **platform capability** ngay từ đầu.
- Mỗi tính năng nên có capability check thực tế thay vì chỉ dựa vào User-Agent.
- Dữ liệu chính nên đi qua một API HTTPS ổn định và có CORS rõ ràng.
- Không phụ thuộc endpoint bên thứ ba không có SLA/CORS ổn định cho tính năng cốt lõi.
- Với PWA, cần version hóa Service Worker và có chiến lược xóa cache cũ khi dừng/chuyển trạng thái dự án.

## 4. Nếu làm lại trong tương lai

Nếu nhu cầu iOS quay lại, ưu tiên một trong các hướng:

1. **Ứng dụng iOS native (Swift/SwiftUI)** cho Network Toolkit.
2. **Flutter/React Native** nếu cần chia sẻ UI/business logic nhưng vẫn dùng native networking plugin.
3. Web chỉ giữ vai trò **portal nội dung/E‑Learning**, không định vị là công cụ chẩn đoán mạng tương đương Android.
4. Nếu cần công cụ mạng qua Web, xây **backend/agent trung gian** thực hiện phép đo ở server hoặc thiết bị được ủy quyền; UI Web chỉ hiển thị kết quả. Cần đánh giá kỹ quyền riêng tư, bảo mật và mô hình triển khai.

## 5. Mốc cuối

- Phiên bản Web cuối: `220926.5`
- Commit source ngay trước archive: `7ed1f21182fd6cf21a1bf777edcf0d9ffa7c720a`
- Source runtime gốc cần để khôi phục được giữ tại `archive/original-final-220926.5/`.