# 🔧 Admin Module - Tổng quan

## 📌 Giới thiệu

Module Admin cung cấp đầy đủ công cụ để quản lý users và subscriptions trong hệ thống IQX.

## 🎯 Tính năng chính

### 1. Quản lý Users
- ✅ Xem danh sách users với phân trang
- ✅ Tìm kiếm users theo email, tên
- ✅ Lọc users theo role, trạng thái
- ✅ Xem chi tiết user & lịch sử
- ✅ Kích hoạt/Khóa users
- ✅ Cập nhật role users

### 2. Quản lý Subscriptions
- ✅ Gắn gói subscription cho users
- ✅ Xem danh sách subscriptions của user
- ✅ Gia hạn subscriptions
- ✅ Tạm dừng subscriptions
- ✅ Hủy subscriptions
- ✅ Cập nhật trạng thái & thời gian

### 3. Thống kê & Báo cáo
- ✅ Tổng số users
- ✅ Users đang active/inactive
- ✅ Users premium
- ✅ Users mới trong tháng
- ✅ Audit logs cho mọi hành động admin

## 📂 Cấu trúc Module

```
src/admin/
├── guards/
│   └── admin.guard.ts              # Bảo vệ API chỉ cho admin
├── dto/
│   └── user-management.dto.ts      # DTOs cho requests
├── scripts/
│   └── create-first-admin.ts       # Script tạo admin đầu tiên
├── user-management.controller.ts   # REST API endpoints
├── user-management.service.ts      # Business logic
└── admin.module.ts                 # Module configuration
```

## 🚀 Quick Start

### Bước 1: Tạo admin user đầu tiên

```bash
npx ts-node src/admin/scripts/create-first-admin.ts
```

### Bước 2: Login để lấy JWT token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

### Bước 3: Test API

```bash
curl -X GET http://localhost:3000/api/admin/users/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📡 API Endpoints

### User Management

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/users/stats` | Thống kê users |
| GET | `/api/admin/users` | Danh sách users |
| GET | `/api/admin/users/:id` | Chi tiết user |
| PATCH | `/api/admin/users/:id/activate` | Kích hoạt user |
| PATCH | `/api/admin/users/:id/deactivate` | Khóa user |
| PATCH | `/api/admin/users/:id/role` | Cập nhật role |

### Subscription Management

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/users/:id/subscriptions` | Danh sách subscriptions |
| POST | `/api/admin/users/:id/subscriptions` | Gắn subscription |
| PATCH | `/api/admin/users/:id/subscriptions/:subId` | Cập nhật subscription |
| DELETE | `/api/admin/users/:id/subscriptions/:subId` | Hủy subscription |

## 🔐 Bảo mật

### Guards
1. **JwtAuthGuard**: Kiểm tra JWT token hợp lệ
2. **AdminGuard**: Kiểm tra user có role = 'admin'

### Audit Logs
Mọi hành động admin đều được ghi log với:
- Thời gian thực hiện
- Admin thực hiện (user ID)
- IP address
- User agent
- Chi tiết hành động

### Actions được ghi log:
- `admin.user.activate` - Kích hoạt user
- `admin.user.deactivate` - Khóa user
- `admin.user.update_role` - Cập nhật role
- `admin.user.assign_subscription` - Gắn subscription
- `admin.user.update_subscription` - Cập nhật subscription
- `admin.user.cancel_subscription` - Hủy subscription

## 📖 Tài liệu chi tiết

| File | Nội dung |
|------|----------|
| [ADMIN_SETUP.md](./ADMIN_SETUP.md) | Hướng dẫn setup admin user |
| [USER_MANAGEMENT_API.md](./USER_MANAGEMENT_API.md) | API reference đầy đủ |
| [ADMIN_USE_CASES.md](./ADMIN_USE_CASES.md) | Use cases & workflows |
| [postman-admin-collection.json](./postman-admin-collection.json) | Postman collection |

## 💡 Use Cases phổ biến

### 1. Khóa user vi phạm
```bash
# Tìm user
GET /api/admin/users?search=violator@example.com

# Khóa user
PATCH /api/admin/users/{userId}/deactivate
```

### 2. Gắn gói trial cho user mới
```bash
POST /api/admin/users/{userId}/subscriptions
{
  "packageId": "trial-package-uuid",
  "durationDays": 7
}
```

### 3. Gia hạn subscription
```bash
PATCH /api/admin/users/{userId}/subscriptions/{subId}
{
  "expiresAt": "2024-03-15T00:00:00Z"
}
```

### 4. Nâng cấp user lên premium
```bash
PATCH /api/admin/users/{userId}/role
{
  "role": "premium"
}
```

## 🧪 Testing

### Import Postman Collection
1. Mở Postman
2. File → Import
3. Chọn `postman-admin-collection.json`
4. Login admin để lấy token
5. Token tự động được lưu vào collection variables

### Run Unit Tests
```bash
pnpm run test src/admin/admin.controller.spec.ts
```

## 🔍 Monitoring & Debugging

### Xem audit logs
```sql
SELECT 
    created_at,
    action,
    user_id as admin_id,
    data,
    ip_address
FROM audit_logs
WHERE action LIKE 'admin.%'
ORDER BY created_at DESC
LIMIT 100;
```

### Xem hành động trên một user cụ thể
```sql
SELECT * 
FROM audit_logs
WHERE JSON_EXTRACT(data, '$.targetUserId') = 'user-uuid'
ORDER BY created_at DESC;
```

## ⚠️ Lưu ý quan trọng

1. **Không thể khóa admin**: API sẽ trả về lỗi nếu cố khóa tài khoản admin
2. **Token expires**: Access token mặc định hết hạn sau 15 phút
3. **Không duplicate subscription**: User không thể có 2 subscription active cho cùng 1 package
4. **Audit trail**: Tất cả thay đổi đều được ghi log, không thể xóa
5. **Production security**: 
   - Chỉ sử dụng HTTPS
   - Giới hạn số lượng admin
   - Thường xuyên review audit logs
   - Sử dụng strong JWT_SECRET

## 🚀 Next Steps

1. **Setup admin user** → Xem [ADMIN_SETUP.md](./ADMIN_SETUP.md)
2. **Tìm hiểu API** → Xem [USER_MANAGEMENT_API.md](./USER_MANAGEMENT_API.md)
3. **Học workflows** → Xem [ADMIN_USE_CASES.md](./ADMIN_USE_CASES.md)
4. **Test với Postman** → Import [postman-admin-collection.json](./postman-admin-collection.json)

## 🐛 Troubleshooting

### Lỗi 403: "Chỉ admin mới có quyền truy cập"
- Kiểm tra role trong database
- Verify JWT payload
- Đảm bảo guards được áp dụng đúng

### Token hết hạn
- Login lại để lấy token mới
- Hoặc sử dụng refresh token API
- Tăng `JWT_EXPIRES_IN` trong .env nếu cần

### Không tìm thấy user
- Kiểm tra userId có đúng không
- User có bị xóa khỏi database không

## 📞 Support

Nếu cần hỗ trợ, hãy:
1. Kiểm tra audit logs để debug
2. Review tài liệu API
3. Xem use cases examples
4. Liên hệ team development

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Module Status:** ✅ Production Ready

