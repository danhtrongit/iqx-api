# Vietnamese Market Data Socket Testing Guide

Complete testing guide for VNINDEX and VIC (Vingroup) real-time market data.

## 🎯 Overview

This guide provides multiple ways to test the Vietnamese market data socket API with focus on:
- **VNINDEX**: Vietnamese stock market index
- **VIC**: Vingroup Corporation (Vietnam's largest conglomerate)
- Other major Vietnamese stocks: VCB, FPT, MSN, VHM

## 🚀 Quick Start

### 1. Start the Server

```bash
# Install dependencies
pnpm install

# Set up your DNSE credentials in .env
DNSE_USERNAME=your_email@example.com
DNSE_PASSWORD=your_password
JWT_SECRET=your_jwt_secret

# Start the development server
npm run start:dev
```

### 2. Get JWT Token

First, you need to authenticate and get a JWT token:

```bash
# Login via API to get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'
```

Save the `accessToken` from the response.

## 🧪 Testing Methods

### Method 1: Web Browser Test Client

Open the interactive HTML test client:

```bash
# Open in your browser
open vietnamese-market-test.html
```

**Features:**
- 🇻🇳 Vietnamese-focused interface
- 📊 Real-time data visualization for VNINDEX and VIC
- 🚀 One-click test buttons for major Vietnamese stocks
- 📜 Detailed message logging
- 💾 Export test results

**Quick Actions:**
- Click "VNINDEX" to test Vietnamese stock market index
- Click "VIC" to test Vingroup real-time data
- Click "Test All" to subscribe to all major Vietnamese stocks

### Method 2: Node.js Command Line Test

Run the interactive command-line tester:

```bash
# Interactive mode
npm run test:market

# Auto mode (runs all tests automatically)
npm run test:market:auto

# With environment token
JWT_TOKEN=your_jwt_token npm run test:market:auto
```

**Interactive Menu:**
```
🇻🇳 Vietnamese Market Data Test Menu:
1. Test VNINDEX
2. Test VIC (Vingroup)
3. Test VCB (Vietcombank)
4. Test FPT Corporation
5. Test All Major Stocks
6. Subscribe to custom symbol
7. Get current subscriptions
8. Ping server
9. Run comprehensive tests
0. Quit
```

### Method 3: Direct Socket.io Testing

```javascript
const io = require('socket.io-client');

const socket = io('ws://localhost:3000/market-data', {
  auth: { token: 'your_jwt_token_here' }
});

// Test VNINDEX
socket.emit('subscribe_market_index', { symbol: 'VNINDEX' });

// Test VIC
socket.emit('subscribe_tick', { symbol: 'VIC' });
socket.emit('subscribe_stock_info', { symbol: 'VIC' });
socket.emit('subscribe_top_price', { symbol: 'VIC' });

// Listen for data
socket.on('market_data', (data) => {
  console.log('Market Data:', data);
});
```

## 📊 Test Scenarios

### Scenario 1: VNINDEX Index Testing

```javascript
// Subscribe to Vietnamese stock market index
socket.emit('subscribe_market_index', { symbol: 'VNINDEX' });

// Expected data:
{
  topic: "plaintext/quotes/krx/mdds/index/v1/code/VNINDEX",
  data: {
    indexCode: "VNINDEX",
    indexValue: 1234.56,
    changeValue: 12.34,
    changePercent: 1.05,
    lastUpdate: "2024-01-15T09:30:00Z"
  }
}
```

### Scenario 2: VIC (Vingroup) Stock Testing

```javascript
// Subscribe to Vingroup tick data
socket.emit('subscribe_tick', { symbol: 'VIC' });

// Expected tick data:
{
  topic: "plaintext/quotes/krx/mdds/tick/v1/roundlot/symbol/VIC",
  data: {
    symbol: "VIC",
    matchPrice: 85500,
    matchQtty: 1000,
    side: "BUY",
    sendingTime: "09:30:15.123"
  }
}
```

### Scenario 3: Multiple Vietnamese Stocks

Test all major Vietnamese stocks simultaneously:

```javascript
const majorStocks = ['VIC', 'VCB', 'FPT', 'MSN', 'VHM', 'GAS', 'CTG', 'BID'];

majorStocks.forEach(symbol => {
  socket.emit('subscribe_tick', { symbol });
  socket.emit('subscribe_stock_info', { symbol });
});
```

## 🔍 What to Expect

### Data Types You'll Receive:

1. **Index Data (VNINDEX)**:
   - Current index value
   - Change value and percentage
   - Real-time updates

2. **Tick Data (VIC)**:
   - Match price and quantity
   - Buy/sell side information
   - Precise timing

3. **Stock Info**:
   - Open, high, low, close prices
   - Current price and volume
   - Market status

4. **Top Price (Best Bid/Ask)**:
   - Best bid price and quantity
   - Best ask price and quantity
   - Market depth level 1

## 🐛 Troubleshooting

### Common Issues:

1. **Authentication Failed**:
   ```
   Solution: Check your JWT token is valid and not expired
   ```

2. **No Market Data Received**:
   ```
   Possible causes:
   - Market is closed
   - DNSE credentials invalid
   - Symbol not found
   - Network connectivity issues
   ```

3. **MQTT Connection Failed**:
   ```
   Solution:
   - Verify DNSE_USERNAME and DNSE_PASSWORD in .env
   - Check account has market data access
   ```

### Debug Commands:

```bash
# Check server logs
npm run start:dev

# Test connection only
curl -X GET http://localhost:3000/api/health

# Verify JWT token
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer your_jwt_token"
```

## 📈 Expected Vietnamese Market Symbols

**Major Stocks:**
- **VIC**: Vingroup Corporation (Real estate, retail)
- **VCB**: Vietcombank (Banking)
- **FPT**: FPT Corporation (Technology)
- **MSN**: Masan Group (Consumer goods)
- **VHM**: Vinhomes (Real estate)
- **GAS**: PetroVietnam Gas (Oil & gas)
- **CTG**: VietinBank (Banking)
- **BID**: BIDV (Banking)

**Indices:**
- **VNINDEX**: Ho Chi Minh City Stock Exchange Index
- **VN30**: Top 30 stocks index
- **HNXINDEX**: Hanoi Stock Exchange Index

## 🎉 Success Indicators

You know the testing is working when you see:

1. ✅ WebSocket connection established
2. ✅ MQTT status shows "connected"
3. ✅ Subscription confirmations received
4. 📊 Real-time market data flowing
5. 📈 VNINDEX values updating
6. 🏢 VIC stock prices changing

## 📝 Test Results Log

The test clients will show logs like:

```
[09:30:15] ✅ Connected to Vietnamese market data server
[09:30:16] 📡 MQTT Status: connected
[09:30:17] ✅ Subscription confirmed: market_index for VNINDEX
[09:30:18] 📊 INDEX [VNINDEX]: Value=1234.56, Change=12.34 (1.05%)
[09:30:19] ✅ Subscription confirmed: tick for VIC
[09:30:20] 📈 TICK [VIC]: Price=85500, Qty=1000, Side=BUY
```

This comprehensive testing setup ensures your Vietnamese market data socket API is working correctly with both the VNINDEX and VIC symbol data feeds.