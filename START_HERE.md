# 🚀 Admin Module - START HERE

## 👋 Chào mừng!

Module quản lý users đã được xây dựng hoàn chỉnh. File này sẽ hướng dẫn bạn từng bước để bắt đầu.

## ⚡ Quick Start (5 phút)

### Bước 1️⃣: Tạo Admin User
```bash
npx ts-node src/admin/scripts/create-first-admin.ts
```
Nhập:
- Email: `admin@example.com`
- Password: `Admin123!` (hoặc password của bạn)
- Display Name: `Admin`
- Full Name: `System Admin`

### Bước 2️⃣: Start Server
```bash
pnpm run start:dev
```

### Bước 3️⃣: Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```
**Lưu lại `accessToken` từ response!**

### Bước 4️⃣: Test API
```bash
# Thay YOUR_TOKEN bằng accessToken vừa lấy
curl -X GET http://localhost:3000/api/admin/users/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Nếu thành công → Bạn đã sẵn sàng! 🎉

---

## 📚 Tài liệu

### 🎯 Cho người mới bắt đầu
1. **[ADMIN_OVERVIEW.md](./ADMIN_OVERVIEW.md)** ← BẮT ĐẦU TỪ ĐÂY
   - Tổng quan module
   - Danh sách tính năng
   - API endpoints summary

2. **[ADMIN_SETUP.md](./ADMIN_SETUP.md)**
   - Setup chi tiết
   - Troubleshooting
   - Best practices

### 📖 Tài liệu chi tiết
3. **[USER_MANAGEMENT_API.md](./USER_MANAGEMENT_API.md)**
   - API reference đầy đủ
   - Request/Response examples
   - Error codes

4. **[ADMIN_USE_CASES.md](./ADMIN_USE_CASES.md)**
   - 9 use cases thực tế
   - Workflows chi tiết
   - SQL queries

### 🏗️ Cho developers
5. **[ADMIN_ARCHITECTURE.md](./ADMIN_ARCHITECTURE.md)**
   - System architecture diagrams
   - Data flow
   - Component interactions

6. **[ADMIN_IMPLEMENTATION_SUMMARY.md](./ADMIN_IMPLEMENTATION_SUMMARY.md)**
   - Implementation details
   - Code structure
   - Testing checklist

### 🛠️ Tools
7. **[postman-admin-collection.json](./postman-admin-collection.json)**
   - Import vào Postman để test
   - Tự động lưu token
   - All endpoints configured

---

## 🎯 Tính năng chính

### Quản lý Users
- ✅ Xem danh sách users (pagination + filters)
- ✅ Search users
- ✅ Xem chi tiết user
- ✅ Kích hoạt/Khóa users
- ✅ Cập nhật role
- ✅ Thống kê users

### Quản lý Subscriptions
- ✅ Xem subscriptions của user
- ✅ Gắn gói cho user
- ✅ Gia hạn subscription
- ✅ Tạm dừng/Hủy subscription
- ✅ Update trạng thái

### Bảo mật & Audit
- ✅ JWT authentication
- ✅ Admin role guard
- ✅ Full audit trail
- ✅ IP & user agent logging

---

## 📋 Checklist

### Setup
- [ ] Tạo admin user đầu tiên
- [ ] Login thành công
- [ ] Lấy được JWT token
- [ ] Test API stats thành công

### Test các tính năng
- [ ] List users
- [ ] Search users
- [ ] Activate/Deactivate user
- [ ] Update user role
- [ ] Assign subscription
- [ ] View user subscriptions
- [ ] Update subscription
- [ ] Cancel subscription

### Bảo mật
- [ ] Kiểm tra API reject khi không có token
- [ ] Kiểm tra API reject khi user không phải admin
- [ ] Xem audit logs được tạo

---

## 🔗 API Endpoints

### User Management
```
GET    /api/admin/users/stats
GET    /api/admin/users
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id/activate
PATCH  /api/admin/users/:id/deactivate
PATCH  /api/admin/users/:id/role
```

### Subscription Management
```
GET    /api/admin/users/:id/subscriptions
POST   /api/admin/users/:id/subscriptions
PATCH  /api/admin/users/:id/subscriptions/:subscriptionId
DELETE /api/admin/users/:id/subscriptions/:subscriptionId
```

---

## 💡 Use Cases phổ biến

### 1. Khóa user vi phạm
```bash
PATCH /api/admin/users/{userId}/deactivate
Authorization: Bearer {token}
```

### 2. Gắn gói trial 7 ngày
```bash
POST /api/admin/users/{userId}/subscriptions
Content-Type: application/json
Authorization: Bearer {token}

