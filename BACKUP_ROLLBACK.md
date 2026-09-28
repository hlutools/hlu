# Backup & Rollback — HLU TOOLS Web 280926.3

## Backup trước khi thay

Đã tạo trên GitHub trước khi dựng Web 280926:

1. `backup/web-before-280926-20260928`
   - Snapshot trạng thái `main` trước đợt dựng 280926.
   - Commit gốc: `cc44ab6a39c3872409bc5d19f13f658bb1024728`.

2. `backup/web-2209265-pre-archive`
   - Snapshot Web App đầy đủ 220926.5 trước khi chuyển sang trang archive.
   - Commit gốc: `7ed1f21182fd6cf21a1bf777edcf0d9ffa7c720a`.


3. `backup/web-2809261-before-fix-20260928`
   - Snapshot Web 280926.1 ngay trước đợt sửa 280926.2.
   - Commit gốc: `d89e5c3906392128704542ddafa71bfda08bbbaf`.

4. `backup/web-2809262-before-fix-20260928`
   - Snapshot Web 280926.2 ngay trước đợt sửa 280926.3.
   - Commit gốc: `21da0bdfbad1cc5800e9bb639cdb58af0fbe233f`.

Không branch nào chứa/thay đổi source Android.

## Tự bảo vệ khi deploy

- `npm test` và `npm run build` là gate bắt buộc trước upload Pages.
- Pull Request không deploy.
- Sau merge vào `main`, workflow deploy Web mới và chạy smoke test production.
- Smoke test yêu cầu production có marker `data-web-version="280926.3"`, không có route/script Toolkit và `assets/data/news_fallback.json` phải có dữ liệu `section=news`.
- Nếu smoke test thất bại, workflow tự checkout `backup/web-2809262-before-fix-20260928`, verify/build và deploy artifact backup để khôi phục đúng Web 280926.2 trước đợt sửa này.

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


## Rollback riêng bản 280926.2 → 280926.1

```bash
git checkout main
git pull
git checkout -b rollback/web-2809261
git restore --source backup/web-2809261-before-fix-20260928 -- .
git commit -m "Rollback Web to 280926.1 backup"
git push -u origin rollback/web-2809261
```

Sau đó mở Pull Request vào `main`; không force-push `main`.


## Rollback riêng bản 280926.3 → 280926.2

```bash
git checkout main
git pull
git checkout -b rollback/web-2809262
git restore --source backup/web-2809262-before-fix-20260928 -- .
git commit -m "Rollback Web to 280926.2 backup"
git push -u origin rollback/web-2809262
```
