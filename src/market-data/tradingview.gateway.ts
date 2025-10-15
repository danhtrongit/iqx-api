import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TradingViewService } from './services/tradingview.service';
import { MqttService } from './services/mqtt.service';

interface SubscriptionRequest {
  symbols: string[];
  flags?: string[];
}

interface SubscriptionResponse {
  symbol: string;
  status: 'ok' | 'error';
  message?: string;
}

@WebSocketGateway({
  namespace: 'tradingview',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class TradingViewGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TradingViewGateway.name);
  private clientSubscriptions = new Map<string, Set<string>>();

  constructor(
    private readonly tradingViewService: TradingViewService,
    private readonly mqttService: MqttService,
  ) {
    this.setupMqttListeners();
  }

  afterInit(server: Server) {
    this.logger.log('💹 TradingView WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`✅ TradingView client connected: ${client.id}`);
    this.clientSubscriptions.set(client.id, new Set());
    
    // Send initial connection acknowledgment
    client.emit('connected', {
      message: 'Connected to TradingView WebSocket',
      serverTime: Math.floor(Date.now() / 1000),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ TradingView client disconnected: ${client.id}`);
    
    // Clean up subscriptions
    const subscriptions = this.clientSubscriptions.get(client.id);
    if (subscriptions) {
      subscriptions.forEach((symbol) => {
        this.checkAndUnsubscribe(symbol);
      });
      this.clientSubscriptions.delete(client.id);
    }
  }

  /**
   * Subscribe to real-time quotes
   * Message format: { symbols: ['VNM', 'VIC'], flags: ['full_data'] }
   */
  @SubscribeMessage('quote_subscribe')
  async handleQuoteSubscribe(
    @MessageBody() data: SubscriptionRequest,
    @ConnectedSocket() client: Socket,
  ): Promise<SubscriptionResponse[]> {
    this.logger.log(`📊 Quote subscription request from ${client.id}: ${JSON.stringify(data)}`);
    
    const responses: SubscriptionResponse[] = [];
    const clientSubs = this.clientSubscriptions.get(client.id) || new Set();

    for (const symbol of data.symbols) {
      try {
        // Subscribe to MQTT topics for this symbol
        await this.mqttService.subscribeToTick(symbol);
        await this.mqttService.subscribeToStockInfo(symbol);
        
        // Track subscription
        clientSubs.add(symbol);
        
        // Send initial quote data
        const quotes = await this.tradingViewService.getQuotes([symbol]);
        if (quotes[symbol]) {
          client.emit('quote_update', quotes[symbol]);
        }
        
        responses.push({
          symbol,
          status: 'ok',
        });
        
        this.logger.log(`✅ Subscribed ${client.id} to ${symbol}`);
      } catch (error) {
        this.logger.error(`Failed to subscribe to ${symbol}:`, error);
        responses.push({
          symbol,
          status: 'error',
          message: error.message,
        });
      }
    }

    this.clientSubscriptions.set(client.id, clientSubs);
    return responses;
  }

  /**
   * Unsubscribe from real-time quotes
   * Message format: { symbols: ['VNM', 'VIC'] }
   */
  @SubscribeMessage('quote_unsubscribe')
  handleQuoteUnsubscribe(
    @MessageBody() data: { symbols: string[] },
    @ConnectedSocket() client: Socket,
  ): SubscriptionResponse[] {
    this.logger.log(`📊 Quote unsubscribe request from ${client.id}: ${JSON.stringify(data)}`);
    
    const responses: SubscriptionResponse[] = [];
    const clientSubs = this.clientSubscriptions.get(client.id);

    if (!clientSubs) {
      return data.symbols.map((symbol) => ({
        symbol,
        status: 'error',
        message: 'No active subscriptions',
      }));
    }

    for (const symbol of data.symbols) {
      if (clientSubs.has(symbol)) {
        clientSubs.delete(symbol);
        this.checkAndUnsubscribe(symbol);
        
        responses.push({
          symbol,
          status: 'ok',
        });
        
        this.logger.log(`✅ Unsubscribed ${client.id} from ${symbol}`);
      } else {
        responses.push({
          symbol,
          status: 'error',
          message: 'Not subscribed',
        });
      }
    }

    return responses;
  }

  /**
   * Get real-time bar/candle updates
   * Message format: { symbol: 'VNM', resolution: '1' }
   */
  @SubscribeMessage('bar_subscribe')
  async handleBarSubscribe(
    @MessageBody() data: { symbol: string; resolution: string },
    @ConnectedSocket() client: Socket,
  ): Promise<SubscriptionResponse> {
    this.logger.log(`📈 Bar subscription request from ${client.id}: ${JSON.stringify(data)}`);
    
    try {
      const resolution = this.mapResolution(data.resolution);
      await this.mqttService.subscribeToOHLC(data.symbol, resolution);
      
      const clientSubs = this.clientSubscriptions.get(client.id) || new Set();
      clientSubs.add(`bar_${data.symbol}_${data.resolution}`);
      this.clientSubscriptions.set(client.id, clientSubs);
      
      return {
        symbol: data.symbol,
        status: 'ok',
      };
    } catch (error) {
      this.logger.error(`Failed to subscribe to bars for ${data.symbol}:`, error);
      return {
        symbol: data.symbol,
        status: 'error',
        message: error.message,
      };
    }
  }

  /**
   * Set up MQTT listeners to forward data to WebSocket clients
   */
  private setupMqttListeners() {
    this.mqttService.on('message', ({ topic, message }) => {
      // Extract symbol from topic
      const symbolMatch = topic.match(/symbol\/([A-Z0-9]+)/);
      if (!symbolMatch) return;
      
      const symbol = symbolMatch[1];
      
      // Handle different topic types
      if (topic.includes('/tick/') || topic.includes('/stockinfo/')) {
        this.broadcastQuoteUpdate(symbol, message);
      } else if (topic.includes('/ohlc/')) {
        const resolutionMatch = topic.match(/\/ohlc\/v1\/([^\/]+)\//);
        if (resolutionMatch) {
          this.broadcastBarUpdate(symbol, resolutionMatch[1], message);
        }
      }
    });
  }

  /**
   * Broadcast quote updates to subscribed clients
   */
  private async broadcastQuoteUpdate(symbol: string, data: any) {
    const quotes = await this.tradingViewService.getQuotes([symbol]);
    
    if (quotes[symbol]) {
      // Send to all clients subscribed to this symbol
      this.clientSubscriptions.forEach((subscriptions, clientId) => {
        if (subscriptions.has(symbol)) {
          const client = this.server.sockets.sockets.get(clientId);
          if (client) {
            client.emit('quote_update', quotes[symbol]);
          }
        }
      });
    }
  }

  /**
   * Broadcast bar/candle updates to subscribed clients
   */
  private broadcastBarUpdate(symbol: string, resolution: string, data: any) {
    const bar = this.convertToTradingViewBar(data);
    
    if (bar) {
      // Send to all clients subscribed to this symbol's bars
      const subscriptionKey = `bar_${symbol}_${this.reverseMapResolution(resolution)}`;
      
      this.clientSubscriptions.forEach((subscriptions, clientId) => {
        if (subscriptions.has(subscriptionKey)) {
          const client = this.server.sockets.sockets.get(clientId);
          if (client) {
            client.emit('bar_update', {
              symbol,
              resolution: this.reverseMapResolution(resolution),
              bar,
            });
          }
        }
      });
    }
  }

  /**
   * Check if we should unsubscribe from MQTT topic
   */
  private checkAndUnsubscribe(symbol: string) {
    // Check if any other clients are still subscribed
    let isStillNeeded = false;
    
    this.clientSubscriptions.forEach((subscriptions) => {
      if (subscriptions.has(symbol)) {
        isStillNeeded = true;
      }
    });
    
    if (!isStillNeeded) {
      // Unsubscribe from MQTT topics
      this.mqttService.unsubscribe(`plaintext/quotes/krx/mdds/tick/v1/roundlot/symbol/${symbol}`);
      this.mqttService.unsubscribe(`plaintext/quotes/krx/mdds/stockinfo/v1/symbol/${symbol}`);
      this.logger.log(`🔴 Unsubscribed from MQTT topics for ${symbol}`);
    }
  }

  /**
   * Convert MQTT data to TradingView bar format
   */
  private convertToTradingViewBar(data: any): any {
    if (!data || !data.timestamp) return null;
    
    return {
      time: Math.floor(new Date(data.timestamp).getTime() / 1000),
      open: data.open || 0,
      high: data.high || 0,
      low: data.low || 0,
      close: data.close || 0,
      volume: data.volume || 0,
    };
  }

  /**
   * Map TradingView resolution to MQTT resolution
   */
  private mapResolution(resolution: string): string {
    const resolutionMap: { [key: string]: string } = {
      '1': '1m',
      '5': '5m',
      '15': '15m',
      '30': '30m',
      '60': '1h',
      '240': '4h',
      '1D': '1D',
      '1W': '1W',
      '1M': '1M',
    };
    return resolutionMap[resolution] || '1D';
  }

  /**
   * Reverse map MQTT resolution to TradingView resolution
   */
  private reverseMapResolution(resolution: string): string {
    const resolutionMap: { [key: string]: string } = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '4h': '240',
      '1D': '1D',
      '1W': '1W',
      '1M': '1M',
    };
    return resolutionMap[resolution] || '1D';
  }
}