{
  "packageId": "trial-package-uuid",
  "durationDays": 7,
  "autoRenew": false
}
```

### 3. Gia hạn subscription
```bash
PATCH /api/admin/users/{userId}/subscriptions/{subId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "expiresAt": "2024-03-15T00:00:00Z"
}
```

### 4. Nâng cấp user lên premium
```bash
PATCH /api/admin/users/{userId}/role
Content-Type: application/json
Authorization: Bearer {token}

{
  "role": "premium"
}
```

---

## 🧪 Testing với Postman

### Import Collection
1. Mở Postman
2. File → Import
3. Chọn `postman-admin-collection.json`

### Sử dụng
1. Chạy "Login Admin" request
2. Token tự động lưu vào collection variable
3. Các request khác sẽ tự động sử dụng token

---

## ⚠️ Lưu ý quan trọng

### Bảo mật
- ⚠️ **Không chia sẻ JWT token**
- ⚠️ **Đổi mật khẩu admin thường xuyên**
- ⚠️ **Giới hạn số lượng admin users**
- ⚠️ **Review audit logs định kỳ**

### Hạn chế
- ❌ Không thể khóa tài khoản admin
- ❌ Không thể gắn duplicate subscription
- ❌ Access token hết hạn sau 15 phút (sử dụng refresh token)

### Best Practices
- ✅ Luôn ghi lý do khi hủy subscription
- ✅ Kiểm tra user detail trước khi khóa
- ✅ Verify payment trước khi gắn subscription
- ✅ Sử dụng HTTPS trong production

---

## 🆘 Troubleshooting

### Lỗi 401: Unauthorized
**Nguyên nhân:** Token không hợp lệ hoặc hết hạn  
**Giải pháp:** Login lại để lấy token mới

### Lỗi 403: Forbidden
**Nguyên nhân:** User không phải admin  
**Giải pháp:** Kiểm tra role trong database
```sql
SELECT id, email, role FROM users WHERE email = 'your-email';
```

### Lỗi 404: Not Found
**Nguyên nhân:** User/Subscription không tồn tại  
**Giải pháp:** Kiểm tra ID có đúng không

### Lỗi 409: Conflict
**Nguyên nhân:** Duplicate subscription  
**Giải pháp:** Kiểm tra user đã có subscription active chưa

---

## 📞 Liên hệ & Hỗ trợ

### Xem logs
```bash
# Application logs
pnpm run start:dev

# Audit logs (SQL)
SELECT * FROM audit_logs 
WHERE action LIKE 'admin.%' 
ORDER BY created_at DESC 
LIMIT 100;
```

### Debug
1. Kiểm tra server đang chạy
2. Kiểm tra database connection
3. Verify JWT_SECRET trong .env
4. Check role trong database
5. Review audit logs

---

## 📖 Đọc tiếp

### Để học thêm:
1. Đọc [ADMIN_OVERVIEW.md](./ADMIN_OVERVIEW.md) để hiểu tổng quan
2. Đọc [USER_MANAGEMENT_API.md](./USER_MANAGEMENT_API.md) cho API details
3. Đọc [ADMIN_USE_CASES.md](./ADMIN_USE_CASES.md) cho examples
4. Import Postman collection để test hands-on

### Để development:
1. Đọc [ADMIN_ARCHITECTURE.md](./ADMIN_ARCHITECTURE.md) để hiểu architecture
2. Đọc [ADMIN_IMPLEMENTATION_SUMMARY.md](./ADMIN_IMPLEMENTATION_SUMMARY.md) cho code details
3. Xem source code trong `src/admin/`

---

## ✨ Features Roadmap (Future)

Có thể mở rộng thêm:
- [ ] Bulk operations (activate/deactivate nhiều users)
- [ ] Export users ra CSV/Excel
- [ ] Email notifications
- [ ] Admin dashboard UI
- [ ] Advanced analytics
- [ ] Two-factor authentication
- [ ] Admin permission levels
- [ ] Scheduled tasks

---

## 🎉 Hoàn tất!

Bạn đã sẵn sàng sử dụng Admin Module!

**Next steps:**
1. ✅ Tạo admin user
2. ✅ Login và test API
3. ✅ Import Postman collection
4. ✅ Đọc documentation
5. ✅ Bắt đầu quản lý users!

---

**Hướng dẫn được tạo:** October 4, 2025  
**Module Version:** 1.0.0  
**Status:** ✅ Production Ready

**Câu hỏi?** Xem [ADMIN_OVERVIEW.md](./ADMIN_OVERVIEW.md) hoặc [USER_MANAGEMENT_API.md](./USER_MANAGEMENT_API.md)

