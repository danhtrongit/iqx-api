# Use Cases - Admin User Management

Tài liệu này mô tả các use cases phổ biến và workflow khi quản lý users.

## 📋 Mục lục

1. [Tạo và setup admin đầu tiên](#1-tạo-và-setup-admin-đầu-tiên)
2. [Xem tổng quan hệ thống](#2-xem-tổng-quan-hệ-thống)
3. [Tìm kiếm và lọc users](#3-tìm-kiếm-và-lọc-users)
4. [Quản lý trạng thái user](#4-quản-lý-trạng-thái-user)
5. [Gắn gói subscription cho user](#5-gắn-gói-subscription-cho-user)
6. [Gia hạn subscription](#6-gia-hạn-subscription)
7. [Xử lý vi phạm](#7-xử-lý-vi-phạm)
8. [Nâng cấp user lên premium](#8-nâng-cấp-user-lên-premium)
9. [Xem lịch sử hoạt động](#9-xem-lịch-sử-hoạt-động)

---

## 1. Tạo và setup admin đầu tiên

### Workflow:

```
1. Chạy script tạo admin
   ↓
2. Đăng nhập lấy token
   ↓
3. Test API admin
```

### Commands:

```bash
# Bước 1: Tạo admin
npx ts-node src/admin/scripts/create-first-admin.ts

# Bước 2: Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourPassword123!"}'

# Bước 3: Test (thay YOUR_TOKEN)
curl -X GET http://localhost:3000/api/admin/users/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 2. Xem tổng quan hệ thống

### Use Case:
Admin muốn xem tổng quan về:
- Tổng số users
- Users đang active/inactive
- Users premium
- Users mới tháng này

### API Call:

```bash
GET /api/admin/users/stats
Authorization: Bearer {adminToken}
```

### Response Example:

```json
{
  "totalUsers": 1543,
  "activeUsers": 1420,
  "inactiveUsers": 123,
  "premiumUsers": 456,
  "adminUsers": 5,
  "newUsersThisMonth": 89
}
```

### Insight:
- Nếu `inactiveUsers` cao → Cần điều tra lý do users bị khóa
- Nếu `newUsersThisMonth` thấp → Cần chiến lược marketing
- `premiumUsers/totalUsers` = conversion rate

---

## 3. Tìm kiếm và lọc users

### Use Case 1: Tìm user theo email

```bash
GET /api/admin/users?search=john@example.com
Authorization: Bearer {adminToken}
```

### Use Case 2: Xem tất cả premium users

```bash
GET /api/admin/users?role=premium&page=1&limit=50
Authorization: Bearer {adminToken}
```

### Use Case 3: Tìm users bị khóa

```bash
GET /api/admin/users?isActive=false&page=1&limit=20
Authorization: Bearer {adminToken}
```

### Use Case 4: Users mới nhất

```bash
GET /api/admin/users?sortBy=createdAt&sortOrder=DESC&limit=10
Authorization: Bearer {adminToken}
```

---

## 4. Quản lý trạng thái user

### Use Case 1: User vi phạm → Khóa tài khoản

**Workflow:**
```
1. Tìm user
   ↓
2. Xem chi tiết để xác nhận
   ↓
3. Khóa user
   ↓
4. Kiểm tra audit log
```

**Commands:**
```bash
# Bước 1: Tìm user
GET /api/admin/users?search=violator@example.com

# Bước 2: Xem chi tiết (copy userId từ bước 1)
GET /api/admin/users/{userId}

# Bước 3: Khóa user
PATCH /api/admin/users/{userId}/deactivate

# Bước 4: Xem audit log trong database
SELECT * FROM audit_logs 
WHERE action = 'admin.user.deactivate' 
AND data->'$.targetUserId' = '{userId}'
ORDER BY created_at DESC;
```

### Use Case 2: User kháng nghị thành công → Kích hoạt lại

```bash
# Kích hoạt user
PATCH /api/admin/users/{userId}/activate
Authorization: Bearer {adminToken}
```

---

## 5. Gắn gói subscription cho user

### Use Case 1: User mua gói nhưng payment bị lỗi → Gắn manual

**Workflow:**
```
1. Xác nhận payment đã thành công (check với payment provider)
   ↓
2. Tìm packageId phù hợp
   ↓
3. Gắn subscription cho user
   ↓
4. Thông báo cho user
```

**Commands:**
```bash
# Bước 1: Lấy thông tin user
GET /api/admin/users/{userId}

# Bước 2: Gắn subscription
POST /api/admin/users/{userId}/subscriptions
Content-Type: application/json
Authorization: Bearer {adminToken}

{
  "packageId": "package-uuid",
  "startsAt": "2024-01-15T00:00:00Z",
  "durationDays": 30,
  "autoRenew": false
}
```

### Use Case 2: Tặng trial cho user mới

```bash
POST /api/admin/users/{userId}/subscriptions
Content-Type: application/json
Authorization: Bearer {adminToken}

{
  "packageId": "trial-package-uuid",
  "durationDays": 7,
  "autoRenew": false
}
```

### Use Case 3: VIP user → Gắn gói lifetime

```bash
POST /api/admin/users/{userId}/subscriptions
Content-Type: application/json
Authorization: Bearer {adminToken}

{
  "packageId": "premium-package-uuid",
  "startsAt": "2024-01-15T00:00:00Z",
  "durationDays": 36500,  // 100 năm
  "autoRenew": false
}
```

---

## 6. Gia hạn subscription

### Use Case 1: User yêu cầu gia hạn

**Workflow:**
```
1. Lấy danh sách subscriptions của user
   ↓
2. Tìm subscription cần gia hạn
   ↓
3. Update expiresAt
```

**Commands:**
```bash
# Bước 1: Lấy subscriptions
GET /api/admin/users/{userId}/subscriptions

# Bước 2: Gia hạn thêm 30 ngày
PATCH /api/admin/users/{userId}/subscriptions/{subscriptionId}
Content-Type: application/json
Authorization: Bearer {adminToken}

{
  "expiresAt": "2024-03-15T00:00:00Z"  // Ngày hết hạn mới
}
```

### Use Case 2: Subscription sắp hết hạn → Tự động gia hạn

```bash
PATCH /api/admin/users/{userId}/subscriptions/{subscriptionId}
Content-Type: application/json
Authorization: Bearer {adminToken}

{
  "autoRenew": true
}
```

---

## 7. Xử lý vi phạm

### Use Case 1: User spam → Tạm khóa subscription

```bash
# Suspend subscription
PATCH /api/admin/users/{userId}/subscriptions/{subscriptionId}
Content-Type: application/json
Authorization: Bearer {adminToken}

{
  "status": "suspended",
  "cancellationReason": "Spam detection - suspended for 7 days"
}
```

### Use Case 2: User vi phạm nghiêm trọng → Hủy subscription + khóa account

```bash
# Bước 1: Hủy subscription
DELETE /api/admin/users/{userId}/subscriptions/{subscriptionId}
Content-Type: application/json
Authorization: Bearer {adminToken}

{
  "reason": "Violation of terms of service"
}

# Bước 2: Khóa account
PATCH /api/admin/users/{userId}/deactivate
Authorization: Bearer {adminToken}
```

---

## 8. Nâng cấp user lên premium

### Use Case 1: User trả phí → Cập nhật role + gắn subscription

```bash
# Bước 1: Cập nhật role
PATCH /api/admin/users/{userId}/role
Content-Type: application/json
Authorization: Bearer {adminToken}

{
  "role": "premium"
}

# Bước 2: Gắn subscription
POST /api/admin/users/{userId}/subscriptions
Content-Type: application/json
Authorization: Bearer {adminToken}

{
  "packageId": "premium-monthly-package-uuid",
  "durationDays": 30,
  "autoRenew": true
}
```

### Use Case 2: Influencer → Miễn phí premium

```bash
# Chỉ cần update role, không cần subscription
PATCH /api/admin/users/{userId}/role
Content-Type: application/json
Authorization: Bearer {adminToken}

{
  "role": "premium"
}
```

---

## 9. Xem lịch sử hoạt động

### Use Case: Audit admin actions

Tất cả hành động admin đều được ghi log vào bảng `audit_logs`.

```sql
-- Xem tất cả hành động admin
SELECT 
    al.created_at,
    al.action,
    u.email as admin_email,
    al.data,
    al.ip_address
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.action LIKE 'admin.%'
ORDER BY al.created_at DESC
LIMIT 100;

-- Xem hành động trên một user cụ thể
SELECT 
    al.created_at,
    al.action,
    admin.email as admin_email,
    al.data
FROM audit_logs al
LEFT JOIN users admin ON al.user_id = admin.id
WHERE al.data->'$.targetUserId' = 'target-user-uuid'
ORDER BY al.created_at DESC;

-- Xem ai đã khóa users gần đây
SELECT 
    al.created_at,
    admin.email as admin_email,
    al.data->'$.targetUserId' as locked_user_id,
    al.ip_address
FROM audit_logs al
LEFT JOIN users admin ON al.user_id = admin.id
WHERE al.action = 'admin.user.deactivate'
ORDER BY al.created_at DESC
LIMIT 50;
```

---

## 📊 Dashboard Suggestions

Để quản lý hiệu quả, nên tạo dashboard với:

### 1. Key Metrics
- Total Users
- Active/Inactive ratio
- Premium conversion rate
- New users trend (daily/weekly/monthly)

### 2. Alert System
- Users with expired subscriptions
- Failed payment attempts
- Unusual activity patterns
- High number of deactivations

### 3. Reports
- Monthly revenue from subscriptions
- User churn rate
- Most popular packages
- Admin actions summary

---

## 🔧 Automation Ideas

### 1. Auto-suspend expired subscriptions

Chạy cron job hàng ngày:
```typescript
// subscriptions/subscription-schedule.service.ts
async expireSubscriptions() {
  const expired = await this.userSubscriptionRepository.find({
    where: {
      status: SubscriptionStatus.ACTIVE,
      expiresAt: LessThan(new Date())
    }
  });
  
  for (const sub of expired) {
    sub.status = SubscriptionStatus.EXPIRED;
    await this.userSubscriptionRepository.save(sub);
  }
}
```

### 2. Auto-remind users before expiry

Email users 7 days và 1 day trước khi hết hạn.

### 3. Auto-renew subscriptions

Với subscriptions có `autoRenew = true`, tự động gia hạn khi sắp hết hạn.

---

## 🚨 Emergency Procedures

### 1. Mass deactivation (security breach)

```bash
# Khóa tất cả users NGOẠI TRỪ admins
UPDATE users 
SET is_active = 0 
WHERE role != 'admin';

# Sau khi khắc phục, kích hoạt lại từng user hoặc theo batch
```

### 2. Rollback subscription changes

Sử dụng audit logs để rollback:
```sql
-- Tìm thay đổi gần đây
SELECT * FROM audit_logs 
WHERE action = 'admin.user.assign_subscription'
AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Manual rollback subscriptions
DELETE FROM user_subscriptions WHERE id IN (...);
```

---

**Next:** Xem [USER_MANAGEMENT_API.md](./USER_MANAGEMENT_API.md) để biết chi tiết về tất cả các API endpoints.

