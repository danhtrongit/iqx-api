# IQX Trading API Documentation Index

## 📚 Tài liệu API đầy đủ

Chào mừng bạn đến với tài liệu API IQX Trading - hệ thống giao dịch chứng khoán ảo với đầy đủ tính năng xác thực, quản lý danh mục và giao dịch real-time.

---

## 🚀 Quick Start

### Base URLs
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.iqx.com/api`

### Interactive Documentation
- **Swagger UI**: `/api/docs`
- **Download OpenAPI Spec**:
  - JSON: `/api/docs-json`
  - YAML: `/api/docs-yaml`

---

## 📋 API Modules

### 🔐 [Authentication API](./AUTH_API.md)
**Base URL**: `/api/auth`

Xác thực người dùng, quản lý session và bảo mật tài khoản.

**Key Features**:
- JWT-based authentication
- Password reset & phone verification
- Role-based access control
- Session management

**Main Endpoints**:
```
POST   /auth/register          # Đăng ký tài khoản
POST   /auth/login            # Đăng nhập
GET    /auth/profile          # Lấy thông tin profile
POST   /auth/forgot-password  # Quên mật khẩu
POST   /auth/reset-password   # Reset mật khẩu
```

---

### 📈 [Symbols API](./SYMBOLS_API.md)
**Base URL**: `/api/symbols`

Thông tin mã chứng khoán từ thị trường Việt Nam với dữ liệu real-time từ VietCap.

**Key Features**:
- 1800+ mã chứng khoán từ HSX, HNX, UPCOM
- Tìm kiếm và filter nâng cao
- Auto-sync daily từ VietCap API
- Phân trang và caching

**Main Endpoints**:
```
GET    /symbols               # Danh sách có phân trang
GET    /symbols/all           # Tất cả symbols
GET    /symbols/{symbol}      # Chi tiết theo mã
GET    /symbols/search        # Tìm kiếm
POST   /symbols/sync          # Đồng bộ dữ liệu (Admin)
```

---

### 🎮 [Virtual Trading API](./VIRTUAL_TRADING_API.md)
**Base URL**: `/api/virtual-trading`

Nền tảng đấu trường chứng khoán ảo với vốn ban đầu 10 tỷ VND.

**Key Features**:
- Portfolio management với 10 tỷ VND initial
- Real-time trading với VietCap prices
- Transaction fees & taxes simulation
- Leaderboard & performance tracking

**Main Endpoints**:
```
POST   /virtual-trading/portfolio    # Tạo portfolio
GET    /virtual-trading/portfolio    # Thông tin portfolio
POST   /virtual-trading/buy          # Mua cổ phiếu
POST   /virtual-trading/sell         # Bán cổ phiếu
GET    /virtual-trading/transactions # Lịch sử giao dịch
GET    /virtual-trading/leaderboard  # Bảng xếp hạng
```

---

## 🔑 Authentication Overview

Tất cả API endpoints (trừ public endpoints) yêu cầu JWT authentication:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Quick Auth Flow:
1. **Register**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login` → Get JWT token
3. **Use token** trong header cho các API calls
4. **Refresh** khi cần: `POST /api/auth/refresh`

---

## 📊 Data Models Overview

### Core Entities

#### User
```typescript
{
  id: string;           // UUID
  email: string;        // Unique
  displayName?: string;
  role: string;         // 'member', 'admin'
  isActive: boolean;
}
```

#### Symbol (Stock)
```typescript
{
  id: number;           // VietCap ID
  symbol: string;       // 'VNM', 'VIC', etc.
  type: string;         // 'STOCK', 'BOND'
  board: string;        // 'HSX', 'HNX', 'UPCOM'
  organName?: string;   // Company name
}
```

#### Virtual Portfolio
```typescript
{
  id: string;
  userId: string;
  cashBalance: number;      // Tiền mặt
  totalAssetValue: number;  // Tổng tài sản
  totalProfitLoss: number;  // Lãi/lỗ vs 10B initial
}
```

---

## 🚦 Status Codes & Error Handling

### HTTP Status Codes
| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful GET requests |
| `201` | Created | Successful POST requests |
| `400` | Bad Request | Invalid input data |
| `401` | Unauthorized | Missing/invalid token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Resource already exists |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

