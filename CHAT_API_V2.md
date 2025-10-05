# Chat API V2 - Subscription-Based API Limits

API chat tích hợp với AriX AI với giới hạn API theo từng lần mua gói subscription (không phải giới hạn hàng ngày).

## 🎯 Thay đổi chính so với V1

### V1 (Cũ - Daily Limit)
- ❌ Giới hạn theo ngày (reset mỗi 24h)
- ❌ Không liên quan đến gói subscription

### V2 (Mới - Package-Based Limit)
- ✅ Giới hạn theo từng lần mua gói
- ✅ Reset khi gia hạn hoặc mua gói mới
- ✅ Có thể mua gói mở rộng để tăng limit

---

## 📊 Cách hoạt động

### 1. Mua gói Subscription
```
User mua "Gói Cơ Bản" (1,000 API calls)
→ apiCallsLimit = 1,000
→ apiCallsUsed = 0
→ Remaining = 1,000
```

### 2. Sử dụng API
```
Gọi Chat API 45 lần
→ apiCallsUsed = 45
→ Remaining = 955
```

### 3. Hết quota?
**Option A:** Mua gói mở rộng
```
Mua "Gói Mở Rộng 5K"
→ apiCallsLimit = 1,000 + 5,000 = 6,000
→ apiCallsUsed = 45
→ Remaining = 5,955
```

**Option B:** Đợi gia hạn gói
```
Gia hạn "Gói Cơ Bản"
→ apiCallsLimit = 1,000
→ apiCallsUsed = 0 (reset)
→ Remaining = 1,000
```

---

## 📦 Gói Subscription

| Gói | API Calls | Giá | Thời hạn |
|-----|-----------|-----|----------|
| **Free** | 100 | 0đ | Vĩnh viễn |
| **Gói Cơ Bản** | 1,000 | 99,000đ | 30 ngày |
| **Gói Chuyên Nghiệp** | 5,000 | 299,000đ | 30 ngày |
| **Gói Doanh Nghiệp** | 999,999 | 999,000đ | 30 ngày |

---

## 🔄 Gói Mở Rộng API

Tăng thêm API calls cho gói subscription hiện tại:

| Gói | Thêm API Calls | Giá | Tiết kiệm |
|-----|----------------|-----|-----------|
| **Gói Mở Rộng 1K** | +1,000 | 49,000đ | - |
| **Gói Mở Rộng 5K** | +5,000 | 199,000đ | 20% |
| **Gói Mở Rộng 10K** | +10,000 | 349,000đ | 30% |

**Lưu ý:**
- Gói mở rộng chỉ áp dụng cho subscription ACTIVE hiện tại
- Khi gia hạn subscription, API calls được reset về limit gốc của gói
- Gói mở rộng không được chuyển sang subscription mới

---

## 🔐 Xác thực

Tất cả API yêu cầu **JWT token**:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📡 Endpoints

### 1. Chat với AriX AI

**POST** `/api/chat`

Gửi message đến AriX AI để phân tích cổ phiếu.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
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
  "message": "# 📊 Phân tích cổ phiếu VIC...",
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

**Response Error - Rate Limit (429):**
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

---

### 2. Kiểm tra Usage hiện tại

**GET** `/api/chat/usage`

Xem thông tin sử dụng API của subscription hiện tại.

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

---

### 3. Thống kê Usage

**GET** `/api/chat/stats?days=7`

Xem thống kê chi tiết (vẫn track theo ngày cho mục đích phân tích).

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
    }
  ]
}
```

---

## 💡 Ví dụ sử dụng

### Scenario 1: User mới (Free tier)

```typescript
// Login
const { accessToken } = await login('user@example.com', 'password');

