# 🎮 Virtual Trading API Documentation

## Tổng quan
Module Virtual Trading cung cấp nền tảng đấu trường chứng khoán ảo với vốn ban đầu 10 tỷ VND, cho phép người dùng mua/bán cổ phiếu với giá real-time từ VietCap API.

**Base URL**: `/api/virtual-trading`

**🔒 Tất cả endpoints yêu cầu JWT authentication**

---

## Core Features

### 💰 Portfolio System
- Vốn ban đầu: **10,000,000,000 VND** (10 tỷ)
- Theo dõi real-time: Cash balance, stock value, total P&L
- Automatic portfolio rebalancing
- Performance metrics & analytics

### 📊 Real-time Trading
- Giá cổ phiếu real-time từ VietCap API
- Market order (giá thị trường) & Limit order
- Transaction fees: 0.15% mua/bán
- Tax on sell: 0.1%

### 🏆 Gamification
- Leaderboard rankings
- Win rate tracking
- Trade success metrics
- Portfolio performance comparison

---

## Endpoints

### 1. Tạo Portfolio
**POST** `/virtual-trading/portfolio`

Tạo portfolio mới với vốn ban đầu 10 tỷ VND.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response Success (201)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "cashBalance": 10000000000,
  "totalAssetValue": 10000000000,
  "message": "Tạo portfolio thành công"
}
```

#### Response Conflict (409)
```json
{
  "statusCode": 409,
  "message": "Portfolio đã tồn tại cho user này",
  "error": "Conflict"
}
```

---

### 2. Lấy thông tin Portfolio
**GET** `/virtual-trading/portfolio`

Lấy thông tin chi tiết portfolio bao gồm holdings và P&L.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response Success (200)
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "user-uuid",
    "cashBalance": 8500000000,
    "totalAssetValue": 10200000000,
    "stockValue": 1700000000,
    "totalProfitLoss": 200000000,
    "profitLossPercentage": 2.0,
    "totalTransactions": 15,
    "successfulTrades": 14,
    "holdings": [
      {
        "id": "holding-uuid",
        "symbolCode": "VNM",
        "symbolName": "VINAMILK",
        "quantity": 1000,
        "averagePrice": 65000,
        "currentPrice": 67000,
        "currentValue": 67000000,
        "unrealizedProfitLoss": 2000000,
        "profitLossPercentage": 3.08,
        "totalCost": 65000000
      },
      {
        "id": "holding-uuid-2",
        "symbolCode": "VIC",
        "symbolName": "Vingroup",
        "quantity": 500,
        "averagePrice": 85000,
        "currentPrice": 88000,
        "currentValue": 44000000,
        "unrealizedProfitLoss": 1500000,
        "profitLossPercentage": 3.53,
        "totalCost": 42500000
      }
    ]
  },
  "message": "Lấy thông tin portfolio thành công"
}
```

#### Response Not Found (404)
```json
{
  "data": null,
  "message": "Portfolio chưa được tạo. Vui lòng tạo portfolio trước."
}
```

---

### 3. Mua Cổ phiếu
**POST** `/virtual-trading/buy`

Đặt lệnh mua cổ phiếu với giá thị trường hoặc giá giới hạn.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body - Market Order
```json
{
  "symbolCode": "VNM",
  "quantity": 100,
  "orderType": "MARKET"
}
```

#### Request Body - Limit Order
```json
{
  "symbolCode": "VNM",
  "quantity": 100,
  "orderType": "LIMIT",
  "limitPrice": 65000
}
```

#### Validation Rules
- `symbolCode`: Phải tồn tại trong database symbols
- `quantity`: Số nguyên dương, minimum 1
- `orderType`: "MARKET" hoặc "LIMIT"
- `limitPrice`: Bắt buộc nếu orderType = "LIMIT"

#### Response Success (201)
```json
{
  "transactionId": "txn-uuid",
  "symbolCode": "VNM",
  "quantity": 100,
  "pricePerShare": 65500,
  "totalAmount": 6550000,
  "fee": 9825,
  "netAmount": 6559825,
  "message": "Mua 100 cổ phiếu VNM thành công"
}
```

