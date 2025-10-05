# Hướng dẫn Setup Admin User

## 1. Tạo Admin User đầu tiên

Để sử dụng các API quản lý users, bạn cần ít nhất một tài khoản admin.

### Phương án 1: Sử dụng Script tự động

```bash
# Chạy script tạo admin
npx ts-node src/admin/scripts/create-first-admin.ts
```

Script sẽ yêu cầu bạn nhập:
- Email
- Password
- Display Name (optional)
- Full Name (optional)

Script cũng có thể:
- Nâng cấp user hiện có lên admin
- Kiểm tra admin đã tồn tại trong hệ thống

### Phương án 2: Update trực tiếp Database

Nếu bạn đã có user trong hệ thống, bạn có thể update trực tiếp trong MySQL:

```sql
-- Update user hiện có thành admin
UPDATE users 
SET role = 'admin', is_active = 1
WHERE email = 'your-email@example.com';
```

### Phương án 3: Sử dụng API Register với code sửa tạm

**⚠️ Lưu ý:** Chỉ dùng phương án này trong môi trường development

1. Tạm thời sửa `auth.service.ts` để set role = admin khi register:

```typescript
// Trong hàm register(), thêm role khi tạo user
const user = this.userRepository.create({
  email,
  passwordHash,
  displayName,
  fullName,
  phoneE164,
  referredById: referrerId,
  role: 'admin', // ← Thêm dòng này
});
```

2. Gọi API register:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourSecurePassword123!",
    "displayName": "Admin User"
  }'
```

3. **Quan trọng:** Xóa code vừa thêm và restart server

## 2. Đăng nhập và lấy JWT Token

Sau khi có admin user, đăng nhập để lấy JWT token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourSecurePassword123!"
  }'
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin",
    ...
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "abc123...",
  "message": "Đăng nhập thành công"
}
```

Lưu lại `accessToken` để sử dụng cho các API admin.

## 3. Kiểm tra quyền Admin

Test API admin bằng cách lấy thống kê users:

```bash
curl -X GET http://localhost:3000/api/admin/users/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Nếu thành công, bạn sẽ nhận được thống kê users:
```json
{
  "totalUsers": 1,
  "activeUsers": 1,
  "inactiveUsers": 0,
  "premiumUsers": 0,
  "adminUsers": 1,
  "newUsersThisMonth": 1
}
```

Nếu nhận được lỗi 403 "Chỉ admin mới có quyền truy cập", kiểm tra lại:
- User có role = 'admin' không?
- Token có hợp lệ không?
- Token có bị expired không? (Mặc định 15 phút)

## 4. Tạo thêm Admin Users

Sau khi có admin user đầu tiên, bạn có thể:

### Cách 1: Update role của user hiện có

```bash
curl -X PATCH http://localhost:3000/api/admin/users/USER_ID/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

### Cách 2: Register user mới, sau đó update role

1. User mới register thông thường (role = member)
2. Admin update role lên admin như trên

## 5. Bảo mật Admin Account

### Best Practices:

1. **Mật khẩu mạnh:** Ít nhất 12 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt

2. **Giới hạn số lượng admin:** Chỉ tạo admin cho những người thực sự cần

3. **Audit logs:** Tất cả hành động admin đều được ghi log, định kỳ kiểm tra:
   ```sql
   SELECT * FROM audit_logs 
   WHERE action LIKE 'admin.%' 
   ORDER BY created_at DESC 
   LIMIT 100;
   ```

4. **Không chia sẻ JWT token:** Token nên được giữ bí mật và chỉ sử dụng qua HTTPS

5. **Thường xuyên đổi mật khẩu:** Sử dụng API forgot password hoặc reset password

6. **Không hardcode admin credentials:** Trong production, sử dụng biến môi trường

## 6. Troubleshooting

### Lỗi: "Chỉ admin mới có quyền truy cập"

**Giải pháp:**
1. Kiểm tra role trong database:
   ```sql
   SELECT id, email, role, is_active FROM users WHERE email = 'your-email@example.com';
   ```

2. Verify JWT payload bằng cách decode token tại jwt.io

3. Kiểm tra guard đã được áp dụng đúng trong controller

### Lỗi: "Không có quyền truy cập"

**Giải pháp:**
1. Token có thể bị expired, login lại để lấy token mới
2. Kiểm tra header Authorization có format đúng: `Bearer <token>`
3. Kiểm tra JWT_SECRET trong .env khớp với lúc tạo token

### Token hết hạn quá nhanh

**Giải pháp:**
Tăng thời gian expire trong `.env`:
```
JWT_EXPIRES_IN=1h  # Thay vì 15m
```

Hoặc sử dụng refresh token để lấy access token mới:
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## 7. Production Setup

Trong production, nên:

1. **Sử dụng HTTPS** cho tất cả API calls
2. **Set JWT_SECRET mạnh** trong environment variables
3. **Giảm JWT_EXPIRES_IN** xuống 15m hoặc ít hơn
4. **Enable rate limiting** cho các API admin
5. **Setup monitoring** cho audit logs
6. **Backup database** thường xuyên
7. **Sử dụng separate admin domain** nếu có thể (admin.yourdomain.com)

---

**Next steps:** Xem [USER_MANAGEMENT_API.md](./USER_MANAGEMENT_API.md) để biết chi tiết về các API có sẵn.

