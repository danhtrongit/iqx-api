# Price Action API

## Endpoint

```
GET /price-action
```

## Description

API endpoint để lấy dữ liệu price action từ Google Sheets. Dữ liệu được cache 1 giờ để tối ưu hiệu suất.

## Features

- ✅ Tự động lấy danh sách mã chứng khoán từ Google Sheets
- ✅ Tính toán các chỉ số kỹ thuật:
  - Giá hiện tại
  - % thay đổi 1 ngày, 7 ngày, 30 ngày
  - Khối lượng giao dịch
  - Khối lượng trung bình 3 tháng
  - Giá cao nhất trong 3 tháng
  - % giá hiện tại so với giá cao nhất 3 tháng
- ✅ Cache 1 giờ để giảm tải hệ thống
- ✅ Xử lý batch để tránh quá tải API

## Request

```bash
curl -X GET "http://localhost:3000/price-action"
```

## Response

```json
{
  "data": [
    {
      "ticker": "BAF",
      "date": "23/01/2025",
      "currentPrice": 75000,
      "change1D": 2.5,
      "change7D": 5.3,
      "change30D": 12.8,
      "volume": 1234567,
      "avgVolume3M": 987654,
      "high3M": 80000,
      "percentFromHigh3M": -6.25
    },
    {
      "ticker": "HDB",
      "date": "06/02/2025",
      "currentPrice": 32500,
      "change1D": 1.2,
      "change7D": -0.5,
      "change30D": 8.3,
      "volume": 2345678,
      "avgVolume3M": 1876543,
      "high3M": 35000,
      "percentFromHigh3M": -7.14
    }
  ],
  "cachedAt": "2025-10-15T10:00:00.000Z",
  "message": "Lấy dữ liệu price action thành công"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | string | Mã chứng khoán |
| `date` | string | Ngày price action từ Google Sheets |
| `currentPrice` | number \| null | Giá hiện tại |
| `change1D` | number \| null | % thay đổi so với 1 ngày trước |
| `change7D` | number \| null | % thay đổi so với 7 ngày trước |
| `change30D` | number \| null | % thay đổi so với 30 ngày trước |
| `volume` | number \| null | Khối lượng giao dịch hiện tại |
| `avgVolume3M` | number \| null | Khối lượng trung bình 3 tháng |
| `high3M` | number \| null | Giá cao nhất trong 3 tháng |
| `percentFromHigh3M` | number \| null | % giá hiện tại so với giá cao nhất 3 tháng |
| `cachedAt` | string | Thời gian cache được cập nhật (ISO 8601) |

## Data Source

### Google Sheets
```
https://sheets.googleapis.com/v4/spreadsheets/1ekb2bYAQJZbtmqMUzsagb4uWBdtkAzTq3kuIMHQ22RI/values/PriceAction
```

### Price Data
Dữ liệu giá được lấy từ VietCap API:
```
POST https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart
```

Parameters:
- `timeFrame`: ONE_DAY
- `countBack`: 90 (3 tháng dữ liệu)

## Caching

- **Cache Duration**: 1 giờ (3600 seconds)
- **Cache Type**: In-memory cache
- **Cache Key**: Dữ liệu được cache tại service level
- **Cache Invalidation**: Tự động sau 1 giờ

## Performance

- Xử lý 5 mã chứng khoán đồng thời (batch processing)
- Delay 500ms giữa các batch để tránh rate limiting
- Timeout: Tự động retry với error handling

## Error Handling

Nếu có lỗi khi lấy dữ liệu cho một mã chứng khoán, API sẽ trả về:
```json
{
  "ticker": "XYZ",
  "date": "15/10/2025",
  "currentPrice": null,
  "change1D": null,
  "change7D": null,
  "change30D": null,
  "volume": null,
  "avgVolume3M": null,
  "high3M": null,
  "percentFromHigh3M": null
}
```

## Usage Example

### JavaScript/TypeScript
```typescript
async function getPriceAction() {
  const response = await fetch('http://localhost:3000/price-action');
  const data = await response.json();
  
  console.log(`Data cached at: ${data.cachedAt}`);
  data.data.forEach(item => {
    console.log(`${item.ticker}: ${item.currentPrice} (${item.change1D}%)`);
  });
}
```

### Python
```python
import requests

response = requests.get('http://localhost:3000/price-action')
data = response.json()

print(f"Data cached at: {data['cachedAt']}")
for item in data['data']:
    print(f"{item['ticker']}: {item['currentPrice']} ({item['change1D']}%)")
```

## Notes

- Dữ liệu được cache 1 giờ, nên có thể không real-time
- Nếu Google Sheets hoặc VietCap API không available, endpoint sẽ trả về error
- Tất cả giá trị có thể là `null` nếu không có dữ liệu
- % change được tính dựa trên close price của các ngày trước