#### Fee Calculation
```javascript
// Phí giao dịch: 0.15%
const fee = Math.round(totalAmount * 0.0015);
const netAmount = totalAmount + fee;
```

#### Error Responses
```json
// 400 - Insufficient funds
{
  "statusCode": 400,
  "message": "Số dư không đủ để thực hiện giao dịch",
  "error": "Bad Request"
}

// 404 - Symbol not found
{
  "statusCode": 404,
  "message": "Symbol VNX không tồn tại",
  "error": "Not Found"
}

// 503 - Cannot get current price
{
  "statusCode": 503,
  "message": "Không thể lấy giá hiện tại của mã chứng khoán",
  "error": "Service Unavailable"
}
```

---

### 4. Bán Cổ phiếu
**POST** `/virtual-trading/sell`

Đặt lệnh bán cổ phiếu.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "symbolCode": "VNM",
  "quantity": 50,
  "orderType": "MARKET"
}
```

#### Response Success (201)
```json
{
  "transactionId": "txn-uuid",
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

#### Fee & Tax Calculation
```javascript
// Phí giao dịch: 0.15%
const fee = Math.round(totalAmount * 0.0015);

// Thuế bán: 0.1%
const tax = Math.round(totalAmount * 0.001);

// Số tiền nhận được
const netAmount = totalAmount - fee - tax;
```

#### Error Responses
```json
// 400 - Insufficient shares
{
  "statusCode": 400,
  "message": "Không đủ số lượng cổ phiếu để bán",
  "error": "Bad Request"
}
```

---

### 5. Lịch sử Giao dịch
**GET** `/virtual-trading/transactions`

Lấy lịch sử giao dịch mua/bán của user với phân trang.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Số trang (mặc định: 1) |
| `limit` | number | No | Số bản ghi/trang (mặc định: 20) |
| `type` | string | No | Loại giao dịch: "BUY", "SELL" |

#### Example
```
GET /virtual-trading/transactions?page=1&limit=10&type=BUY
```

#### Response Success (200)
```json
{
  "data": [
    {
      "id": "txn-uuid",
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
    },
    {
      "id": "txn-uuid-2",
      "symbolCode": "VIC",
      "transactionType": "SELL",
      "quantity": 50,
      "pricePerShare": 88000,
      "totalAmount": 4400000,
      "fee": 6600,
      "tax": 4400,
      "netAmount": 4389000,
      "status": "COMPLETED",
      "createdAt": "2025-09-25T11:30:00Z",
      "executedAt": "2025-09-25T11:30:02Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  },
  "message": "Lấy lịch sử giao dịch thành công"
}
```

---

### 6. Lấy giá hiện tại
**GET** `/virtual-trading/price/{symbol}`

Lấy giá real-time của một mã chứng khoán từ VietCap API.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Mã chứng khoán (VD: VNM) |

#### Example
```
GET /virtual-trading/price/VNM
```

#### Response Success (200)
```json
{
  "symbol": "VNM",
  "currentPrice": 65500,
  "timestamp": "2025-09-25T10:15:30Z",
  "message": "Lấy giá thành công"
}
```

#### VietCap API Integration
```javascript
// API Call to VietCap
const vietcapData = {
  "timeFrame": "ONE_MINUTE",
  "symbols": ["VNM"],
  "to": Math.floor(Date.now() / 1000),
  "countBack": 1
};

// Response format
{
  "symbol": "VNM",
  "o": [65000],  // Open price
  "h": [66000],  // High price
  "l": [64500],  // Low price
  "c": [65500],  // Close price (current)
  "v": [1250000] // Volume
}
```

---

### 7. Bảng xếp hạng
**GET** `/virtual-trading/leaderboard`

Lấy bảng xếp hạng top traders theo performance.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Số lượng top traders (mặc định: 50, max: 100) |
| `sortBy` | string | No | "value" hoặc "percentage" (mặc định: percentage) |

#### Example
```
GET /virtual-trading/leaderboard?limit=10&sortBy=percentage
```

#### Response Success (200)
```json
{
  "data": [
    {
      "rank": 1,
      "userId": "user-uuid-1",
      "username": "TradingMaster",
      "totalAssetValue": 15000000000,
      "initialBalance": 10000000000,
      "totalProfitLoss": 5000000000,
      "profitLossPercentage": 50.0,
      "totalTransactions": 1250,
      "successfulTrades": 980,
      "winRate": 78.4
    },
    {
      "rank": 2,
      "userId": "user-uuid-2",
      "username": "StockGuru",
      "totalAssetValue": 14200000000,
      "initialBalance": 10000000000,
      "totalProfitLoss": 4200000000,
      "profitLossPercentage": 42.0,
      "totalTransactions": 890,
      "successfulTrades": 712,
      "winRate": 80.0
    }
  ],
  "message": "Lấy bảng xếp hạng thành công"
}
```

---

## Trading Logic & Business Rules

### Portfolio Calculations
```javascript
// Total Asset Value
const totalAssetValue = cashBalance + stockValue;

// Stock Value (sum of all holdings)
const stockValue = holdings.reduce((sum, holding) =>
  sum + (holding.quantity * holding.currentPrice), 0
);

// Total P&L
const totalProfitLoss = totalAssetValue - 10000000000; // vs initial 10B

// P&L Percentage
const profitLossPercentage = (totalProfitLoss / 10000000000) * 100;
```

### Holding Updates
```javascript
// When buying additional shares
const newQuantity = existingQuantity + boughtQuantity;
const newTotalCost = existingTotalCost + purchaseAmount;
const newAveragePrice = Math.round(newTotalCost / newQuantity);

// Unrealized P&L calculation
const unrealizedPL = (currentPrice - averagePrice) * quantity;
const plPercentage = ((currentPrice - averagePrice) / averagePrice) * 100;
```

### Transaction Processing
1. **Validation**: Check user balance, stock availability
2. **Price Fetch**: Get current price from VietCap API
3. **Fee Calculation**: Apply trading fees and taxes
4. **Database Transaction**: Atomic update of portfolio, holdings, transactions
5. **Portfolio Rebalance**: Update total values and P&L
6. **Response**: Return transaction details

---

## Database Schema

### Virtual Portfolios
```sql
CREATE TABLE virtual_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cash_balance BIGINT NOT NULL DEFAULT 10000000000,
  total_asset_value BIGINT NOT NULL DEFAULT 10000000000,
  stock_value BIGINT NOT NULL DEFAULT 0,
  total_profit_loss DECIMAL(10,2) DEFAULT 0,
  profit_loss_percentage DECIMAL(5,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  successful_trades INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Virtual Holdings
```sql
CREATE TABLE virtual_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES virtual_portfolios(id) ON DELETE CASCADE,
  symbol_id BIGINT NOT NULL REFERENCES symbols(id),
  symbol_code VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL,
  average_price BIGINT NOT NULL,
  total_cost BIGINT NOT NULL,
  current_price BIGINT DEFAULT 0,
  current_value BIGINT DEFAULT 0,
  unrealized_profit_loss BIGINT DEFAULT 0,
  profit_loss_percentage DECIMAL(5,2) DEFAULT 0,
  last_price_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Virtual Transactions
```sql
CREATE TABLE virtual_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES virtual_portfolios(id) ON DELETE CASCADE,
  symbol_id BIGINT NOT NULL REFERENCES symbols(id),
  symbol_code VARCHAR(20) NOT NULL,
  transaction_type VARCHAR(4) NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL,
  price_per_share BIGINT NOT NULL,
  total_amount BIGINT NOT NULL,
  fee BIGINT DEFAULT 0,
  tax BIGINT DEFAULT 0,
  net_amount BIGINT NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  failure_reason TEXT,
  market_data JSONB,
  portfolio_balance_before BIGINT NOT NULL,
  portfolio_balance_after BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_virtual_transactions_portfolio_created
ON virtual_transactions(portfolio_id, created_at DESC);

CREATE INDEX idx_virtual_transactions_symbol_created
ON virtual_transactions(symbol_code, created_at DESC);
```

---

## Performance & Optimization

### Real-time Price Updates
```javascript
// Price update strategy
const PRICE_CACHE_TTL = 30000; // 30 seconds
const priceCache = new Map();

async function getCurrentPrice(symbol) {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
    return cached.price;
  }

  const price = await fetchFromVietCap(symbol);
  priceCache.set(symbol, { price, timestamp: Date.now() });
  return price;
}
```

### Database Transactions
```javascript
// Atomic buy operation
const queryRunner = dataSource.createQueryRunner();
await queryRunner.startTransaction();

try {
  // 1. Update portfolio cash balance
  // 2. Create or update holding
  // 3. Create transaction record
  // 4. Recalculate portfolio values

  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
}
```

### Batch Processing
- Holdings updates: Process in batches of 50
- Price updates: Rate limit 10 requests/second to VietCap
- Portfolio recalculation: Queue-based processing

---

## Security & Validation

### Input Validation
```typescript
class BuyStockDto {
  @IsString()
  @MaxLength(10)
  symbolCode: string;

  @IsNumber()
  @Min(1)
  @Max(1000000)
  quantity: number;

  @IsEnum(['MARKET', 'LIMIT'])
  orderType: 'MARKET' | 'LIMIT';

  @IsOptional()
  @IsNumber()
  @Min(1)
  limitPrice?: number;
}
```

### Business Rules
- Maximum position size: 50% của portfolio
- Maximum single trade: 1 tỷ VND
- Minimum trade value: 10,000 VND
- Daily trade limit: 100 transactions

### Rate Limiting
- Trading operations: 60 requests/minute/user
- Price queries: 120 requests/minute/user
- Portfolio queries: 30 requests/minute/user

---

## Integration Examples

### Complete Trading Flow
```javascript
class VirtualTradingClient {
  constructor(token) {
    this.token = token;
    this.baseURL = '/api/virtual-trading';
  }

  async createPortfolio() {
    return fetch(`${this.baseURL}/portfolio`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
  }

  async buyStock(symbolCode, quantity, orderType = 'MARKET', limitPrice) {
    const body = { symbolCode, quantity, orderType };
    if (limitPrice) body.limitPrice = limitPrice;

    return fetch(`${this.baseURL}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }

  async getPortfolio() {
    return fetch(`${this.baseURL}/portfolio`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
  }

  async getCurrentPrice(symbol) {
    return fetch(`${this.baseURL}/price/${symbol}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
  }
}

// Usage example
const client = new VirtualTradingClient(userToken);

// Create portfolio
await client.createPortfolio();

// Get current price
const { currentPrice } = await client.getCurrentPrice('VNM');

// Buy 100 shares at market price
await client.buyStock('VNM', 100, 'MARKET');

// Check portfolio
const portfolio = await client.getPortfolio();
console.log('Portfolio Value:', portfolio.data.totalAssetValue);
```

### Real-time Portfolio Dashboard
```javascript
class PortfolioDashboard {
  constructor(tradingClient) {
    this.client = tradingClient;
    this.updateInterval = null;
  }

  async start() {
    await this.updatePortfolio();
    this.updateInterval = setInterval(() => {
      this.updatePortfolio();
    }, 30000); // Update every 30 seconds
  }

  async updatePortfolio() {
    try {
      const portfolio = await this.client.getPortfolio();
      this.renderPortfolio(portfolio.data);

      // Update individual holding prices
      for (const holding of portfolio.data.holdings) {
        const price = await this.client.getCurrentPrice(holding.symbolCode);
        this.updateHoldingPrice(holding.symbolCode, price.currentPrice);
      }
    } catch (error) {
      console.error('Error updating portfolio:', error);
    }
  }

  renderPortfolio(portfolio) {
    document.getElementById('cash-balance').textContent =
      this.formatCurrency(portfolio.cashBalance);

    document.getElementById('total-value').textContent =
      this.formatCurrency(portfolio.totalAssetValue);

    document.getElementById('profit-loss').textContent =
      `${this.formatCurrency(portfolio.totalProfitLoss)} (${portfolio.profitLossPercentage}%)`;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
}
```