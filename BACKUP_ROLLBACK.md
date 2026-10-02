# Backup / rollback Web 02102026

Baseline Web đã kiểm tra: **280926.4**, commit `d428d623eeaeb5b68b1259a95dcf3623a9c8a0bd` trên repo `hlutools/hlu`.

Branch bổ sung: `sync/web-02102026-complete-parity`.
Backup `backup/web-2809264-before-02102026-20261002` trên GitHub trỏ baseline trên.

Người dùng đã cho phép đẩy branch, tạo PR và merge/deploy sau CI PASS. Trước lần cập nhật này, main đã có PR #8 tại `83cdd6361f119284da07e61458e52c42db1553dd`, đã PASS build/deploy/smoke nhưng khác bản bàn giao về header, avatar, lịch sử Android và tùy chọn hiển thị.

Workflow dùng `ROLLBACK_REF` là SHA PR #8 để phục hồi production ngay trước lần cập nhật bổ sung. Quy trình Verify → Build → Deploy → Smoke; chỉ rollback nếu smoke thất bại. Không force-push `main`.

Để áp bản sửa từ diff bàn giao vào checkout sạch đúng baseline:

```bash
 git switch -c sync-android-02102026-no-toolkit d428d623eeaeb5b68b1259a95dcf3623a9c8a0bd
 git apply --binary HLU_TOOLS_WEB_02102026.diff
 npm test
 npm run build
```

Không tạo ZIP source trong lần cập nhật này; workflow cũng không tự tạo source ZIP khi PR chạy.
