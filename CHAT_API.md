# Chat API - AriX AI Integration

API chat tích hợp với AriX AI để phân tích chứng khoán thông minh với các tính năng:
- ✅ Yêu cầu xác thực JWT (login required)
- ✅ Kiểm tra giới hạn API dựa trên gói subscription
- ✅ Theo dõi usage hàng ngày
- ✅ Tự động reset sau 24h

---

## 🔐 Xác thực

Tất cả các API yêu cầu **JWT token** trong header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📊 API Limit theo gói

| Gói | API Limit/Ngày |
|-----|----------------|
| **Free** | 100 requests |
| **Gói Cơ Bản** | 1,000 requests |
| **Gói Chuyên Nghiệp** | 5,000 requests |
| **Gói Doanh Nghiệp** | 999,999 requests |

---

## 📡 Endpoints

### 1. Chat với AriX AI

**POST** `/api/chat`

Gửi message đến AriX AI để phân tích cổ phiếu hoặc hỏi đáp.

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

**Response Error - Rate Limit (429):**
```json
{
  "statusCode": 429,
  "message": "Đã vượt quá giới hạn API cho ngày hôm nay",
  "currentUsage": 100,
  "limit": 100,
  "resetDate": "2025-10-06T00:00:00.000Z"
}
```

**Response Error - Unauthorized (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

### 2. Kiểm tra Usage hiện tại

**GET** `/api/chat/usage`

Xem thông tin sử dụng API của user hiện tại.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "currentUsage": 45,
  "limit": 1000,
  "remaining": 955,
  "resetDate": "2025-10-06T00:00:00.000Z"
}
```

---

### 3. Thống kê Usage

**GET** `/api/chat/stats?days=7`

Xem thống kê chi tiết sử dụng API trong X ngày gần đây.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `days` (optional): Số ngày thống kê (default: 7)

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

---

## 💡 Ví dụ sử dụng

### JavaScript/TypeScript

```typescript
// 1. Login để lấy token
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { accessToken } = await loginResponse.json();

// 2. Chat với AriX AI
const chatResponse = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    message: 'Phân tích cổ phiếu VIC'
  })
});

const result = await chatResponse.json();
console.log(result.message);

// 3. Kiểm tra usage
const usageResponse = await fetch('http://localhost:3000/api/chat/usage', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const usage = await usageResponse.json();
console.log(`Đã dùng: ${usage.currentUsage}/${usage.limit}`);
```

### cURL

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.accessToken')

# 2. Chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Phân tích cổ phiếu VIC"
  }'

# 3. Check usage
curl -X GET http://localhost:3000/api/chat/usage \
  -H "Authorization: Bearer $TOKEN"

# 4. Get stats
curl -X GET "http://localhost:3000/api/chat/stats?days=7" \
  -H "Authorization: Bearer $TOKEN"
```

### Python

```python
import requests

# 1. Login
login_response = requests.post(
    'http://localhost:3000/api/auth/login',
    json={
        'email': 'user@example.com',
        'password': 'password123'
    }
)
token = login_response.json()['accessToken']

# 2. Chat
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

chat_response = requests.post(
    'http://localhost:3000/api/chat',
    headers=headers,
    json={'message': 'Phân tích cổ phiếu VIC'}
)

result = chat_response.json()
print(result['message'])

# 3. Check usage
usage_response = requests.get(
    'http://localhost:3000/api/chat/usage',
    headers=headers
)

usage = usage_response.json()
print(f"Đã dùng: {usage['currentUsage']}/{usage['limit']}")
```

---

## 🔧 Cấu hình

### Environment Variables

Thêm vào file `.env`:

```env
# AriX API Configuration
ARIX_API_URL=http://localhost:5999
```

---

## 🗄️ Database Migration

Chạy migration để tạo bảng `api_usage`:

```bash
npm run migration:run
```

Hoặc:

```bash
./run-migrations.sh
```

**Migration files:**
- `1727950000006-RenameApiLimitColumn.ts` - Đổi tên cột `daily_api_limit` → `api_limit`
- `1727950000007-CreateApiUsageTable.ts` - Tạo bảng `api_usage`

---

## 📊 Database Schema

### Bảng: `api_usage`

| Column | Type | Description |
|--------|------|-------------|
| `id` | varchar(36) | UUID primary key |
| `user_id` | varchar(36) | Foreign key to users |
| `usage_date` | date | Ngày sử dụng (YYYY-MM-DD) |
| `request_count` | int | Số lượng requests |
| `total_tokens` | int | Tổng số tokens đã dùng |
| `created_at` | timestamp | Thời gian tạo |
| `updated_at` | timestamp | Thời gian cập nhật |

**Indexes:**
- `IDX_api_usage_user_date` (user_id, usage_date)
- `IDX_api_usage_date` (usage_date)

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE on delete)

---

## ⚠️ Error Handling

### 401 Unauthorized
**Nguyên nhân:** Không có token hoặc token không hợp lệ  
**Giải pháp:** Login lại để lấy token mới

### 429 Too Many Requests
**Nguyên nhân:** Đã vượt quá giới hạn API  
**Giải pháp:** 
- Đợi đến ngày mai (reset tự động)
- Nâng cấp gói subscription

### 502 Bad Gateway
**Nguyên nhân:** AriX API không phản hồi hoặc lỗi  
**Giải pháp:** 
- Kiểm tra AriX API có đang chạy không
- Kiểm tra `ARIX_API_URL` trong `.env`

---

## 🚀 Features

### ✅ Đã implement

- [x] JWT Authentication
- [x] API Rate Limiting theo subscription
- [x] Track daily usage
- [x] Auto reset hàng ngày
- [x] Usage statistics
- [x] Token counting
- [x] Error handling

### 🔜 Có thể mở rộng

- [ ] Caching responses
- [ ] Webhooks khi hết quota
- [ ] Admin dashboard để xem usage
- [ ] Quota sharing trong team
- [ ] Priority queue cho premium users

---

## 🔒 Bảo mật

### Rate Limiting
- Mỗi user có limit riêng dựa trên subscription
- Check limit **trước** khi gọi AriX API
- Increment counter **sau** khi thành công
- Reset tự động vào 00:00 hàng ngày

### Authentication
- Tất cả endpoints yêu cầu JWT token
- Token expire sau 15 phút (refresh token: 7 ngày)
- User phải active (`isActive = true`)

---

## 📝 Notes

1. **AriX API phải chạy trước:** Đảm bảo AriX API đang chạy ở `http://localhost:5999`
2. **Response time:** Chat API có thể mất 10-30s tùy vào độ phức tạp
3. **Timeout:** Frontend nên set timeout ≥ 60s
4. **Markdown:** Response message ở format Markdown, cần parser trên client

---

## 🆘 Troubleshooting

### Lỗi: "Cannot connect to AriX API"
```bash
# Kiểm tra AriX API
curl http://localhost:5999/api

# Expected: "hello"
```

### Lỗi: "Too many requests"
```bash
# Check current usage
curl http://localhost:3000/api/chat/usage \
  -H "Authorization: Bearer $TOKEN"
```

### Lỗi: Migration không chạy
```bash
# Check migration status
npm run migration:show

# Force run migrations
npm run migration:run
```

---

## 📚 Related Documentation

- [AriX API Documentation](/Users/danhtrongtran/Documents/iqx/lastest/AriX/API_DOCUMENTATION.md)
- [User Management API](./USER_MANAGEMENT_API.md)
- [Subscription Packages](./START_HERE.md)

---

**Last Updated:** 2025-10-05  
**API Version:** 1.0.0

