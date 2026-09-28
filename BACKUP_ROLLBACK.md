# Backup & Rollback — HLU TOOLS Web 280926

## Backup trước khi thay

Đã tạo trên GitHub trước khi dựng Web 280926:

1. `backup/web-before-280926-20260928`
   - Snapshot trạng thái `main` trước đợt dựng 280926.
   - Commit gốc: `cc44ab6a39c3872409bc5d19f13f658bb1024728`.

2. `backup/web-2209265-pre-archive`
   - Snapshot Web App đầy đủ 220926.5 trước khi chuyển sang trang archive.
   - Commit gốc: `7ed1f21182fd6cf21a1bf777edcf0d9ffa7c720a`.

Không branch nào chứa/thay đổi source Android.

## Tự bảo vệ khi deploy

- `npm test` và `npm run build` là gate bắt buộc trước upload Pages.
- Pull Request không deploy.
- Sau merge vào `main`, workflow deploy Web mới và chạy smoke test production.
- Smoke test yêu cầu production có marker `data-web-version="280926"` và không có route/script Toolkit.
- Nếu smoke test thất bại, workflow tự checkout `backup/web-2209265-pre-archive`, verify/build và deploy artifact backup để khôi phục Web App cũ.

## Rollback thủ công

Cách an toàn nhất nếu muốn quay lại 220926.5:

```bash
git checkout main
git pull
git checkout -b rollback/web-2209265
git restore --source backup/web-2209265-pre-archive -- .
git commit -m "Rollback Web to 220926.5 backup"
git push -u origin rollback/web-2209265
```

Sau đó mở Pull Request vào `main`. Không force-push `main`.

Nếu chỉ muốn quay lại trạng thái trang archive trước đợt dựng 280926, dùng branch `backup/web-before-280926-20260928` thay cho `backup/web-2209265-pre-archive`.
