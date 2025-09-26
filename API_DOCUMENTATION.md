# IQX Trading API Documentation

## Tổng quan

IQX Trading API là hệ thống giao dịch chứng khoán ảo với đầy đủ tính năng xác thực, quản lý danh mục và giao dịch real-time.

### Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.iqx.com/api`

### Swagger Documentation
- **Swagger UI**: `/api/docs`
- **JSON Schema**: `/api/docs-json`
- **YAML Schema**: `/api/docs-yaml`

---

## 🔐 Authentication Module

### Đăng ký tài khoản
**POST** `/auth/register`

Tạo tài khoản mới cho người dùng.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "displayName": "John Doe",
  "fullName": "John Smith Doe"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "John Doe",
  "message": "Đăng ký thành công"
}
```

**Validation:**
- Email: Phải là email hợp lệ và chưa tồn tại
- Password: Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt
- DisplayName: Tối thiểu 2 ký tự, tối đa 50 ký tự

---

### Đăng nhập
**POST** `/auth/login`

Xác thực người dùng và trả về JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "member"
  },
  "message": "Đăng nhập thành công"
}
```

**Error Responses:**
- `400`: Email hoặc mật khẩu không hợp lệ
- `401`: Tài khoản bị khóa hoặc không tồn tại

---

### Lấy thông tin profile
**GET** `/auth/profile`

Lấy thông tin chi tiết của người dùng hiện tại.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "John Doe",
  "fullName": "John Smith Doe",
  "phoneE164": "+84901234567",
  "phoneVerifiedAt": "2025-09-25T10:00:00Z",
  "role": "member",
  "isActive": true,
  "createdAt": "2025-09-20T10:00:00Z",
  "updatedAt": "2025-09-25T10:00:00Z"
}
```

---

### Đổi mật khẩu
**POST** `/auth/change-password`

Thay đổi mật khẩu cho tài khoản hiện tại.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword456!"
}
```

**Response (200):**
```json
{
  "message": "Đổi mật khẩu thành công"
}
```

---

### Quên mật khẩu
**POST** `/auth/forgot-password`

Gửi email reset mật khẩu.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Email reset mật khẩu đã được gửi"
}
```

---

### Reset mật khẩu
**POST** `/auth/reset-password`

Reset mật khẩu với token từ email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "message": "Đặt lại mật khẩu thành công"
}
```

---

## 📈 Symbols Module

### Lấy danh sách chứng khoán
**GET** `/symbols`

Lấy danh sách mã chứng khoán với phân trang và filter.

**Query Parameters:**
- `symbol` (optional): Filter theo mã chứng khoán
- `type` (optional): Filter theo loại (STOCK, BOND, etc.)
- `board` (optional): Filter theo sàn (HSX, HNX, UPCOM)
- `search` (optional): Tìm kiếm trong tên công ty
- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số bản ghi/trang (mặc định: 20)

**Example:**
```
GET /symbols?search=vinamilk&board=HSX&page=1&limit=10
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 8424928,
      "symbol": "VNM",
      "type": "STOCK",
      "board": "HSX",
      "enOrganName": "Vietnam Dairy Products Joint Stock Company",
      "organShortName": "VINAMILK",
      "organName": "Công ty Cổ phần Sữa Việt Nam",
      "productGrpID": "STO",
      "createdAt": "2025-09-25T10:00:00Z",
      "updatedAt": "2025-09-25T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1500,
    "totalPages": 75,
    "hasPreviousPage": false,
    "hasNextPage": true
  },
  "message": "Lấy danh sách chứng khoán thành công"
}
```

---

### Lấy tất cả chứng khoán
**GET** `/symbols/all`

Lấy tất cả mã chứng khoán không phân trang (cẩn thận với dữ liệu lớn).

**Query Parameters:**
- `symbol`, `type`, `board`, `search`: Tương tự endpoint phân trang

**Response (200):**
```json
{
  "data": [...], // Array của tất cả symbols
  "count": 1500,
  "message": "Lấy tất cả chứng khoán thành công"
}
```

---

### Tìm kiếm chứng khoán
**GET** `/symbols/search`

Endpoint tìm kiếm (tương tự `/symbols` với filter).

---

### Đếm số lượng chứng khoán
**GET** `/symbols/count`

**Response (200):**
```json
{
  "count": 1500,
  "message": "Lấy số lượng chứng khoán thành công"
}
```

---

### Lấy chứng khoán theo mã
**GET** `/symbols/{symbol}`

**Path Parameters:**
- `symbol`: Mã chứng khoán (VD: VNM)

**Response (200):**
```json
{
  "data": {
    "id": 8424928,
    "symbol": "VNM",
    "type": "STOCK",
    "board": "HSX",
    "enOrganName": "Vietnam Dairy Products Joint Stock Company",
    "organShortName": "VINAMILK",
    "organName": "Công ty Cổ phần Sữa Việt Nam"
  },
  "message": "Lấy thông tin chứng khoán thành công"
}
```

**Response (404):**
```json
{
  "data": null,
  "message": "Không tìm thấy chứng khoán"
}
```

---

### Đồng bộ dữ liệu chứng khoán
**POST** `/symbols/sync`

