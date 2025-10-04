# 🚀 Quick Start - Chạy Migrations

## Cách nhanh nhất (Recommended)

```bash
cd api
./run-migrations.sh full
```

Script sẽ tự động:
1. ✅ Kiểm tra kết nối database
2. ✅ Backup database trước khi chạy
3. ✅ Chạy tất cả migrations pending
4. ✅ Hiển thị kết quả

## Hoặc chạy thủ công

```bash
cd api

# 1. Backup database (tùy chọn nhưng khuyến khích)
mysqldump -u root -p iqx > backup_before_migration.sql

# 2. Chạy migrations
npm run migration:run

# 3. Kiểm tra kết quả
npm run typeorm -- migration:show
```

## Các bảng sẽ được tạo

✅ **payments** - Quản lý thanh toán (PayOS, ngân hàng)  
✅ **referral_codes** - Mã giới thiệu  
✅ **commissions** - Hoa hồng F1, F2, F3  
✅ **commission_settings** - Cài đặt % hoa hồng  
✅ **users.referred_by_id** - Cột mới trong bảng users  

## Kiểm tra nhanh

```sql
-- Kiểm tra bảng đã tạo chưa
SHOW TABLES LIKE '%commission%';
SHOW TABLES LIKE 'payments';
SHOW TABLES LIKE 'referral_codes';

-- Xem cài đặt hoa hồng mặc định
SELECT * FROM commission_settings;
```

## Rollback nếu có lỗi

```bash
npm run migration:revert
```

## Cần trợ giúp?

Xem file `MIGRATIONS.md` để biết chi tiết đầy đủ.

## Troubleshooting thường gặp

### ❌ Cannot connect to database
- Kiểm tra MySQL đang chạy: `mysql -u root -p`
- Kiểm tra file `.env` có đúng thông tin không

### ❌ Table already exists
- Có thể database đã có bảng đó rồi
- Chạy: `npm run typeorm -- migration:show` để xem status

### ❌ Foreign key constraint
- Đảm bảo bảng `users` và `user_subscriptions` đã tồn tại
- Chạy migrations theo đúng thứ tự (script đã handle)

---

**🎉 Sau khi migrate xong, tất cả API về Payment, Referral và Commission sẽ hoạt động!**

