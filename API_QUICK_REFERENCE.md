# API Quick Reference

Tham khảo nhanh các endpoints quan trọng.

## 🚀 Base URL
```
http://localhost:3000/api
```

---

## 📍 Endpoints Overview

### Authentication (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Đăng ký tài khoản mới |
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/refresh` | Refresh token |

### Chat API (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Chat với AriX AI |
| GET | `/chat/usage` | Xem API usage hiện tại |
| GET | `/chat/stats?days=7` | Thống kê usage |

### API Extension Packages
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api-extensions/packages` | ❌ | Xem tất cả gói mở rộng |
| GET | `/api-extensions/packages/:id` | ❌ | Xem chi tiết gói |
| POST | `/api-extensions/purchase` | ✅ | Mua gói mở rộng |
| GET | `/api-extensions/my-extensions` | ✅ | Gói đã mua (subscription hiện tại) |
| GET | `/api-extensions/history` | ✅ | Lịch sử mua hàng |

### Subscription Management (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subscriptions/packages` | Xem gói subscription |
| POST | `/subscriptions/subscribe` | Mua gói subscription |
| GET | `/subscriptions/current` | Gói hiện tại |

### Admin Package Management (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/packages/subscriptions` | Quản lý gói subscription |
| POST | `/admin/packages/subscriptions` | Tạo gói subscription |
| PUT | `/admin/packages/subscriptions/:id` | Cập nhật gói |
| DELETE | `/admin/packages/subscriptions/:id` | Xóa gói |
| GET | `/admin/packages/extensions` | Quản lý gói mở rộng |
| POST | `/admin/packages/extensions` | Tạo gói mở rộng |
| GET | `/admin/packages/overview` | Tổng quan packages |

---

## 💬 Chat API - Quick Examples

### Chat với AI
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Phân tích VIC"}'
```

### Check Usage
```bash
curl http://localhost:3000/api/chat/usage \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔄 API Extensions - Quick Examples

### Xem gói mở rộng (Public)
```bash
curl http://localhost:3000/api/api-extensions/packages
```

### Mua gói mở rộng
```bash
curl -X POST http://localhost:3000/api/api-extensions/purchase \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "extensionPackageId": "uuid-here",
    "paymentReference": "PAY_123"
  }'
```

### Xem gói đã mua
```bash
curl http://localhost:3000/api/api-extensions/my-extensions \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Response Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid request |
| 401 | Unauthorized | No/invalid token |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 502 | Bad Gateway | External API error |

---

## 🎯 Common Workflows

### 1. New User Flow
```
Register → Login → (Use Free 100 calls) → Buy Subscription → Chat
```

### 2. Approaching Limit Flow
```
Check Usage → (remaining < 10%) → View Extension Packages → Purchase → Continue Chatting
```

### 3. Subscription Renewal Flow
```
Subscription Expires → Renew → apiCallsUsed Reset to 0 → Continue Chatting
```

---

## 🔑 Authentication Header

All protected endpoints require:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📦 Package Pricing

### Subscription Packages
- **Free**: 100 calls - 0đ
- **Cơ Bản**: 1,000 calls - 99,000đ
- **Chuyên Nghiệp**: 5,000 calls - 299,000đ
- **Doanh Nghiệp**: 999,999 calls - 999,000đ

### Extension Packages
- **1K**: +1,000 calls - 49,000đ (49đ/call)
- **5K**: +5,000 calls - 199,000đ (39.8đ/call) - Save 20%
- **10K**: +10,000 calls - 349,000đ (34.9đ/call) - Save 30%

---

## 🔗 Full Documentation

- **[API Complete Documentation](./API_COMPLETE_DOCUMENTATION.md)** - Chi tiết đầy đủ
- **[CHAT_API_V2](./CHAT_API_V2.md)** - Chat API chi tiết
- **[User Management](./USER_MANAGEMENT_API.md)** - Admin User APIs
- **[Admin Package Management](./ADMIN_PACKAGE_MANAGEMENT_API.md)** - Admin Package APIs
- **[Start Here](./START_HERE.md)** - Getting started

---

**Quick Help:** Xem [API_COMPLETE_DOCUMENTATION.md](./API_COMPLETE_DOCUMENTATION.md) để có thông tin đầy đủ!

