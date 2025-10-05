# API Quản Lý Users

API này cung cấp các chức năng quản lý users, bao gồm xem danh sách, kích hoạt/khóa user, gắn gói subscription và quản lý subscription của user.

## Xác thực

Tất cả các API admin yêu cầu:
1. **JWT token** trong header `Authorization: Bearer <token>`
2. **Quyền admin**: User phải có `role = 'admin'`

## Endpoints

### 1. Thống kê Users

**GET** `/api/admin/users/stats`

Lấy thống kê tổng quan về users trong hệ thống.

**Response:**
```json
{
  "totalUsers": 150,
  "activeUsers": 140,
  "inactiveUsers": 10,
  "premiumUsers": 25,
  "adminUsers": 3,
  "newUsersThisMonth": 12
}
```

---

### 2. Danh sách Users

**GET** `/api/admin/users`

Lấy danh sách users với phân trang và bộ lọc.

**Query Parameters:**
- `page` (number, optional): Số trang, mặc định = 1
- `limit` (number, optional): Số lượng users mỗi trang, mặc định = 10
- `search` (string, optional): Tìm kiếm theo email, displayName, hoặc fullName
- `role` (string, optional): Lọc theo role (admin, member, premium)
- `isActive` (boolean, optional): Lọc theo trạng thái active
- `sortBy` (string, optional): Sắp xếp theo field (email, createdAt, updatedAt), mặc định = createdAt
- `sortOrder` (string, optional): Thứ tự sắp xếp (ASC, DESC), mặc định = DESC

**Example:**
```
GET /api/admin/users?page=1&limit=20&search=john&role=member&isActive=true&sortBy=email&sortOrder=ASC
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "displayName": "John Doe",
      "fullName": "John Doe",
      "phoneE164": "+84901234567",
      "phoneVerifiedAt": "2024-01-15T10:30:00Z",
      "role": "member",
      "isActive": true,
      "referredById": null,
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "userSubscriptions": []
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

### 3. Chi tiết User

**GET** `/api/admin/users/:id`

Lấy thông tin chi tiết của một user theo ID.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "User Name",
  "fullName": "Full Name",
  "phoneE164": "+84901234567",
  "phoneVerifiedAt": "2024-01-15T10:30:00Z",
  "role": "member",
  "isActive": true,
  "referredById": null,
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "userSubscriptions": [
    {
      "id": "subscription-uuid",
      "packageId": "package-uuid",
      "status": "active",
      "startsAt": "2024-01-15T00:00:00Z",
      "expiresAt": "2024-02-15T00:00:00Z",
      "autoRenew": false,
      "price": 99000,
      "currency": "VND",
      "package": {
        "id": "package-uuid",
        "name": "Premium Monthly",
        "description": "Gói premium 1 tháng"
      }
    }
  ],
  "virtualPortfolios": [],
  "referralCodes": [],
  "commissions": []
}
```

---

### 4. Kích hoạt User

**PATCH** `/api/admin/users/:id/activate`

Kích hoạt một user đã bị khóa.

**Response:**
```json
{
  "message": "Kích hoạt người dùng thành công",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "isActive": true,
    ...
  }
}
```

---

### 5. Khóa User

**PATCH** `/api/admin/users/:id/deactivate`

Khóa một user (không thể khóa tài khoản admin).

**Response:**
```json
{
  "message": "Khóa người dùng thành công",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "isActive": false,
    ...
  }
}
```

---

### 6. Cập nhật Role User

**PATCH** `/api/admin/users/:id/role`

Cập nhật role của user.

**Request Body:**
```json
{
  "role": "premium"
}
```

**Roles có thể sử dụng:**
- `admin`: Quản trị viên
- `member`: Thành viên thông thường
- `premium`: Thành viên premium

**Response:**
```json
{
  "message": "Cập nhật vai trò người dùng thành công",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "premium",
    ...
  }
}
```

---

### 7. Danh sách Subscriptions của User

**GET** `/api/admin/users/:id/subscriptions`

Lấy tất cả subscriptions của một user.

**Response:**
```json
[
  {
    "id": "subscription-uuid",
    "userId": "user-uuid",
    "packageId": "package-uuid",
    "status": "active",
    "startsAt": "2024-01-15T00:00:00Z",
    "expiresAt": "2024-02-15T00:00:00Z",
    "autoRenew": false,
    "price": 99000,
    "currency": "VND",
    "paymentReference": null,
    "cancelledAt": null,
    "cancellationReason": null,
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z",
    "package": {
      "id": "package-uuid",
      "name": "Premium Monthly",
      "description": "Gói premium 1 tháng",
      "price": 99000,
      "currency": "VND",
      "durationDays": 30
    }
  }
]
```

---

### 8. Gắn gói Subscription cho User

**POST** `/api/admin/users/:id/subscriptions`

Gắn một gói subscription cho user.

