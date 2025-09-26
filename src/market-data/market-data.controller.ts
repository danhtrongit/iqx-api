import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { MqttService } from './services/mqtt.service';
import { DnseAuthService } from './services/dnse-auth.service';

@Controller('market-data')
export class MarketDataController {
  private readonly logger = new Logger(MarketDataController.name);

  constructor(
    private readonly mqttService: MqttService,
    private readonly dnseAuthService: DnseAuthService,
  ) {}

  @Get('status')
  getStatus() {
    return {
      mqttConnected: this.mqttService.isClientConnected(),
      subscriptions: Array.from(this.mqttService.getSubscriptions().keys()),
      timestamp: new Date().toISOString(),
    };
  }

  @Post('test-connection')
  async testConnection() {
    this.logger.log('🧪 Testing DNSE connection...');

    try {
      const credentials = await this.dnseAuthService.getCredentialsFromEnv();

      if (!credentials) {
        return {
          success: false,
          error: 'Failed to get DNSE credentials',
          message: 'Check your .env file for DNSE_USERNAME and DNSE_PASSWORD',
        };
      }

      const connected = await this.mqttService.connectWithAuth();

      return {
        success: connected,
        mqttConnected: this.mqttService.isClientConnected(),
        investorId: credentials.investorId,
        message: connected
          ? 'MQTT connection successful'
          : 'MQTT connection failed',
      };
    } catch (error) {
      this.logger.error('❌ Test connection failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Connection test failed',
      };
    }
  }

  @Post('test-subscribe')
  async testSubscribe(@Body() body: { symbol: string; type: string }) {
    const { symbol, type } = body;

    this.logger.log(`🧪 Testing subscription: ${type} for symbol ${symbol}`);

    if (!this.mqttService.isClientConnected()) {
      return {
        success: false,
        error: 'MQTT not connected',
        message: 'Call /test-connection first',
      };
    }

    try {
      let result = false;

      switch (type) {
        case 'tick':
          result = await this.mqttService.subscribeToTick(symbol);
          break;
        case 'stock_info':
          result = await this.mqttService.subscribeToStockInfo(symbol);
          break;
        case 'top_price':
          result = await this.mqttService.subscribeToTopPrice(symbol);
          break;
        case 'market_index':
          result = await this.mqttService.subscribeToMarketIndex(symbol);
          break;
        default:
          return {
            success: false,
            error: 'Invalid type',
            message: 'Use: tick, stock_info, top_price, or market_index',
          };
      }

      return {
        success: result,
        symbol,
        type,
        subscriptions: Array.from(this.mqttService.getSubscriptions().keys()),
        message: result ? 'Subscription successful' : 'Subscription failed',
      };
    } catch (error) {
      this.logger.error('❌ Test subscribe failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Subscription test failed',
      };
    }
  }
}