### Error Response Format
```json
{
  "statusCode": 400,
  "message": ["email must be a valid email"],
  "error": "Bad Request"
}
```

---

## ⚡ Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|---------|
| Authentication | 10 req/min | Per IP |
| Symbols (read) | 120 req/min | Per user |
| Trading operations | 60 req/min | Per user |
| Portfolio queries | 30 req/min | Per user |

---

## 🔄 Real-time Features

### Stock Prices
- **Source**: VietCap API real-time data
- **Update frequency**: On-demand for trading
- **Cache**: 30 seconds TTL
- **Fallback**: Cached prices nếu API unavailable

### Auto-sync Schedule
- **Symbols data**: Daily 6:00 AM GMT+7
- **Portfolio values**: On-demand during trading
- **Leaderboard**: Updated after each trade

---

## 🛠️ Development Guide

### Environment Setup
```bash
# Install dependencies
pnpm install

# Setup database
createdb iqx_trading

# Environment variables
cp .env.example .env
# Configure DB_HOST, DB_PASSWORD, JWT_SECRET

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=iqx_trading

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=24h

# App
NODE_ENV=development
PORT=3000
```

---

## 📱 Frontend Integration Examples

### Complete Trading App Setup
```javascript
// API Client setup
class IQXTradingAPI {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('access_token');
  }

  // Auth methods
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.access_token) {
      this.token = data.access_token;
      localStorage.setItem('access_token', this.token);
    }
    return data;
  }

  // Trading methods
  async createPortfolio() {
    return this._request('/virtual-trading/portfolio', 'POST');
  }

  async buyStock(symbolCode, quantity, orderType = 'MARKET') {
    return this._request('/virtual-trading/buy', 'POST', {
      symbolCode, quantity, orderType
    });
  }

  async getPortfolio() {
    return this._request('/virtual-trading/portfolio', 'GET');
  }

  // Helper method
  async _request(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${this.baseURL}${endpoint}`, options);
    return response.json();
  }
}

// Usage in React/Vue component
const api = new IQXTradingAPI();

// Login flow
await api.login('user@example.com', 'password123');

// Create trading portfolio
await api.createPortfolio();

// Execute trades
await api.buyStock('VNM', 100, 'MARKET');

// Check performance
const portfolio = await api.getPortfolio();
```

---

## 🧪 Testing

### API Testing với cURL

**Register new user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "password": "TradingPassword123!",
    "displayName": "Pro Trader"
  }'
```

**Login and get token:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "password": "TradingPassword123!"
  }'
```

**Create virtual portfolio:**
```bash
curl -X POST http://localhost:3000/api/virtual-trading/portfolio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Buy stocks:**
```bash
curl -X POST http://localhost:3000/api/virtual-trading/buy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbolCode": "VNM",
    "quantity": 100,
    "orderType": "MARKET"
  }'
```

### Postman Collection
Import vào Postman từ `/api/docs-json` để có collection đầy đủ với tất cả endpoints.

---

## 📖 Additional Resources

### Database Schema
- [Complete ERD Diagram](./database-schema.png)
- [Migration files](../src/migrations/)
- [Entity definitions](../src/entities/)

### API Versioning
- Current version: `v1`
- All endpoints prefixed với `/api`
- Breaking changes sẽ có version mới `/api/v2`

### Support & Issues
- **GitHub Issues**: [Repository Issues](https://github.com/yourorg/iqx-trading-api)
- **API Status**: [Status Page](https://status.iqx.com)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)

---

## 🎯 Roadmap

### Upcoming Features
- [ ] WebSocket real-time price streaming
- [ ] Advanced order types (Stop-loss, Take-profit)
- [ ] Social trading features
- [ ] Portfolio analytics & charts
- [ ] Mobile API optimizations
- [ ] GraphQL endpoint

### Performance Goals
- [ ] Sub-100ms response times
- [ ] 99.9% uptime SLA
- [ ] Support 10,000 concurrent users
- [ ] Real-time price updates <1s latency

---

**📝 Last Updated**: September 25, 2025
**🔄 API Version**: v1.0.0
**📧 Contact**: api-support@iqx.com