**Request Body:**
```json
{
  "packageId": "package-uuid",
  "startsAt": "2024-01-15T00:00:00Z",
  "durationDays": 30,
  "autoRenew": false
}
```

**Fields:**
- `packageId` (string, required): ID của gói subscription
- `startsAt` (string, optional): Thời gian bắt đầu (ISO 8601), mặc định = hiện tại
- `durationDays` (number, optional): Số ngày sử dụng, mặc định = theo gói
- `autoRenew` (boolean, optional): Tự động gia hạn, mặc định = false

**Response:**
```json
{
  "message": "Gắn gói subscription cho người dùng thành công",
  "subscription": {
    "id": "subscription-uuid",
    "userId": "user-uuid",
    "packageId": "package-uuid",
    "status": "active",
    "startsAt": "2024-01-15T00:00:00Z",
    "expiresAt": "2024-02-15T00:00:00Z",
    "autoRenew": false,
    "price": 99000,
    "currency": "VND",
    "package": {
      "id": "package-uuid",
      "name": "Premium Monthly",
      "description": "Gói premium 1 tháng"
    }
  }
}
```

---

### 9. Cập nhật Subscription

**PATCH** `/api/admin/users/:id/subscriptions/:subscriptionId`

Cập nhật thông tin subscription của user.

**Request Body:**
```json
{
  "status": "suspended",
  "expiresAt": "2024-03-15T00:00:00Z",
  "autoRenew": true,
  "cancellationReason": "Vi phạm điều khoản"
}
```

**Fields (tất cả đều optional):**
- `status` (string): Trạng thái (active, expired, cancelled, suspended)
- `expiresAt` (string): Thời gian hết hạn mới (ISO 8601)
- `autoRenew` (boolean): Tự động gia hạn
- `cancellationReason` (string): Lý do hủy (nếu status = cancelled)

**Response:**
```json
{
  "message": "Cập nhật subscription thành công",
  "subscription": {
    "id": "subscription-uuid",
    "userId": "user-uuid",
    "status": "suspended",
    ...
  }
}
```

---

### 10. Hủy Subscription

**DELETE** `/api/admin/users/:id/subscriptions/:subscriptionId`

Hủy subscription của user.

**Request Body:**
```json
{
  "reason": "User yêu cầu hủy"
}
```

**Response:**
```json
{
  "message": "Hủy subscription thành công",
  "subscription": {
    "id": "subscription-uuid",
    "userId": "user-uuid",
    "status": "cancelled",
    "cancelledAt": "2024-01-20T10:30:00Z",
    "cancellationReason": "User yêu cầu hủy",
    ...
  }
}
```

---

## Mã lỗi

| Mã lỗi | Ý nghĩa |
|--------|---------|
| 401 | Không có quyền truy cập (chưa đăng nhập hoặc token không hợp lệ) |
| 403 | Không đủ quyền (không phải admin) |
| 404 | Không tìm thấy user/subscription/package |
| 409 | Conflict (ví dụ: user đã có subscription đang active) |
| 400 | Dữ liệu không hợp lệ |

---

## Ví dụ sử dụng với cURL

### Lấy danh sách users
```bash
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Khóa user
```bash
curl -X PATCH "http://localhost:3000/api/admin/users/USER_ID/deactivate" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Gắn gói subscription
```bash
curl -X POST "http://localhost:3000/api/admin/users/USER_ID/subscriptions" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "PACKAGE_ID",
    "startsAt": "2024-01-15T00:00:00Z",
    "durationDays": 30,
    "autoRenew": false
  }'
```

### Cập nhật role
```bash
curl -X PATCH "http://localhost:3000/api/admin/users/USER_ID/role" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "premium"
  }'
```

---

## Audit Logs

Tất cả các hành động quản lý user đều được ghi log vào bảng `audit_logs`:

- `admin.user.activate`: Kích hoạt user
- `admin.user.deactivate`: Khóa user
- `admin.user.update_role`: Cập nhật role
- `admin.user.assign_subscription`: Gắn subscription
- `admin.user.update_subscription`: Cập nhật subscription
- `admin.user.cancel_subscription`: Hủy subscription

Mỗi log bao gồm:
- `userId`: ID của admin thực hiện hành động
- `action`: Loại hành động
- `ipAddress`: Địa chỉ IP
- `userAgent`: User agent của trình duyệt
- `data`: Dữ liệu chi tiết về hành động
- `createdAt`: Thời gian thực hiện

---

## Lưu ý

1. **Không thể khóa tài khoản admin**: API sẽ trả về lỗi nếu cố gắng khóa một tài khoản có role = 'admin'
2. **Không thể gắn subscription trùng**: User không thể có 2 subscription đang active cho cùng một package
3. **Tự động tính toán thời gian hết hạn**: Nếu không truyền `durationDays`, hệ thống sẽ dùng giá trị mặc định từ package
4. **Audit trail**: Mọi thay đổi đều được ghi log để truy vết sau này

