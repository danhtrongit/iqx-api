# API Symbols Documentation - Complete Reference

## 🚀 Tổng quan
API Symbols cung cấp một bộ endpoint hoàn chỉnh để quản lý và truy xuất thông tin chứng khoán trong hệ thống IQX Trading. API hỗ trợ tìm kiếm, phân trang, lọc, và lấy giá real-time từ VietCap.

## 🔗 Base URL
```
http://localhost:3000/api/symbols
```

## 🔐 Authentication
Một số endpoint yêu cầu JWT token trong header:
```
Authorization: Bearer <your_jwt_token>
```

## 📊 Database Schema
### Symbol Entity
```typescript
interface Symbol {
  id: number;              // Khóa chính (bigint)
  symbol: string;          // Mã chứng khoán (unique)
  type: string;            // Loại: STOCK, BOND, FU
  board: string;           // Sàn: HSX, HNX, UPCOM
  en_organ_name?: string;  // Tên tiếng Anh
  organ_short_name?: string; // Tên viết tắt
  organ_name?: string;     // Tên tiếng Việt
  product_grp_id?: string; // Mã nhóm sản phẩm
  created_at: Date;        // Ngày tạo
  updated_at: Date;        // Ngày cập nhật
}
```

---

## 📋 API Endpoints

### 1. Lấy danh sách chứng khoán (có phân trang)

**GET** `/api/symbols`

Lấy danh sách chứng khoán với phân trang và bộ lọc. Endpoint chính để tìm kiếm và lọc chứng khoán.

#### Query Parameters:
| Tham số | Kiểu | Mặc định | Bắt buộc | Mô tả | Ví dụ |
|---------|------|----------|----------|-------|-------|
| `page` | number | 1 | ❌ | Trang hiện tại (≥1) | `1` |
| `limit` | number | 20 | ❌ | Số lượng mỗi trang (1-100) | `20` |
| `search` | string | - | ❌ | Tìm kiếm trong tất cả trường tên | `vinamilk` |
| `symbol` | string | - | ❌ | Tìm kiếm theo mã chứng khoán | `VNM` |
| `type` | enum | - | ❌ | Loại: `STOCK`, `BOND`, `FU` | `STOCK` |
| `board` | enum | - | ❌ | Sàn: `HSX`, `HNX`, `UPCOM` | `HSX` |
| `includePrices` | boolean | false | ❌ | Lấy giá real-time (chậm) | `true` |

#### 🎯 Search Logic:
- **`search`**: Tìm trong `organ_name`, `organ_short_name`, `en_organ_name`, `symbol`
- **`symbol`**: Tìm kiếm chỉ trong trường `symbol`
- **Độ ưu tiên kết quả**:
  1. Khớp chính xác với symbol
  2. Symbol bắt đầu bằng từ khóa
  3. Symbol chứa từ khóa
  4. Các trường khác chứa từ khóa

#### Request Examples:
```bash
# Cơ bản - lấy trang đầu
curl "http://localhost:3000/api/symbols"

# Phân trang
curl "http://localhost:3000/api/symbols?page=2&limit=10"

# Tìm kiếm theo tên công ty
curl "http://localhost:3000/api/symbols?search=vinamilk&limit=5"

# Lọc theo loại và sàn
curl "http://localhost:3000/api/symbols?type=STOCK&board=HSX&limit=50"

# Bao gồm giá real-time (chậm)
curl "http://localhost:3000/api/symbols?search=VN&includePrices=true&limit=5"

# Tìm kiếm mã chứng khoán cụ thể
curl "http://localhost:3000/api/symbols?symbol=VIC&includePrices=true"
```

#### Success Response (200):
```json
{
  "data": [
    {
      "id": 8424928,
      "symbol": "VNM",
      "type": "STOCK",
      "board": "HSX",
      "en_organ_name": "Vietnam Dairy Products Joint Stock Company",
      "organ_short_name": "VINAMILK",
      "organ_name": "Công ty Cổ phần Sữa Việt Nam",
      "product_grp_id": "STO",
      "currentPrice": 61600,           // Chỉ khi includePrices=true
      "priceUpdatedAt": "2025-09-25T07:40:00.000Z" // Chỉ khi includePrices=true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "message": "Lấy danh sách chứng khoán thành công"
}
```