Đồng bộ dữ liệu từ VietCap API (chỉ dành cho admin).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "message": "Đồng bộ dữ liệu chứng khoán thành công"
}
```

**Process:**
1. Lấy dữ liệu từ VietCap API
2. Lọc bỏ mã đã DELISTED
3. Upsert vào database theo ID
4. Xử lý theo batch 100 records

---

## 🎮 Virtual Trading Module

### Tạo portfolio đấu trường ảo
**POST** `/virtual-trading/portfolio`

Tạo portfolio với vốn ban đầu 10 tỷ VND.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (201):**
```json
{
  "id": "uuid",
  "cashBalance": 10000000000,
  "totalAssetValue": 10000000000,
  "message": "Tạo portfolio thành công"
}
```

---

### Lấy thông tin portfolio
**GET** `/virtual-trading/portfolio`

Lấy thông tin chi tiết portfolio bao gồm holdings và P&L.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "cashBalance": 8500000000,
    "totalAssetValue": 10200000000,
    "stockValue": 1700000000,
    "totalProfitLoss": 200000000,
    "profitLossPercentage": 2.0,
    "totalTransactions": 15,
    "successfulTrades": 14,
    "holdings": [
      {
        "id": "uuid",
        "symbolCode": "VNM",
        "symbolName": "VINAMILK",
        "quantity": 1000,
        "averagePrice": 65000,
        "currentPrice": 67000,
        "currentValue": 67000000,
        "unrealizedProfitLoss": 2000000,
        "profitLossPercentage": 3.08,
        "totalCost": 65000000
      }
    ]
  },
  "message": "Lấy thông tin portfolio thành công"
}
```

**Response (404):**
```json
{
  "data": null,
  "message": "Portfolio chưa được tạo. Vui lòng tạo portfolio trước."
}
```

---

### Mua cổ phiếu
**POST** `/virtual-trading/buy`

Đặt lệnh mua cổ phiếu với giá thị trường hoặc giá giới hạn.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "symbolCode": "VNM",
  "quantity": 100,
  "orderType": "MARKET"
}
```

**Request Body (Limit Order):**
```json
{
  "symbolCode": "VNM",
  "quantity": 100,
  "orderType": "LIMIT",
  "limitPrice": 65000
}
```

**Response (201):**
```json
{
  "transactionId": "uuid",
  "symbolCode": "VNM",
  "quantity": 100,
  "pricePerShare": 65500,
  "totalAmount": 6550000,
  "fee": 9825,
  "netAmount": 6559825,
  "message": "Mua 100 cổ phiếu VNM thành công"
}
```

**Error Responses:**
- `400`: Số dư không đủ hoặc thông số không hợp lệ
- `404`: Mã chứng khoán không tồn tại
- `503`: Không thể lấy giá từ thị trường

**Fees & Calculations:**
- Phí giao dịch: 0.15% của tổng giá trị
- Giá real-time từ VietCap API

---

### Bán cổ phiếu
**POST** `/virtual-trading/sell`

Đặt lệnh bán cổ phiếu.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "symbolCode": "VNM",
  "quantity": 50,
  "orderType": "MARKET"
}
```

**Response (201):**
```json
{
  "transactionId": "uuid",
  "symbolCode": "VNM",
  "quantity": 50,
  "pricePerShare": 66000,
  "totalAmount": 3300000,
  "fee": 4950,
  "tax": 3300,
  "netAmount": 3291750,
  "message": "Bán 50 cổ phiếu VNM thành công"
}
```

**Fees & Taxes:**
- Phí giao dịch: 0.15%
- Thuế bán: 0.1%

---

### Lịch sử giao dịch
**GET** `/virtual-trading/transactions`

Lấy lịch sử giao dịch mua/bán.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (optional): Trang (mặc định: 1)
- `limit` (optional): Số bản ghi/trang (mặc định: 20)
- `type` (optional): Loại giao dịch (BUY, SELL)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "symbolCode": "VNM",
      "transactionType": "BUY",
      "quantity": 100,
      "pricePerShare": 65000,
      "totalAmount": 6500000,
      "fee": 9750,
      "tax": 0,
      "netAmount": 6509750,
      "status": "COMPLETED",
      "createdAt": "2025-09-25T10:00:00Z",
      "executedAt": "2025-09-25T10:00:01Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### Lấy giá hiện tại
**GET** `/virtual-trading/price/{symbol}`

Lấy giá real-time từ VietCap API.

**Path Parameters:**
- `symbol`: Mã chứng khoán

**Response (200):**
```json
{
  "symbol": "VNM",
  "currentPrice": 65500,
  "timestamp": "2025-09-25T10:15:30Z",
  "message": "Lấy giá thành công"
}
```

---

### Bảng xếp hạng
**GET** `/virtual-trading/leaderboard`

Lấy bảng xếp hạng top traders.

**Query Parameters:**
- `limit` (optional): Số lượng top traders (mặc định: 50)
- `sortBy` (optional): Sắp xếp theo `value` hoặc `percentage` (mặc định: percentage)