// Check usage
const usage = await fetch('/api/chat/usage', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
// Response: { currentUsage: 0, limit: 100, remaining: 100 }

// Chat 100 lần...

// Chat lần thứ 101 → Error 429
// Message: "Đã vượt quá giới hạn API. Vui lòng nâng cấp gói..."
// Suggestion: "Mua gói subscription hoặc gói mở rộng API"
```

---

### Scenario 2: User mua Gói Cơ Bản

```typescript
// Mua gói Cơ Bản (1,000 calls)
await purchaseSubscription('basic-package-id');

// Check usage
const usage = await fetch('/api/chat/usage', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
// Response: { currentUsage: 0, limit: 1000, remaining: 1000 }

// Chat 950 lần...

// Check usage
// Response: { currentUsage: 950, limit: 1000, remaining: 50 }
```

---

### Scenario 3: Sắp hết quota → Mua gói mở rộng

```typescript
// Current: { currentUsage: 980, limit: 1000, remaining: 20 }

// Mua Gói Mở Rộng 5K
await purchaseApiExtension('extension-5k-id');

// Check usage
// Response: { currentUsage: 980, limit: 6000, remaining: 5020 }

// Tiếp tục sử dụng thêm 5,020 calls
```

---

### Scenario 4: Gia hạn gói → Reset usage

```typescript
// Trước gia hạn: { currentUsage: 950, limit: 1000, remaining: 50 }

// Gia hạn Gói Cơ Bản
await renewSubscription();

// Sau gia hạn: { currentUsage: 0, limit: 1000, remaining: 1000 }
// ⚠️ Gói mở rộng cũ không còn, chỉ còn limit gốc của gói
```

---

## 🗄️ Database Schema

### Bảng: `user_subscriptions`

**Cột mới:**
| Column | Type | Description |
|--------|------|-------------|
| `api_calls_used` | int | Số API calls đã sử dụng |
| `api_calls_limit` | int | Giới hạn API calls của gói này |

### Bảng: `api_extension_packages`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | varchar | Tên gói (Gói Mở Rộng 1K) |
| `additional_calls` | int | Số calls được thêm |
| `price` | decimal | Giá |
| `is_active` | boolean | Còn bán không |

### Bảng: `user_api_extensions`

Track lịch sử mua gói mở rộng:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to users |
| `subscription_id` | uuid | FK to user_subscriptions |
| `extension_package_id` | uuid | FK to api_extension_packages |
| `additional_calls` | int | Số calls đã mua |
| `payment_reference` | varchar | Mã thanh toán |

---

## 🔧 Migrations

Chạy migrations để cập nhật database:

```bash
npm run migration:run
```

**Migration files:**
1. `1727950000008-AddApiCallsToSubscriptions.ts` - Thêm cột tracking vào user_subscriptions
2. `1727950000009-CreateApiExtensionTables.ts` - Tạo bảng gói mở rộng
3. `1727950000010-SeedApiExtensionPackages.ts` - Seed 3 gói mở rộng demo

---

## 📋 Logic Flow

### Khi tạo subscription mới:
```typescript
userSubscription = {
  ...
  apiCallsUsed: 0,
  apiCallsLimit: package.apiLimit,  // 1000, 5000, etc.
}
```

### Khi gọi Chat API:
```typescript
1. Check: apiCallsUsed < apiCallsLimit?
   - NO → Throw 429 Error
   - YES → Continue

2. Call AriX API

3. Increment: apiCallsUsed += 1

4. Return response
```

### Khi mua gói mở rộng:
```typescript
1. Check user có active subscription?
   - NO → Error

2. Create UserApiExtension record

3. Update subscription:
   apiCallsLimit += extensionPackage.additionalCalls

4. User tiếp tục dùng với limit mới
```

### Khi gia hạn subscription:
```typescript
1. Create new subscription với:
   apiCallsUsed = 0
   apiCallsLimit = package.apiLimit  // Reset về gốc

2. Old subscription → EXPIRED
```

---

## ⚠️ Important Notes

### 1. Gói mở rộng chỉ áp dụng cho subscription hiện tại
```
User mua Gói Cơ Bản (1,000 calls)
→ Mua Gói Mở Rộng 5K (+5,000)
→ Total: 6,000 calls

Sau 30 ngày, gia hạn Gói Cơ Bản
→ Reset về 1,000 calls
→ Gói mở rộng cũ không còn
```

### 2. Free tier vs Subscription
- **Free tier:** Không có record trong `user_subscriptions`
- **Subscription:** Có record ACTIVE trong `user_subscriptions`

### 3. API Usage tracking
- `api_usage` table: Vẫn track theo ngày cho analytics
- `user_subscriptions.api_calls_used`: Track tổng usage của gói

---

## 🚀 Best Practices

### 1. Hiển thị usage cho user
```typescript
// Luôn show cho user biết còn bao nhiêu calls
const usage = await getUserApiUsage(userId);
console.log(`Còn lại: ${usage.remaining}/${usage.limit} calls`);
```

### 2. Cảnh báo khi sắp hết
```typescript
if (usage.remaining < usage.limit * 0.1) {
  showWarning('Bạn sắp hết quota API. Mua gói mở rộng?');
}
```

### 3. Gợi ý nâng cấp
```typescript
if (usage.limit === 100) {
  showSuggestion('Nâng cấp lên Gói Cơ Bản để có 1,000 calls');
}
```

---

## 🆘 Troubleshooting

### Lỗi: "Đã vượt quá giới hạn API"
**Giải pháp:**
1. Check current usage: `GET /api/chat/usage`
2. Mua gói mở rộng (tức thì)
3. Hoặc đợi gia hạn gói (reset usage)

### Migration lỗi
```bash
# Check migration status
npm run migration:show

# Rollback nếu cần
npm run migration:revert
```

### Usage không đúng
```sql
-- Check subscription của user
SELECT id, package_id, api_calls_used, api_calls_limit, expires_at
FROM user_subscriptions
WHERE user_id = 'xxx' AND status = 'active';

-- Check extension packages
SELECT * FROM user_api_extensions
WHERE subscription_id = 'xxx';
```

---

## 📚 Related Files

- **Entities:**
  - `src/entities/user-subscription.entity.ts`
  - `src/entities/api-extension-package.entity.ts`
  - `src/entities/user-api-extension.entity.ts`

- **Services:**
  - `src/chat/chat.service.ts`
  - `src/subscriptions/subscription.service.ts`

- **Migrations:**
  - `src/migrations/1727950000008-AddApiCallsToSubscriptions.ts`
  - `src/migrations/1727950000009-CreateApiExtensionTables.ts`
  - `src/migrations/1727950000010-SeedApiExtensionPackages.ts`

---

**Last Updated:** 2025-10-05  
**API Version:** 2.0.0