#### Error Response (400):
```json
{
  "statusCode": 400,
  "message": [
    "Trang phải lớn hơn 0",
    "Limit không được vượt quá 100"
  ],
  "error": "Bad Request"
}
```

---

### 2. Lấy tất cả chứng khoán (không phân trang)

**GET** `/api/symbols/all`

⚠️ **Cảnh báo**: Endpoint này có thể trả về lượng dữ liệu lớn (>1500 records). Chỉ sử dụng khi cần thiết.

#### Query Parameters:
| Tham số | Kiểu | Mặc định | Bắt buộc | Mô tả | Ví dụ |
|---------|------|----------|----------|-------|-------|
| `search` | string | - | ❌ | Tìm kiếm theo mã hoặc tên | `vingroup` |
| `symbol` | string | - | ❌ | Tìm kiếm theo mã chứng khoán | `VIC` |
| `type` | enum | - | ❌ | Loại: `STOCK`, `BOND`, `FU` | `STOCK` |
| `board` | enum | - | ❌ | Sàn: `HSX`, `HNX`, `UPCOM` | `HSX` |
| `includePrices` | boolean | false | ❌ | Lấy giá real-time (chỉ 50 đầu tiên) | `true` |

#### 🎯 Performance Notes:
- Giới hạn `includePrices` chỉ cho **50 symbols đầu tiên** để tránh timeout
- Response không có phân trang - trả về tất cả kết quả phù hợp
- Sử dụng cùng logic tìm kiếm và sắp xếp với endpoint có phân trang

#### Request Examples:
```bash
# Lấy tất cả chứng khoán STOCK
curl "http://localhost:3000/api/symbols/all?type=STOCK"

# Lấy tất cả mã HSX
curl "http://localhost:3000/api/symbols/all?board=HSX"

# Tìm kiếm tất cả mã chứa "bank"
curl "http://localhost:3000/api/symbols/all?search=bank"
```

#### Success Response (200):
```json
{
  "data": [
    {
      "id": 8424928,
      "symbol": "VNM",
      "type": "STOCK",
      "board": "HSX",
      "en_organ_name": "Vietnam Dairy Products Joint Stock Company",
      "organ_short_name": "VINAMILK",
      "organ_name": "Công ty Cổ phần Sữa Việt Nam",
      "product_grp_id": "STO"
    },
    // ... 1500+ records
  ],
  "count": 1500,
  "message": "Lấy tất cả chứng khoán thành công"
}
```

---

### 3. Tìm kiếm chứng khoán (Alias)

**GET** `/api/symbols/search`

📝 **Lưu ý**: Endpoint này là alias của `/api/symbols` với cùng chức năng và parameters. Được tạo để semantics rõ ràng hơn khi tìm kiếm.

#### Functionality:
- Hoàn toàn giống với endpoint `GET /api/symbols`
- Hỗ trợ đầy đủ phân trang, lọc, và tìm kiếm
- Tham khảo tài liệu của endpoint `GET /api/symbols` ở trên

#### Quick Example:
```bash
curl "http://localhost:3000/api/symbols/search?search=vinamilk&limit=5"
```

---

### 4. Đếm số lượng chứng khoán

**GET** `/api/symbols/count`

Endpoint đơn giản để lấy tổng số chứng khoán trong hệ thống.

#### Query Parameters: Không có

#### Request Examples:
```bash
curl "http://localhost:3000/api/symbols/count"
```

#### Success Response (200):
```json
{
  "count": 1547,
  "message": "Lấy số lượng chứng khoán thành công"
}
```

---

### 5. Lấy thông tin chi tiết chứng khoán

**GET** `/api/symbols/{symbol}`

Lấy thông tin chi tiết của một chứng khoán cụ thể theo mã symbol.

