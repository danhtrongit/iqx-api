# API Complete Documentation - Chat & API Extensions

Hệ thống API hoàn chỉnh cho Chat AI và quản lý gói mở rộng API.

---

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Xác thực](#xác-thực)
3. [Chat API](#chat-api)
4. [API Extension Packages](#api-extension-packages)
5. [Ví dụ sử dụng](#ví-dụ-sử-dụng)
6. [Error Codes](#error-codes)
7. [Database Schema](#database-schema)

---

## 🎯 Tổng quan

### Base URL
```
http://localhost:3000/api
```

### Luồng hoạt động
```
1. User đăng ký/đăng nhập → Nhận JWT token
2. User mua gói Subscription → Nhận X API calls
3. User sử dụng Chat API → apiCallsUsed++
4. Khi sắp hết → User mua gói mở rộng → apiCallsLimit += Y
5. Khi hết hạn → User gia hạn → Reset apiCallsUsed = 0
```

---

## 🔐 Xác thực

Tất cả endpoints yêu cầu authentication đều cần JWT token:

```
Authorization: Bearer <access_token>
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Response
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

---

## 💬 Chat API

### 1. Chat với AriX AI

Gửi message để phân tích cổ phiếu hoặc hỏi đáp.

**Endpoint:** `POST /api/chat`

**Authentication:** Required ✅

**Request:**
```json
{
  "message": "Phân tích cổ phiếu VIC",
  "model": "gpt-5-chat-latest"  // Optional
}
```

**Response Success (200):**
```json
{
  "success": true,
  "type": "stock_analysis",
  "ticker": "VIC",
  "message": "# 📊 Phân tích cổ phiếu VIC\n\n## 📈 Kết quả kinh doanh...",
  "queryAnalysis": {
    "intent": "stock_analysis",
    "confidence": 0.95
  },
  "usage": {
    "prompt_tokens": 15234,
    "completion_tokens": 892,
    "total_tokens": 16126
  }
}
```

**Response Error (429 - Rate Limit):**
```json
{
  "statusCode": 429,
  "message": "Đã vượt quá giới hạn API của gói subscription",
  "currentUsage": 1000,
  "limit": 1000,
  "expiresAt": "2025-11-05T00:00:00.000Z",
  "suggestion": "Mua gói mở rộng API hoặc đợi đến khi gia hạn gói"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Phân tích cổ phiếu VIC"
  }'
```

---

### 2. Kiểm tra API Usage

Xem thông tin sử dụng API của subscription hiện tại.

**Endpoint:** `GET /api/chat/usage`

**Authentication:** Required ✅

**Response (200):**
```json
{
  "currentUsage": 450,
  "limit": 1000,
  "remaining": 550,
  "resetDate": "2025-11-05T00:00:00.000Z"
}
```

**Response Free Tier:**
```json
{
  "currentUsage": 0,
  "limit": 100,
  "remaining": 100,
  "resetDate": "N/A - Free tier has no expiration"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/chat/usage \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3. Thống kê API Usage

Xem chi tiết usage theo ngày (cho mục đích analytics).

**Endpoint:** `GET /api/chat/stats?days=7`

**Authentication:** Required ✅

**Query Parameters:**
- `days` (optional): Số ngày cần xem (default: 7)

**Response (200):**
```json
{
  "period": "7 days",
  "totalRequests": 156,
  "totalTokens": 245890,
  "dailyBreakdown": [
    {
      "date": "2025-10-05",
      "requests": 45,
      "tokens": 67234
    },
    {
      "date": "2025-10-04",
      "requests": 32,
      "tokens": 51200
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/chat/stats?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔄 API Extension Packages

### 1. Xem danh sách gói mở rộng

Lấy tất cả gói mở rộng đang có sẵn.

**Endpoint:** `GET /api/api-extensions/packages`

**Authentication:** Not Required ❌

**Response (200):**
```json
[
  {
    "id": "uuid-1",
    "name": "Gói Mở Rộng 1K",
    "description": "Thêm 1,000 API calls vào gói subscription hiện tại",
    "additionalCalls": 1000,
    "price": 49000,
    "currency": "VND",
    "isActive": true,
    "pricePerCall": 49
  },
  {
    "id": "uuid-2",
    "name": "Gói Mở Rộng 5K",
    "description": "Thêm 5,000 API calls - Tiết kiệm 20%",
    "additionalCalls": 5000,
    "price": 199000,
    "currency": "VND",
    "isActive": true,
    "pricePerCall": 39.8
  },
  {
    "id": "uuid-3",
    "name": "Gói Mở Rộng 10K",
    "description": "Thêm 10,000 API calls - Tiết kiệm 30%",
    "additionalCalls": 10000,
    "price": 349000,
    "currency": "VND",
    "isActive": true,
    "pricePerCall": 34.9
  }
]
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/api-extensions/packages
```

---

### 2. Xem chi tiết gói mở rộng

Lấy thông tin chi tiết của một gói cụ thể.

**Endpoint:** `GET /api/api-extensions/packages/:id`

**Authentication:** Not Required ❌

**Response (200):**
```json
{
  "id": "uuid-1",
  "name": "Gói Mở Rộng 1K",
  "description": "Thêm 1,000 API calls vào gói subscription hiện tại",
  "additionalCalls": 1000,
  "price": 49000,
  "currency": "VND",
  "isActive": true
}
```

**Response Error (404):**
```json
{
  "statusCode": 404,
  "message": "Gói mở rộng không tồn tại"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/api-extensions/packages/uuid-1
```

---

### 3. Mua gói mở rộng

Mua gói mở rộng để tăng API limit cho subscription hiện tại.

**Endpoint:** `POST /api/api-extensions/purchase`

**Authentication:** Required ✅

**Request:**
```json
{
  "extensionPackageId": "uuid-1",
  "paymentReference": "PAY_123456"  // Optional - Mã thanh toán
}
```

**Response Success (201):**
```json
{
  "id": "purchase-uuid",
  "extensionPackageName": "Gói Mở Rộng 5K",
  "additionalCalls": 5000,
  "price": 199000,
  "currency": "VND",
  "purchasedAt": "2025-10-05T10:30:00.000Z",
  "subscriptionId": "subscription-uuid"
}
```

**Response Error (400 - No Active Subscription):**
```json
{
  "statusCode": 400,
  "message": "Bạn cần có gói subscription đang hoạt động để mua gói mở rộng"
}
```

**Response Error (400 - Expired Subscription):**
```json
{
  "statusCode": 400,
  "message": "Gói subscription của bạn đã hết hạn. Vui lòng gia hạn trước khi mua gói mở rộng"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/api-extensions/purchase \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "extensionPackageId": "uuid-2",
    "paymentReference": "PAY_789012"
  }'
```

---

### 4. Xem gói mở rộng đã mua (Subscription hiện tại)

Xem tất cả gói mở rộng đã mua cho subscription đang active.

**Endpoint:** `GET /api/api-extensions/my-extensions`

**Authentication:** Required ✅

**Response (200):**
```json
[
  {
    "id": "purchase-uuid-1",
    "extensionPackageName": "Gói Mở Rộng 1K",
    "additionalCalls": 1000,
    "price": 49000,
    "currency": "VND",
    "purchasedAt": "2025-10-01T08:00:00.000Z",
    "subscriptionId": "subscription-uuid"
  },
  {
    "id": "purchase-uuid-2",
    "extensionPackageName": "Gói Mở Rộng 5K",
    "additionalCalls": 5000,
    "price": 199000,
    "currency": "VND",
    "purchasedAt": "2025-10-03T14:30:00.000Z",
    "subscriptionId": "subscription-uuid"
  }
]
```

**Response (200 - No Active Subscription):**
```json
[]
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/api-extensions/my-extensions \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5. Xem lịch sử mua gói mở rộng

Xem tất cả gói mở rộng đã từng mua (bao gồm cả subscription cũ).

**Endpoint:** `GET /api/api-extensions/history`

**Authentication:** Required ✅

**Response (200):**
```json
[
  {
    "id": "purchase-uuid-3",
    "extensionPackageName": "Gói Mở Rộng 1K",
    "additionalCalls": 1000,
    "price": 49000,
    "currency": "VND",
    "purchasedAt": "2025-10-01T08:00:00.000Z",
    "subscriptionId": "old-subscription-uuid"
  },
  {
    "id": "purchase-uuid-4",
    "extensionPackageName": "Gói Mở Rộng 5K",
    "additionalCalls": 5000,
    "price": 199000,
    "currency": "VND",
    "purchasedAt": "2025-09-15T12:00:00.000Z",
    "subscriptionId": "old-subscription-uuid-2"
  }
]
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/api-extensions/history \
  -H "Authorization: Bearer $TOKEN"
```

---

## 💡 Ví dụ sử dụng

### Full Flow: Từ đăng ký đến sử dụng API

#### 1. Đăng ký & Login
```bash
# Đăng ký
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "fullName": "Nguyen Van A"
  }'

# Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }' | jq -r '.accessToken')

echo "Token: $TOKEN"
```

#### 2. Check current API usage (Free tier)
```bash
curl -X GET http://localhost:3000/api/chat/usage \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "currentUsage": 0,
#   "limit": 100,
#   "remaining": 100,
#   "resetDate": "N/A - Free tier has no expiration"
# }
```

#### 3. Chat với AI
```bash
# Chat lần 1
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Phân tích VIC"}'

# Check usage
# currentUsage: 1, remaining: 99
```

#### 4. Mua gói Subscription
```bash
# Xem danh sách gói
curl -X GET http://localhost:3000/api/subscriptions/packages

# Mua Gói Cơ Bản (1,000 calls)
curl -X POST http://localhost:3000/api/subscriptions/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "basic-package-id",
    "paymentReference": "PAY_123"
  }'

# Check usage mới
curl -X GET http://localhost:3000/api/chat/usage \
  -H "Authorization: Bearer $TOKEN"
# Response: limit: 1000, remaining: 1000
```

#### 5. Sử dụng đến gần hết quota
```bash
# Giả sử đã dùng 950 calls
# Check usage: currentUsage: 950, remaining: 50

# Xem gói mở rộng
curl -X GET http://localhost:3000/api/api-extensions/packages

# Mua gói mở rộng 5K
curl -X POST http://localhost:3000/api/api-extensions/purchase \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "extensionPackageId": "extension-5k-id",
    "paymentReference": "PAY_456"
  }'

# Check usage sau khi mua
curl -X GET http://localhost:3000/api/chat/usage \
  -H "Authorization: Bearer $TOKEN"
# Response: currentUsage: 950, limit: 6000, remaining: 5050
```

#### 6. Xem lịch sử extensions
```bash
# Xem extensions của subscription hiện tại
curl -X GET http://localhost:3000/api/api-extensions/my-extensions \
  -H "Authorization: Bearer $TOKEN"

# Xem tất cả lịch sử
curl -X GET http://localhost:3000/api/api-extensions/history \
  -H "Authorization: Bearer $TOKEN"
```

---

### TypeScript/JavaScript Example

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
let token: string;

// 1. Login
async function login() {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: 'user@example.com',
    password: 'password123'
  });
  token = response.data.accessToken;
}

// 2. Check API usage
async function checkUsage() {
  const response = await axios.get(`${API_URL}/chat/usage`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Usage:', response.data);
  return response.data;
}

// 3. Chat với AI
async function chat(message: string) {
  try {
    const response = await axios.post(
      `${API_URL}/chat`,
      { message },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded!');
      // Suggest buying extension package
      await showExtensionPackages();
    }
    throw error;
  }
}

// 4. Xem gói mở rộng
async function showExtensionPackages() {
  const response = await axios.get(`${API_URL}/api-extensions/packages`);
  console.log('Available packages:', response.data);
  return response.data;
}

// 5. Mua gói mở rộng
async function purchaseExtension(packageId: string) {
  const response = await axios.post(
    `${API_URL}/api-extensions/purchase`,
    { extensionPackageId: packageId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('Purchase successful:', response.data);
  return response.data;
}

// 6. Main flow
async function main() {
  await login();
  
  // Check current usage
  const usage = await checkUsage();
  console.log(`Remaining: ${usage.remaining}/${usage.limit}`);
  
  // Chat
  const result = await chat('Phân tích VIC');
  console.log(result.message);
  
  // If approaching limit, show warning
  const newUsage = await checkUsage();
  if (newUsage.remaining < newUsage.limit * 0.1) {
    console.warn('⚠️ Sắp hết quota!');
    const packages = await showExtensionPackages();
    
    // Auto purchase extension
    await purchaseExtension(packages[1].id); // Buy 5K package
  }
}

main();
```

---

## ⚠️ Error Codes

| Code | Message | Description | Solution |
|------|---------|-------------|----------|
| **401** | Unauthorized | Token không hợp lệ hoặc hết hạn | Login lại |
| **400** | Bad Request | Request body không đúng format | Kiểm tra lại request |
| **400** | Bạn cần có gói subscription đang hoạt động | Chưa có subscription active | Mua gói subscription |
| **400** | Gói subscription đã hết hạn | Subscription expired | Gia hạn gói |
| **404** | Gói mở rộng không tồn tại | Extension package ID không đúng | Check lại package ID |
| **429** | Đã vượt quá giới hạn API | Hết quota API | Mua gói mở rộng hoặc đợi gia hạn |
| **502** | Không thể kết nối đến AriX API | AriX API down | Check AriX service |

---

## 🗄️ Database Schema

### `user_subscriptions`
```sql
CREATE TABLE user_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  package_id VARCHAR(36) NOT NULL,
  status ENUM('active', 'expired', 'cancelled'),
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  api_calls_used INT DEFAULT 0,
  api_calls_limit INT,
  -- other fields...
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (package_id) REFERENCES subscription_packages(id)
);
```

### `api_extension_packages`
```sql
CREATE TABLE api_extension_packages (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) UNIQUE,
  description TEXT,
  additional_calls INT NOT NULL,
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'VND',
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `user_api_extensions`
```sql
CREATE TABLE user_api_extensions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  subscription_id VARCHAR(36) NOT NULL,
  extension_package_id VARCHAR(36) NOT NULL,
  additional_calls INT NOT NULL,
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'VND',
  payment_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (extension_package_id) REFERENCES api_extension_packages(id) ON DELETE CASCADE
);
```

### `api_usage` (Statistics)
```sql
CREATE TABLE api_usage (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  usage_date DATE NOT NULL,
  request_count INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, usage_date)
);
```

---

## 🚀 Setup & Migration

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```env
# .env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=iqx_db

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m

ARIX_API_URL=http://localhost:5999
```

### 3. Run migrations
```bash
npm run migration:run
```

Migrations sẽ chạy:
- ✅ Rename `daily_api_limit` → `api_limit`
- ✅ Create `api_usage` table
- ✅ Add `api_calls_used/limit` to subscriptions
- ✅ Create `api_extension_packages` table
- ✅ Create `user_api_extensions` table
- ✅ Seed 3 demo extension packages

### 4. Start server
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

---

## 📊 API Limits Summary

| Tier | API Calls | Giá | Thời hạn |
|------|-----------|-----|----------|
| **Free** | 100 | 0đ | Vĩnh viễn |
| **Gói Cơ Bản** | 1,000 | 99,000đ | 30 ngày |
| **Gói Chuyên Nghiệp** | 5,000 | 299,000đ | 30 ngày |
| **Gói Doanh Nghiệp** | 999,999 | 999,000đ | 30 ngày |

### Gói mở rộng:
| Gói | Thêm Calls | Giá | Giá/Call |
|-----|------------|-----|----------|
| **1K Extension** | +1,000 | 49,000đ | 49đ |
| **5K Extension** | +5,000 | 199,000đ | 39.8đ |
| **10K Extension** | +10,000 | 349,000đ | 34.9đ |

---

## 🔒 Security Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (httpOnly cookies hoặc secure storage)
3. **Implement rate limiting** ở API gateway level
4. **Validate payment references** trước khi activate
5. **Log all purchases** cho audit trail
6. **Monitor unusual usage patterns**

---

## 📞 Support

Nếu gặp vấn đề, liên hệ team IQX.

---

**Last Updated:** 2025-10-05  
**API Version:** 2.0.0  
**Author:** IQX Development Team

