# Hướng dẫn Migrations

## Tổng quan

Migrations này bổ sung các tính năng mới cho hệ thống:

### Migrations được tạo:

1. **AddReferredByToUsers** - Thêm cột `referred_by_id` vào bảng `users` để hỗ trợ hệ thống giới thiệu
2. **CreatePaymentsTable** - Tạo bảng `payments` để quản lý thanh toán (PayOS, ngân hàng)
3. **CreateReferralCodesTable** - Tạo bảng `referral_codes` để quản lý mã giới thiệu
4. **CreateCommissionSettingsTable** - Tạo bảng `commission_settings` để cấu hình % hoa hồng
5. **CreateCommissionsTable** - Tạo bảng `commissions` để theo dõi hoa hồng F1, F2, F3

## Cấu trúc bảng mới

### 1. Bảng `payments`
Quản lý tất cả các giao dịch thanh toán:
- Hỗ trợ PayOS và chuyển khoản ngân hàng
- Trạng thái: pending, processing, completed, failed, cancelled
- Lưu trữ thông tin webhook từ PayOS
- Liên kết với `users` và `user_subscriptions`

### 2. Bảng `referral_codes`
Quản lý mã giới thiệu của từng user:
- Mỗi user có thể có nhiều mã giới thiệu
- Theo dõi tổng số lượt giới thiệu và tổng hoa hồng
- Có thể bật/tắt từng mã

### 3. Bảng `commission_settings`
Cài đặt % hoa hồng cho hệ thống:
- Mặc định: F1=10%, F2=3.5%, F3=1.5% (tổng 15%)
- Có thể tạo nhiều cấu hình khác nhau
- Cấu hình linh hoạt cho từng cấp độ

### 4. Bảng `commissions`
Theo dõi từng khoản hoa hồng:
- Ghi nhận user nhận hoa hồng và user thực hiện mua hàng
- Theo dõi cấp độ (tier 1, 2, 3...)
- Trạng thái: pending, approved, paid, cancelled
- Liên kết với `payments` gốc

### 5. Cột mới trong bảng `users`
- `referred_by_id`: ID của user đã giới thiệu (nullable)

## Chạy Migrations

### 1. Kiểm tra cấu hình database

Đảm bảo file `.env` có đầy đủ thông tin:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=iqx
```

### 2. Chạy migrations

```bash
cd api
npm run migration:run
```

### 3. Kiểm tra kết quả

Migrations sẽ chạy theo thứ tự:
1. ✅ AddReferredByToUsers1727950000001
2. ✅ CreatePaymentsTable1727950000002
3. ✅ CreateReferralCodesTable1727950000003
4. ✅ CreateCommissionSettingsTable1727950000004 (bao gồm insert dữ liệu mặc định)
5. ✅ CreateCommissionsTable1727950000005

### 4. Rollback (nếu cần)

Để rollback migration cuối cùng:

```bash
npm run migration:revert
```

## Dữ liệu mẫu

Migration `CreateCommissionSettingsTable` sẽ tự động insert cài đặt hoa hồng mặc định:

- **Name**: default
- **Description**: Cài đặt hoa hồng mặc định: F1=10%, F2=3.5%, F3=1.5%
- **Total**: 15%
- **Tiers**: [10%, 3.5%, 1.5%]
- **Status**: Active

## Kiểm tra sau khi migrate

Chạy các câu lệnh SQL sau để kiểm tra:

```sql
-- Kiểm tra các bảng mới
SHOW TABLES LIKE 'payments';
SHOW TABLES LIKE 'referral_codes';
SHOW TABLES LIKE 'commissions';
SHOW TABLES LIKE 'commission_settings';

-- Kiểm tra cột mới trong users
DESCRIBE users;

-- Kiểm tra dữ liệu mặc định commission_settings
SELECT * FROM commission_settings;

-- Kiểm tra các foreign keys
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = 'iqx'
    AND TABLE_NAME IN ('payments', 'referral_codes', 'commissions')
    AND REFERENCED_TABLE_NAME IS NOT NULL;
```

## Lưu ý quan trọng

1. **Backup database trước khi chạy migrations**
   ```bash
   mysqldump -u root -p iqx > backup_before_migration.sql
   ```

2. **Chạy trên môi trường staging trước**

3. **Kiểm tra dependencies**:
   - Bảng `users` phải tồn tại
   - Bảng `user_subscriptions` phải tồn tại
   - Bảng `payments` phải được tạo trước `commissions`

4. **Performance**: 
   - Các bảng đã có indexes phù hợp
   - Foreign keys đã được cấu hình đúng

## Troubleshooting

### Lỗi: Table already exists
Nếu một số bảng đã tồn tại, bạn có thể:
1. Xóa bảng thủ công (cẩn thận với data)
2. Hoặc comment out migration đó trong code

### Lỗi: Foreign key constraint fails
Đảm bảo:
1. Bảng `users` và `user_subscriptions` đã tồn tại
2. Không có dữ liệu orphan
3. Chạy migrations theo đúng thứ tự

### Lỗi: Cannot connect to database
Kiểm tra:
1. MySQL service đang chạy
2. Thông tin trong `.env` đúng
3. User có quyền CREATE TABLE

## Các API endpoints liên quan

Sau khi migrate xong, các endpoints sau sẽ hoạt động:

### Payment APIs
- `POST /api/payment/create-payment-link` - Tạo link thanh toán
- `POST /api/payment/webhook` - Webhook từ PayOS
- `GET /api/payment/my-payments` - Lịch sử thanh toán

### Referral APIs
- `GET /api/referral/my-code` - Lấy mã giới thiệu
- `POST /api/referral/use-code` - Sử dụng mã giới thiệu
- `GET /api/referral/my-referrals` - Danh sách người được giới thiệu
- `GET /api/referral/my-commissions` - Lịch sử hoa hồng

### Admin Commission APIs
- `GET /api/admin/commissions` - Danh sách tất cả hoa hồng
- `PUT /api/admin/commissions/:id/approve` - Duyệt hoa hồng
- `PUT /api/admin/commissions/:id/pay` - Đánh dấu đã thanh toán
- `GET /api/admin/commission-settings` - Cài đặt hoa hồng

## Liên hệ

Nếu có vấn đề, hãy kiểm tra:
1. Logs trong console
2. MySQL error logs
3. File `data-source.ts` cấu hình đúng