#### Path Parameters:
| Tham số | Kiểu | Bắt buộc | Mô tả | Ví dụ |
|---------|------|----------|-------|-------|
| `symbol` | string | ✅ | Mã chứng khoán (không phân biệt hoa thường) | `VNM`, `vic` |

#### Query Parameters:
| Tham số | Kiểu | Mặc định | Bắt buộc | Mô tả | Ví dụ |
|---------|------|----------|----------|-------|-------|
| `includePrices` | boolean/string | false | ❌ | Bao gồm giá real-time từ VietCap | `true`, `"1"`, `1` |

#### 🎯 includePrices Values:
Endpoint chấp nhận các giá trị sau cho `includePrices`:
- `true` (boolean)
- `"true"` (string)
- `"1"` (string)
- `1` (number)

#### Request Examples:
```bash
# Không bao gồm giá
curl "http://localhost:3000/api/symbols/VNM"

# Bao gồm giá hiện tại (boolean)
curl "http://localhost:3000/api/symbols/VNM?includePrices=true"

# Bao gồm giá hiện tại (string)
curl "http://localhost:3000/api/symbols/VIC?includePrices=1"

# Case insensitive
curl "http://localhost:3000/api/symbols/vnm?includePrices=true"
```

#### Success Response (200) - Không có giá:
```json
{
  "data": {
    "id": 8424928,
    "symbol": "VNM",
    "type": "STOCK",
    "board": "HSX",
    "en_organ_name": "Vietnam Dairy Products Joint Stock Company",
    "organ_short_name": "VINAMILK",
    "organ_name": "Công ty Cổ phần Sữa Việt Nam",
    "product_grp_id": "STO"
  },
  "message": "Lấy thông tin chứng khoán thành công"
}
```

#### Success Response (200) - Có giá:
```json
{
  "data": {
    "id": 8424928,
    "symbol": "VNM",
    "type": "STOCK",
    "board": "HSX",
    "en_organ_name": "Vietnam Dairy Products Joint Stock Company",
    "organ_short_name": "VINAMILK",
    "organ_name": "Công ty Cổ phần Sữa Việt Nam",
    "product_grp_id": "STO",
    "currentPrice": 61600,
    "priceUpdatedAt": "2025-09-25T07:40:00.000Z"
  },
  "message": "Lấy thông tin chứng khoán thành công"
}
```

#### Not Found Response (404):
```json
{
  "data": null,
  "message": "Không tìm thấy chứng khoán"
}
```

---

### 6. Đồng bộ dữ liệu chứng khoán (Admin)

**POST** `/api/symbols/sync` 🔒

Đồng bộ dữ liệu chứng khoán từ VietCap API. Endpoint này yêu cầu JWT authentication và chỉ dành cho admin.

#### 🛡️ Authentication Required:
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

#### Query Parameters: Không có
#### Request Body: Không có

#### 🔄 Sync Process:
1. Fetch dữ liệu từ VietCap API: `https://trading.vietcap.com.vn/api/price/symbols/getAll`
2. Lọc bỏ các mã đã bị hủy niêm yết (`board !== 'DELISTED'`)
3. Batch upsert với chunk size = 100 records
4. Log progress trong quá trình xử lý

#### ⏰ Auto Sync:
- Tự động chạy mỗi ngày lúc **6:00 AM** (Cron job)
- Có thể trigger thủ công qua endpoint này

#### Request Examples:
```bash
curl -X POST "http://localhost:3000/api/symbols/sync" \
  -H "Authorization: Bearer your_jwt_token_here" \
  -H "Content-Type: application/json"
```

#### Success Response (200):
```json
{
  "message": "Đồng bộ dữ liệu chứng khoán thành công"
}
```

#### Unauthorized Response (401):
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### Server Error Response (500):
```json
{
  "statusCode": 500,
  "message": "Lỗi khi đồng bộ dữ liệu",
  "error": "Internal Server Error"
}
```

---

## 📊 Data Models & Schemas