**Response (200):**
```json
{
  "data": [
    {
      "rank": 1,
      "userId": "uuid",
      "username": "TradingKing",
      "totalAssetValue": 15000000000,
      "totalProfitLoss": 5000000000,
      "profitLossPercentage": 50.0,
      "totalTransactions": 1250,
      "successfulTrades": 980,
      "winRate": 78.4
    }
  ],
  "message": "Lấy bảng xếp hạng thành công"
}
```

---

## 🔒 Authentication & Authorization

### JWT Token
Tất cả API cần xác thực sử dụng JWT Bearer token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Structure
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "iat": 1727252400,
  "exp": 1727338800
}
```

### Error Responses
```json
// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## 📊 Data Models

### User
```typescript
{
  id: string;           // UUID
  email: string;        // Unique email
  displayName?: string; // Display name
  fullName?: string;    // Full legal name
  phoneE164?: string;   // Phone in E164 format
  role: string;         // member, admin
  isActive: boolean;    // Account status
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Update timestamp
}
```

### Symbol
```typescript
{
  id: number;           // VietCap symbol ID
  symbol: string;       // Stock symbol (VNM, VIC, etc.)
  type: string;         // STOCK, BOND, etc.
  board: string;        // HSX, HNX, UPCOM
  enOrganName?: string; // English company name
  organShortName?: string; // Short Vietnamese name
  organName?: string;   // Full Vietnamese name
  productGrpID?: string; // Product group ID
}
```

### Virtual Portfolio
```typescript
{
  id: string;                // UUID
  userId: string;           // Owner user ID
  cashBalance: number;      // Cash in VND
  totalAssetValue: number;  // Total portfolio value
  stockValue: number;       // Value of all holdings
  totalProfitLoss: number;  // Total P&L vs initial 10B
  profitLossPercentage: number; // P&L percentage
  totalTransactions: number; // Total trade count
  successfulTrades: number;  // Successful trade count
  isActive: boolean;        // Portfolio status
}
```

### Virtual Holding
```typescript
{
  id: string;                 // UUID
  portfolioId: string;       // Portfolio ID
  symbolCode: string;        // Stock symbol
  quantity: number;          // Number of shares
  averagePrice: number;      // Average buy price
  totalCost: number;         // Total invested amount
  currentPrice: number;      // Current market price
  currentValue: number;      // Current holding value
  unrealizedProfitLoss: number; // Unrealized P&L
  profitLossPercentage: number; // P&L percentage
}
```

---

## ❌ Error Handling

### HTTP Status Codes
- `200`: Success
- `201`: Created successfully
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Invalid/missing token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `409`: Conflict - Resource already exists
- `422`: Validation Error
- `500`: Internal Server Error

### Error Response Format
```json
{
  "statusCode": 400,
  "message": ["email must be a valid email"],
  "error": "Bad Request"
}
```

---

## 🚀 Rate Limiting

- Authentication endpoints: 10 requests/minute
- Trading endpoints: 60 requests/minute
- Market data: 120 requests/minute
- General APIs: 100 requests/minute

---

## 📈 Real-time Data

### Stock Prices
Giá cổ phiếu được lấy real-time từ VietCap API:
- **Endpoint**: `https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart`
- **Method**: POST
- **Required Header**: `Referer: https://trading.vietcap.com.vn/`
- **Update frequency**: On-demand khi giao dịch

### Data Structure
```json
{
  "symbol": "VNM",
  "o": [65000],     // Open price
  "h": [66000],     // High price
  "l": [64500],     // Low price
  "c": [65500],     // Close price (current)
  "v": [1250000],   // Volume
  "t": ["1727252400"] // Timestamp
}
```

---

## 🔧 Development & Testing

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

# Environment
NODE_ENV=development
PORT=3000
```

### Sample cURL Commands

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "password": "TradingPassword123!",
    "displayName": "Trader Pro"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "password": "TradingPassword123!"
  }'
```

**Create Portfolio:**
```bash
curl -X POST http://localhost:3000/api/virtual-trading/portfolio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Buy Stock:**
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

---

## 📱 Frontend Integration

### Authentication Flow
1. User registers/logs in → Receive JWT token
2. Store token in localStorage/sessionStorage
3. Include token in all API requests
4. Handle token expiration (401 response)
5. Refresh or redirect to login

### Portfolio Management
1. Create portfolio after first login
2. Display real-time portfolio value
3. Show holdings with current prices
4. Update prices periodically
5. Handle trade confirmations

### Trading Interface
1. Stock search with autocomplete
2. Real-time price display
3. Buy/sell order forms
4. Transaction history
5. Portfolio performance charts

---

## 🔄 Auto-sync Features

### Symbols Data
- **Frequency**: Daily at 6:00 AM
- **Source**: VietCap API
- **Process**: Fetch → Filter → Upsert
- **Manual trigger**: `POST /symbols/sync`

### Portfolio Updates
- **Frequency**: On-demand during trading
- **Trigger**: Buy/sell transactions
- **Process**: Recalculate holdings → Update portfolio value

---

This documentation covers all available APIs in the IQX Trading system. For the latest updates and interactive testing, visit the Swagger UI at `/api/docs`.