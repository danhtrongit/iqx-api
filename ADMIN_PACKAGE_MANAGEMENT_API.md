# Admin Package Management API

API dành cho Admin để quản lý Subscription Packages và API Extension Packages.

---

## 🔐 Authentication

Tất cả endpoints yêu cầu:
1. **JWT Token** trong header `Authorization: Bearer <token>`
2. **Admin Role**: User phải có `role = 'admin'`

---

## 📋 Mục lục

1. [Subscription Packages Management](#subscription-packages-management)
2. [API Extension Packages Management](#api-extension-packages-management)
3. [Overview & Statistics](#overview--statistics)
4. [Examples](#examples)

---

## 📦 Subscription Packages Management

### 1. Get All Subscription Packages

**GET** `/api/admin/packages/subscriptions`

Lấy tất cả gói subscription (bao gồm inactive nếu muốn).

**Query Parameters:**
- `includeInactive` (optional): `true` để bao gồm gói inactive

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Gói Cơ Bản",
    "description": "Gói cơ bản cho người dùng mới",
    "price": "99000.00",
    "currency": "VND",
    "durationDays": 30,
    "maxVirtualPortfolios": 3,
    "apiLimit": 1000,
    "features": {
      "realTimeData": false,
      "advancedCharts": false
    },
    "isActive": true,
    "createdAt": "2025-10-01T00:00:00.000Z",
    "updatedAt": "2025-10-01T00:00:00.000Z"
  }
]
```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/admin/packages/subscriptions?includeInactive=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 2. Get Subscription Package by ID

**GET** `/api/admin/packages/subscriptions/:id`

Lấy thông tin chi tiết của một gói subscription.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Gói Cơ Bản",
  "description": "Gói cơ bản cho người dùng mới",
  "price": "99000.00",
  "currency": "VND",
  "durationDays": 30,
  "maxVirtualPortfolios": 3,
  "apiLimit": 1000,
  "features": {},
  "isActive": true,
  "createdAt": "2025-10-01T00:00:00.000Z",
  "updatedAt": "2025-10-01T00:00:00.000Z"
}
```

**Response (404):**
```json
{
  "statusCode": 404,
  "message": "Gói subscription không tồn tại"
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/admin/packages/subscriptions/$PACKAGE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 3. Create Subscription Package

**POST** `/api/admin/packages/subscriptions`

Tạo gói subscription mới.

**Request Body:**
```json
{
  "name": "Gói Pro Max",
  "description": "Gói cao cấp nhất",
  "price": 499000,
  "currency": "VND",
  "durationDays": 30,
  "maxVirtualPortfolios": 20,
  "apiLimit": 10000,
  "features": {
    "realTimeData": true,
    "advancedCharts": true,
    "customAlerts": true
  },
  "isActive": true
}
```

**Validation Rules:**
- `name` (string, required): Tên gói (unique)
- `description` (string, optional): Mô tả
- `price` (number, required, >= 0): Giá
- `currency` (string, required): Mã tiền tệ
- `durationDays` (number, required, >= 1): Thời hạn (ngày)
- `maxVirtualPortfolios` (number, optional, >= 1): Số portfolio tối đa
- `apiLimit` (number, optional, >= 1): Giới hạn API calls
- `features` (object, optional): Các tính năng
- `isActive` (boolean, optional, default: true): Trạng thái

**Response (201):**
```json
{
  "id": "new-uuid",
  "name": "Gói Pro Max",
  "description": "Gói cao cấp nhất",
  "price": "499000.00",
  "currency": "VND",
  "durationDays": 30,
  "maxVirtualPortfolios": 20,
  "apiLimit": 10000,
  "features": {
    "realTimeData": true,
    "advancedCharts": true,
    "customAlerts": true
  },
  "isActive": true,
  "createdAt": "2025-10-05T10:00:00.000Z",
  "updatedAt": "2025-10-05T10:00:00.000Z"
}
```

**Response (400):**
```json
{
  "statusCode": 400,
  "message": "Tên gói đã tồn tại"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/admin/packages/subscriptions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gói Pro Max",
    "price": 499000,
    "currency": "VND",
    "durationDays": 30,
    "apiLimit": 10000
  }'
```

---

### 4. Update Subscription Package

**PUT** `/api/admin/packages/subscriptions/:id`

Cập nhật thông tin gói subscription.

**Request Body:**
```json
{
  "price": 399000,
  "apiLimit": 15000,
  "features": {
    "realTimeData": true,
    "advancedCharts": true,
    "prioritySupport": true
  }
}
```

**Note:** Tất cả fields đều optional, chỉ cần gửi những field muốn update.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Gói Pro Max",
  "price": "399000.00",
  "apiLimit": 15000,
  "features": {
    "realTimeData": true,
    "advancedCharts": true,
    "prioritySupport": true
  },
  "updatedAt": "2025-10-05T11:00:00.000Z"
}
```

**cURL:**
```bash
curl -X PUT http://localhost:3000/api/admin/packages/subscriptions/$PACKAGE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 399000,
    "apiLimit": 15000
  }'
```

---

### 5. Delete Subscription Package

**DELETE** `/api/admin/packages/subscriptions/:id`

Xóa gói subscription (soft delete - set `isActive = false`).

**Response (204):** No Content

**Response (400):**
```json
{
  "statusCode": 400,
  "message": "Không thể xóa gói vì có 15 subscription đang active"
}
```

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/admin/packages/subscriptions/$PACKAGE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 6. Get Subscription Package Statistics

**GET** `/api/admin/packages/subscriptions/:id/stats`

Xem thống kê usage của một gói subscription.

**Response (200):**
```json
{
  "package": {
    "id": "uuid",
    "name": "Gói Cơ Bản",
    "price": "99000.00",
    "apiLimit": 1000
  },
  "stats": {
    "totalSubscriptions": 150,
    "activeSubscriptions": 85,
    "totalRevenue": 14850000
  }
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/admin/packages/subscriptions/$PACKAGE_ID/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🔄 API Extension Packages Management

### 1. Get All API Extension Packages

**GET** `/api/admin/packages/extensions`

Lấy tất cả gói mở rộng API.

**Query Parameters:**
- `includeInactive` (optional): `true` để bao gồm gói inactive

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Gói Mở Rộng 1K",
    "description": "Thêm 1,000 API calls",
    "additionalCalls": 1000,
    "price": "49000.00",
    "currency": "VND",
    "isActive": true,
    "createdAt": "2025-10-01T00:00:00.000Z",
    "updatedAt": "2025-10-01T00:00:00.000Z"
  }
]
```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/admin/packages/extensions?includeInactive=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 2. Get API Extension Package by ID

**GET** `/api/admin/packages/extensions/:id`

Lấy thông tin chi tiết của một gói mở rộng.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Gói Mở Rộng 5K",
  "description": "Thêm 5,000 API calls - Tiết kiệm 20%",
  "additionalCalls": 5000,
  "price": "199000.00",
  "currency": "VND",
  "isActive": true,
  "createdAt": "2025-10-01T00:00:00.000Z",
  "updatedAt": "2025-10-01T00:00:00.000Z"
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/admin/packages/extensions/$EXTENSION_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 3. Create API Extension Package

**POST** `/api/admin/packages/extensions`

Tạo gói mở rộng mới.

**Request Body:**
```json
{
  "name": "Gói Mở Rộng 20K",
  "description": "Thêm 20,000 API calls - Tiết kiệm 40%",
  "additionalCalls": 20000,
  "price": 599000,
  "currency": "VND",
  "isActive": true
}
```

**Validation Rules:**
- `name` (string, required): Tên gói (unique)
- `description` (string, optional): Mô tả
- `additionalCalls` (number, required, >= 1): Số calls thêm
- `price` (number, required, >= 0): Giá
- `currency` (string, required): Mã tiền tệ
- `isActive` (boolean, optional, default: true): Trạng thái

**Response (201):**
```json
{
  "id": "new-uuid",
  "name": "Gói Mở Rộng 20K",
  "description": "Thêm 20,000 API calls - Tiết kiệm 40%",
  "additionalCalls": 20000,
  "price": "599000.00",
  "currency": "VND",
  "isActive": true,
  "createdAt": "2025-10-05T10:00:00.000Z",
  "updatedAt": "2025-10-05T10:00:00.000Z"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/admin/packages/extensions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gói Mở Rộng 20K",
    "additionalCalls": 20000,
    "price": 599000,
    "currency": "VND"
  }'
```

---

### 4. Update API Extension Package

**PUT** `/api/admin/packages/extensions/:id`

Cập nhật gói mở rộng.

**Request Body:**
```json
{
  "price": 549000,
  "description": "Thêm 20,000 API calls - Khuyến mãi 45%"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Gói Mở Rộng 20K",
  "description": "Thêm 20,000 API calls - Khuyến mãi 45%",
  "additionalCalls": 20000,
  "price": "549000.00",
  "currency": "VND",
  "isActive": true,
  "updatedAt": "2025-10-05T11:00:00.000Z"
}
```

**cURL:**
```bash
curl -X PUT http://localhost:3000/api/admin/packages/extensions/$EXTENSION_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 549000
  }'
```

---

### 5. Delete API Extension Package

**DELETE** `/api/admin/packages/extensions/:id`

Xóa gói mở rộng (soft delete).

**Response (204):** No Content

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/admin/packages/extensions/$EXTENSION_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 6. Get API Extension Package Statistics

**GET** `/api/admin/packages/extensions/:id/stats`

Xem thống kê usage của gói mở rộng.

**Response (200):**
```json
{
  "package": {
    "id": "uuid",
    "name": "Gói Mở Rộng 5K",
    "additionalCalls": 5000,
    "price": "199000.00"
  },
  "stats": {
    "totalPurchases": 45,
    "totalRevenue": 8955000,
    "totalCallsSold": 225000
  }
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/admin/packages/extensions/$EXTENSION_ID/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 📊 Overview & Statistics

### Get Packages Overview

**GET** `/api/admin/packages/overview`

Xem tổng quan về tất cả các gói và revenue.

**Response (200):**
```json
{
  "subscriptionPackages": {
    "total": 4,
    "active": 3,
    "packages": [
      {
        "id": "uuid",
        "name": "Gói Cơ Bản",
        "price": "99000.00",
        "apiLimit": 1000,
        "isActive": true
      }
    ]
  },
  "extensionPackages": {
    "total": 3,
    "active": 3,
    "packages": [
      {
        "id": "uuid",
        "name": "Gói Mở Rộng 1K",
        "additionalCalls": 1000,
        "price": "49000.00",
        "isActive": true
      }
    ]
  },
  "usage": {
    "totalSubscriptions": 250,
    "activeSubscriptions": 180,
    "totalExtensionPurchases": 85
  },
  "revenue": {
    "subscriptions": 34500000,
    "extensions": 12450000,
    "total": 46950000
  }
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/admin/packages/overview \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 💡 Examples

### Complete Admin Workflow

#### 1. Login as Admin
```bash
ADMIN_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin-password"
  }' | jq -r '.accessToken')
```

#### 2. View Overview
```bash
curl -X GET http://localhost:3000/api/admin/packages/overview \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 3. Create New Subscription Package
```bash
curl -X POST http://localhost:3000/api/admin/packages/subscriptions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gói VIP",
    "description": "Gói VIP cao cấp",
    "price": 1999000,
    "currency": "VND",
    "durationDays": 365,
    "maxVirtualPortfolios": 50,
    "apiLimit": 999999,
    "features": {
      "everything": true
    }
  }'
```

#### 4. Create New Extension Package
```bash
curl -X POST http://localhost:3000/api/admin/packages/extensions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gói Mở Rộng 50K",
    "description": "Thêm 50,000 API calls - Best value!",
    "additionalCalls": 50000,
    "price": 1299000,
    "currency": "VND"
  }'
```

#### 5. View Package Statistics
```bash
# Subscription package stats
curl -X GET http://localhost:3000/api/admin/packages/subscriptions/$PACKAGE_ID/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Extension package stats
curl -X GET http://localhost:3000/api/admin/packages/extensions/$EXTENSION_ID/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 6. Update Package
```bash
# Update price
curl -X PUT http://localhost:3000/api/admin/packages/subscriptions/$PACKAGE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1799000,
    "description": "Gói VIP cao cấp - Khuyến mãi 10%"
  }'
```

#### 7. Deactivate Package
```bash
curl -X PUT http://localhost:3000/api/admin/packages/subscriptions/$PACKAGE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

---

## 📋 Summary

### Subscription Packages Endpoints (6)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/packages/subscriptions` | List all |
| GET | `/admin/packages/subscriptions/:id` | Get details |
| POST | `/admin/packages/subscriptions` | Create |
| PUT | `/admin/packages/subscriptions/:id` | Update |
| DELETE | `/admin/packages/subscriptions/:id` | Delete |
| GET | `/admin/packages/subscriptions/:id/stats` | Statistics |

### API Extension Packages Endpoints (6)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/packages/extensions` | List all |
| GET | `/admin/packages/extensions/:id` | Get details |
| POST | `/admin/packages/extensions` | Create |
| PUT | `/admin/packages/extensions/:id` | Update |
| DELETE | `/admin/packages/extensions/:id` | Delete |
| GET | `/admin/packages/extensions/:id/stats` | Statistics |

### Overview Endpoint (1)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/packages/overview` | Full overview |

**Total: 13 new admin endpoints**

---

## 🔒 Security Notes

1. **Admin Only**: Tất cả endpoints yêu cầu admin role
2. **Soft Delete**: Delete operations set `isActive = false`
3. **Validation**: Ngăn xóa packages đang được sử dụng
4. **Audit**: Nên log tất cả admin actions

---

## ⚠️ Important Notes

### Khi xóa Subscription Package:
- ✅ Được phép nếu không có active subscriptions
- ❌ Bị chặn nếu có users đang sử dụng
- 💡 Soft delete (set `isActive = false`)

### Khi tạo Package:
- Name phải unique
- Price >= 0
- DurationDays >= 1 (cho subscription)
- AdditionalCalls >= 1 (cho extension)

### Statistics:
- Real-time data
- Tính cả expired/cancelled subscriptions
- Revenue = tổng giá trị đã thu

---

**Last Updated:** 2025-10-05  
**Version:** 2.0.0  
**Total Endpoints:** 13 admin endpoints