### SymbolResponseDto
| Trường | Kiểu | Bắt buộc | Mô tả | Ví dụ |
|--------|------|----------|-------|-------|
| `id` | number | ✅ | ID chứng khoán (unique) | `8424928` |
| `symbol` | string | ✅ | Mã chứng khoán | `"VNM"` |
| `type` | string | ✅ | Loại chứng khoán | `"STOCK"`, `"BOND"`, `"FU"` |
| `board` | string | ✅ | Sàn giao dịch | `"HSX"`, `"HNX"`, `"UPCOM"` |
| `en_organ_name` | string? | ❌ | Tên công ty tiếng Anh | `"Vietnam Dairy Products JSC"` |
| `organ_short_name` | string? | ❌ | Tên viết tắt | `"VINAMILK"` |
| `organ_name` | string? | ❌ | Tên công ty tiếng Việt | `"Công ty CP Sữa Việt Nam"` |
| `product_grp_id` | string? | ❌ | Mã nhóm sản phẩm | `"STO"` |
| `currentPrice` | number? | ❌ | Giá hiện tại (VND) | `61600` |
| `priceUpdatedAt` | string? | ❌ | Timestamp cập nhật giá (ISO 8601) | `"2025-09-25T07:40:00.000Z"` |

### GetSymbolsDto (Request)
| Trường | Kiểu | Mặc định | Validation | Mô tả |
|--------|------|----------|------------|-------|
| `symbol` | string? | - | - | Tìm kiếm theo mã chứng khoán |
| `type` | enum? | - | `STOCK\|BOND\|FU` | Loại chứng khoán |
| `board` | enum? | - | `HSX\|HNX\|UPCOM` | Sàn giao dịch |
| `search` | string? | - | - | Tìm kiếm trong tất cả trường tên |
| `page` | number? | 1 | ≥1 | Trang hiện tại |
| `limit` | number? | 20 | 1-100 | Số lượng mỗi trang |
| `includePrices` | boolean? | false | - | Bao gồm giá real-time |

### PaginationMetaDto
| Trường | Kiểu | Mô tả | Ví dụ |
|--------|------|-------|-------|
| `page` | number | Trang hiện tại | `1` |
| `limit` | number | Số lượng mỗi trang | `20` |
| `total` | number | Tổng số kết quả | `100` |
| `totalPages` | number | Tổng số trang | `5` |
| `hasPreviousPage` | boolean | Có trang trước không | `false` |
| `hasNextPage` | boolean | Có trang sau không | `true` |

### SymbolsResponseDto (Paginated Response)
```typescript
{
  data: SymbolResponseDto[],      // Mảng chứng khoán
  meta: PaginationMetaDto,        // Thông tin phân trang
  message: string                 // Thông báo kết quả
}
```

### All Symbols Response (Non-paginated)
```typescript
{
  data: SymbolResponseDto[],      // Tất cả chứng khoán
  count: number,                  // Tổng số lượng
  message: string                 // Thông báo kết quả
}
```

---

## 🔍 Search & Filtering Details

### 🎯 Search Strategy
#### `search` Parameter:
Tìm kiếm **case-insensitive** trong các trường:
- `symbol` - Mã chứng khoán
- `organ_name` - Tên công ty tiếng Việt
- `organ_short_name` - Tên viết tắt
- `en_organ_name` - Tên công ty tiếng Anh

#### `symbol` Parameter:
Tìm kiếm **LIKE pattern** chỉ trong trường `symbol`:
- Input: `VN` → tìm tất cả mã chứa "VN" (VNM, VND, VNI, ...)

### 📊 Result Ranking (khi có `search`):
1. **Khớp chính xác** với symbol: `search = "VNM"` → VNM lên đầu
2. **Symbol bắt đầu** bằng từ khóa: `search = "VN"` → VNM, VND, VNI...
3. **Symbol chứa** từ khóa: `search = "bank"` → EXIMBANK, SEABANK...
4. **Các trường khác** chứa từ khóa: tên công ty, tên viết tắt...

### 🔽 Filtering Options:

