# Market Data Socket API Usage

This document explains how to use the Socket API for real-time market data from DNSE.

## Prerequisites

Before using the API, you need to configure your DNSE credentials. See [DNSE_CREDENTIALS_SETUP.md](./DNSE_CREDENTIALS_SETUP.md) for detailed setup instructions.

### Quick Setup

Create a `.env` file with your DNSE credentials:

```bash
DNSE_USERNAME=your_email@example.com
DNSE_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

## WebSocket Endpoint

Connect to: `ws://localhost:3000/market-data`

## Authentication

Include JWT token in connection:

```javascript
const socket = io('ws://localhost:3000/market-data', {
  auth: {
    token: 'your-jwt-token-here'
  }
});

// or via authorization header
const socket = io('ws://localhost:3000/market-data', {
  extraHeaders: {
    Authorization: 'Bearer your-jwt-token-here'
  }
});
```

## Events

### Connection Events

```javascript
// Connection successful and authenticated
socket.on('connection_status', (data) => {
  console.log('Status:', data.status); // 'authenticated'
  console.log('User ID:', data.userId);
  console.log('MQTT Connected:', data.mqttConnected);
});

// Authentication failed
socket.on('auth_error', (error) => {
  console.log('Auth failed:', error.message);
});

// MQTT connection status
socket.on('mqtt_status', (data) => {
  console.log('MQTT Status:', data.status); // 'connected' or 'disconnected'
});
```

### Market Data Subscriptions

#### Subscribe to Tick Data (Live Trades)

```javascript
socket.emit('subscribe_tick', {
  symbol: '41I1F7000' // KRX symbol code
});

socket.on('subscription_confirmed', (data) => {
  console.log('Subscribed to:', data);
});

socket.on('market_data', (data) => {
  if (data.topic.includes('tick')) {
    console.log('Tick Data:', {
      symbol: data.data.symbol,
      matchPrice: data.data.matchPrice,
      matchQtty: data.data.matchQtty,
      side: data.data.side,
      sendingTime: data.data.sendingTime
    });
  }
});
```

#### Subscribe to Stock Info

```javascript
socket.emit('subscribe_stock_info', {
  symbol: '41I1F7000'
});
```

#### Subscribe to Top Price (Best Bid/Ask)

```javascript
socket.emit('subscribe_top_price', {
  symbol: '41I1F7000'
});
```

#### Subscribe to Market Index

```javascript
socket.emit('subscribe_market_index', {
  symbol: 'KOSPI200' // Index code
});
```

#### Subscribe to OHLC Data

```javascript
socket.emit('subscribe_ohlc', {
  symbol: '41I1F7000',
  resolution: '1D' // Optional: 1m, 5m, 1h, 1D, etc.
});
```

### Unsubscribe

```javascript
socket.emit('unsubscribe', {
  topic: 'plaintext/quotes/krx/mdds/tick/v1/roundlot/symbol/41I1F7000'
});

socket.on('unsubscription_confirmed', (data) => {
  console.log('Unsubscribed from:', data.topic);
});
```

### Utility Events

#### Get Current Subscriptions

```javascript
socket.emit('get_subscriptions');

socket.on('current_subscriptions', (data) => {
  console.log('Client subscriptions:', data.subscriptions);
  console.log('MQTT subscriptions:', data.mqttSubscriptions);
});
```

#### Ping/Pong for Connection Health

```javascript
socket.emit('ping');

socket.on('pong', (data) => {
  console.log('Pong received:', data.timestamp);
  console.log('MQTT connected:', data.mqttConnected);
});
```

## Error Handling

```javascript
socket.on('subscription_error', (error) => {
  console.error('Subscription failed:', error);
});

socket.on('mqtt_error', (error) => {
  console.error('MQTT error:', error);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

## Complete Example

```javascript
const io = require('socket.io-client');

const socket = io('ws://localhost:3000/market-data', {
  auth: {
    token: 'your-jwt-token-here'
  }
});

socket.on('connection_status', (data) => {
  if (data.status === 'authenticated') {
    console.log('Connected successfully!');

    // Subscribe to tick data for Samsung Electronics
    socket.emit('subscribe_tick', {
      symbol: '41I1F7000'
    });
  }
});

socket.on('market_data', (data) => {
  console.log('Real-time data:', data);
});

socket.on('subscription_confirmed', (data) => {
  console.log('Successfully subscribed:', data);
});

// Graceful cleanup
process.on('SIGINT', () => {
  socket.disconnect();
  process.exit(0);
});
```

## Symbol Codes

Common KRX symbol codes:
- Samsung Electronics: `41I1F7000`
- SK Hynix: `41I1F8000`
- NAVER: `41I1F9000`

For other symbols, refer to the KRX market data documentation or use the symbols API endpoint.