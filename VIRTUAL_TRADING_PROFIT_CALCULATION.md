# Virtual Trading Portfolio API - Tính Toán Lợi Nhuận

## Tổng Quan

API `GET /virtual-trading/portfolio` đã được cập nhật để trả về thông tin chi tiết về lợi nhuận dự kiến và lợi nhuận đã thực hiện **được tính toán động** (không lưu trong database).

## ✅ Ưu Điểm Của Cách Tính Toán

1. **Không cần thêm cột database** - Tránh data inconsistency
2. **Dữ liệu luôn chính xác** - Tính toán real-time từ holdings và transactions
3. **Dễ maintain** - Không cần sync data khi có thay đổi
4. **Không cần migration** - Sử dụng data có sẵn

## Công Thức Tính Toán

### 1. **unrealizedProfitLoss** (Lợi nhuận dự kiến)
```typescript
unrealizedProfitLoss = SUM(holdings.unrealizedProfitLoss)
```

**Ý nghĩa**: Tổng lợi nhuận chưa thực hiện từ tất cả cổ phiếu đang nắm giữ.

**Ví dụ**:
- Holding 1: VNM, mua 100 CP @ 65,000, giá hiện tại 70,000
  - Unrealized P/L = (70,000 - 65,000) × 100 = **500,000 VND**
- Holding 2: VIC, mua 50 CP @ 80,000, giá hiện tại 75,000
  - Unrealized P/L = (75,000 - 80,000) × 50 = **-250,000 VND**
- **Tổng unrealized = 500,000 + (-250,000) = 250,000 VND**

### 2. **realizedProfitLoss** (Lợi nhuận đã thực hiện)
```typescript
realizedProfitLoss = totalProfitLoss - unrealizedProfitLoss
```

**Ý nghĩa**: Lợi nhuận/lỗ đã thực hiện từ các giao dịch bán đã hoàn thành.

**Giải thích**:
- `totalProfitLoss` = Tổng tài sản hiện tại - Vốn ban đầu (10 tỷ)
- `unrealizedProfitLoss` = Lãi/lỗ chưa bán
- Phần còn lại chính là lãi/lỗ đã thực hiện

**Ví dụ**:
- Vốn ban đầu: 10,000,000,000 VND
- Tổng tài sản hiện tại: 11,500,000,000 VND
- totalProfitLoss = 1,500,000,000 VND
- unrealizedProfitLoss = 500,000,000 VND
- **realizedProfitLoss = 1,500,000,000 - 500,000,000 = 1,000,000,000 VND**

### 3. **totalProfitLoss** (Tổng lãi/lỗ)
```typescript
totalProfitLoss = totalAssetValue - 10,000,000,000
totalAssetValue = cashBalance + stockValue
```

## Response Structure

```json
{
  "data": {
    "id": "uuid-123",
    "userId": "uuid-456",
    "cashBalance": 9000000000,
    "totalAssetValue": 11500000000,
    "stockValue": 2500000000,
    "totalProfitLoss": 1500000000,
    "unrealizedProfitLoss": 500000000,
    "realizedProfitLoss": 1000000000,
    "profitLossPercentage": 15.0,
    "totalTransactions": 45,
    "successfulTrades": 42,
    "holdings": [...]
  },
  "message": "Lấy thông tin portfolio thành công"
}
```

## Giải Thích Các Trường

| Trường | Công Thức | Ý Nghĩa |
|--------|-----------|---------|
| `cashBalance` | Từ DB | Số dư tiền mặt |
| `stockValue` | Σ(holdings.currentValue) | Giá trị cổ phiếu hiện tại |
| `totalAssetValue` | cashBalance + stockValue | Tổng tài sản |
| `totalProfitLoss` | totalAssetValue - 10 tỷ | Tổng lãi/lỗ |
| `unrealizedProfitLoss` | Σ(holdings.unrealizedProfitLoss) | Lãi/lỗ chưa bán |
| `realizedProfitLoss` | total - unrealized | Lãi/lỗ đã thực hiện |

## Ví Dụ Thực Tế

### Scenario 1: Mua và giữ
1. Mua 100 VNM @ 65,000 = -6,500,000 (+ phí)
2. Giá tăng lên 70,000
3. Portfolio:
   - **unrealizedProfitLoss**: +500,000 (chưa bán)
   - **realizedProfitLoss**: 0 (chưa có giao dịch bán)

### Scenario 2: Mua, bán, và giữ
1. Mua 200 VNM @ 65,000 = -13,000,000
2. Giá tăng lên 70,000
3. Bán 100 VNM @ 70,000 = +6,985,000 (sau phí/thuế)
   - Lãi thực = 6,985,000 - 6,500,000 = +485,000
4. Giá tiếp tục tăng lên 72,000
5. Portfolio:
   - **unrealizedProfitLoss**: (72,000 - 65,000) × 100 = +700,000
   - **realizedProfitLoss**: +485,000 (từ lần bán)
   - **totalProfitLoss**: +1,185,000

## Implementation Details

### Service Method
```typescript
private async mapToPortfolioSummary(
  portfolio: VirtualPortfolio,
): Promise<PortfolioSummaryDto> {
  // Tính unrealized từ holdings
  let unrealizedProfitLoss = 0;
  if (portfolio.holdings) {
    for (const holding of portfolio.holdings) {
      unrealizedProfitLoss += holding.unrealizedProfitLoss;
    }
  }

  // Tính realized = total - unrealized
  const realizedProfitLoss = portfolio.totalProfitLoss - unrealizedProfitLoss;

  return {
    ...portfolio,
    unrealizedProfitLoss,
    realizedProfitLoss,
    ...
  };
}
```

## Testing

### 1. Xem Portfolio
```bash
curl -X GET http://localhost:3000/virtual-trading/portfolio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Response Mẫu
```json
{
  "data": {
    "totalProfitLoss": 1500000,
    "unrealizedProfitLoss": 500000,
    "realizedProfitLoss": 1000000,
    ...
  }
}
```

## Restart Server

Sau khi update code, restart server:

```bash
# Development
npm run start:dev

# Production
pm2 restart api
```

## Lưu Ý

1. ✅ **Không cần migration** - Sử dụng data có sẵn
2. ✅ **Tính toán real-time** - Luôn chính xác
3. ⚠️ **Performance**: Nếu có nhiều holdings, có thể tối ưu bằng cách cache
4. 💡 **Công thức đơn giản**: realized = total - unrealized

## API Documentation

Swagger documentation đã được cập nhật tự động:
```
http://localhost:3000/api
```