#### `type` - Loại chứng khoán:
| Giá trị | Mô tả | Ví dụ |
|---------|-------|-------|
| `STOCK` | Cổ phiếu | VNM, VIC, FPT |
| `BOND` | Trái phiếu | BOND001, GOV001 |
| `FU` | Hợp đồng tương lai | VN30F1M |

#### `board` - Sàn giao dịch:
| Giá trị | Tên đầy đủ | Mô tả |
|---------|------------|-------|
| `HSX` | HOSE | Sàn giao dịch Chứng khoán TP.HCM |
| `HNX` | HNX | Sàn giao dịch Chứng khoán Hà Nội |
| `UPCOM` | UPCoM | Thị trường giao dịch Chứng khoán chưa niêm yết |

### 🔄 Combining Filters:
```bash
# Tìm tất cả STOCK của HSX có chứa "bank"
/api/symbols?type=STOCK&board=HSX&search=bank

# Tìm mã bắt đầu bằng "VN" trên tất cả sàn
/api/symbols?symbol=VN&limit=50

# Tìm BOND trên HNX
/api/symbols?type=BOND&board=HNX
```

---

## 💰 Real-time Pricing

### 🏢 VietCap Integration
API tích hợp với **VietCap** để lấy giá real-time:
- **Endpoint**: `https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart`
- **Timeframe**: 1 phút (ONE_MINUTE)
- **Method**: POST với payload JSON

### ⚡ Performance Considerations:
#### Batch Processing:
- **Concurrent limit**: 10 symbols/batch
- **Timeout protection**: Tránh blocking API
- **Fallback**: Trả về `null` nếu lỗi

#### Rate Limiting:
- `/all` endpoint: Chỉ lấy giá cho **50 symbols đầu tiên**
- Paginated endpoints: Không giới hạn (nhưng chậm hơn)

#### Price Data Response:
```typescript
{
  currentPrice: number | null,        // Giá hiện tại (VND)
  priceUpdatedAt: string | null       // ISO timestamp
}
```

### 🚨 Error Handling:
- Network error → `currentPrice: null`
- Invalid symbol → `currentPrice: null`
- API timeout → `currentPrice: null`
- Luôn trả về `priceUpdatedAt` với timestamp hiện tại

---

## 📈 Popular Vietnamese Stocks (Reference)

| Mã | Tên công ty | Sàn |
|----|-------------|-----|
| VIC | Tập đoàn Vingroup | HSX |
| VCB | Ngân hàng Vietcombank | HSX |
| FPT | Tập đoàn FPT | HSX |
| VNM | Vinamilk | HSX |
| MSN | Tập đoàn Masan | HSX |
| VHM | Vinhomes | HSX |
| GAS | PetroVietnam Gas | HSX |
| CTG | VietinBank | HSX |
| BID | BIDV | HSX |
| VRE | Vincom Retail | HSX |

---

## ⚡ Performance Tips

1. **Phân trang**: Luôn sử dụng `limit` để tránh tải quá nhiều dữ liệu
2. **Cache**: Kết quả có thể được cache trong 5-10 phút
3. **Giá real-time**: Chỉ bao gồm giá khi cần thiết với `includePrices=true`
4. **Tìm kiếm**: Sử dụng endpoint `/search` cho tìm kiếm nhanh

---

## 🚨 Error Codes

| Code | Mô tả |
|------|-------|
| 200 | Thành công |
| 400 | Tham số không hợp lệ |
| 401 | Chưa đăng nhập |
| 404 | Không tìm thấy |
| 500 | Lỗi server |

---

## 🧪 Testing

### Swagger UI
Truy cập: `http://localhost:3000/api/docs`

### Postman Collection
Import file: `symbols-api.postman_collection.json`

### cURL Examples
```bash
# Lấy top 10 chứng khoán HSX
curl "http://localhost:3000/api/symbols?board=HSX&limit=10"

# Tìm kiếm Vingroup
curl "http://localhost:3000/api/symbols/search?search=vingroup"

# Chi tiết VIC với giá
curl "http://localhost:3000/api/symbols/VIC?includePrices=true"
```