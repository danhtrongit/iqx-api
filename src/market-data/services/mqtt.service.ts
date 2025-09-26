import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { EventEmitter } from 'events';
import { DnseAuthService } from './dnse-auth.service';

export interface MqttConnectionConfig {
  host: string;
  port: number;
  clientIdPrefix: string;
  investorId: string;
  token: string;
  path: string;
}

@Injectable()
export class MqttService extends EventEmitter implements OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient | null = null;
  private isConnected = false;
  private subscriptions = new Map<string, number>();

  constructor(private readonly dnseAuthService: DnseAuthService) {
    super();
  }

  async connectWithAuth(): Promise<boolean> {
    this.logger.log('🔍 Starting DNSE authentication process...');
    const credentials = await this.dnseAuthService.getCredentialsFromEnv();

    if (!credentials) {
      this.logger.error(
        '❌ Failed to get DNSE credentials - check your .env file',
      );
      this.logger.error('Required: DNSE_USERNAME and DNSE_PASSWORD');
      return false;
    }

    this.logger.log(
      `✅ Got DNSE credentials for investor: ${credentials.investorId}`,
    );

    const config: MqttConnectionConfig = {
      host: 'datafeed-lts-krx.dnse.com.vn',
      port: 443,
      clientIdPrefix: 'dnse-price-json-mqtt-ws-sub-',
      investorId: credentials.investorId,
      token: credentials.token,
      path: '/wss',
    };

    this.logger.log(
      `🔌 Attempting MQTT connection to ${config.host}:${config.port}${config.path}`,
    );
    const result = await this.connect(config);

    if (result) {
      this.logger.log('🎉 MQTT connection to DNSE established successfully!');
    } else {
      this.logger.error('💥 Failed to establish MQTT connection to DNSE');
    }

    return result;
  }

  async connect(config: MqttConnectionConfig): Promise<boolean> {
    if (this.client && this.isConnected) {
      this.logger.warn('⚠️ MQTT client is already connected');
      return true;
    }

    try {
      // Generate random client ID
      const randomId = Math.floor(Math.random() * 1000) + 1000;
      const clientId = `${config.clientIdPrefix}${randomId}`;

      this.logger.log(`🆔 Using client ID: ${clientId}`);
      this.logger.log(`👤 Username: ${config.investorId}`);
      this.logger.log(`🔑 Token: ${config.token.substring(0, 20)}...`);

      // Create MQTT client with WebSocket transport
      this.client = mqtt.connect(
        `wss://${config.host}:${config.port}${config.path}`,
        {
          clientId,
          username: config.investorId,
          password: config.token,
          protocol: 'wss',
          protocolVersion: 5, // MQTTv5
          clean: true,
          keepalive: 1200,
          rejectUnauthorized: false, // Skip SSL certificate verification
          reconnectPeriod: 5000,
          connectTimeout: 30000,
        },
      );

      this.logger.log('📡 MQTT client created, setting up event handlers...');

      // Set up event handlers
      this.setupEventHandlers();

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.logger.error('⏰ MQTT connection timeout (30 seconds)');
          resolve(false);
        }, 30000);

        this.client!.once('connect', (connack) => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.logger.log(
            `✅ Successfully connected to MQTT broker! Connack: ${JSON.stringify(connack)}`,
          );
          resolve(true);
        });

        this.client!.once('error', (error) => {
          clearTimeout(timeout);
          this.logger.error(
            `❌ Failed to connect to MQTT broker: ${error.message}`,
          );
          this.logger.error(`🔍 Full error:`, error);
          resolve(false);
        });
      });
    } catch (error) {
      this.logger.error('💥 Error creating MQTT connection:', error);
      return false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', (connack) => {
      this.isConnected = true;
      this.logger.log('Connected to MQTT broker');
      this.emit('connected', connack);
    });

    this.client.on('message', (topic, payload) => {
      try {
        const message = JSON.parse(payload.toString());
        this.logger.log(`📨 Received message on topic: ${topic}`);
        this.logger.debug(`📊 Message data: ${JSON.stringify(message)}`);
        this.emit('message', { topic, message });
      } catch (error) {
        this.logger.error(
          `❌ Failed to parse message from topic ${topic}:`,
          error,
        );
        this.logger.error(`🔍 Raw payload: ${payload.toString()}`);
      }
    });

    this.client.on('error', (error) => {
      this.logger.error('MQTT client error:', error);
      this.emit('error', error);
    });

    this.client.on('disconnect', () => {
      this.isConnected = false;
      this.logger.warn('Disconnected from MQTT broker');
      this.emit('disconnected');
    });

    this.client.on('offline', () => {
      this.isConnected = false;
      this.logger.warn('MQTT client is offline');
      this.emit('offline');
    });

    this.client.on('reconnect', () => {
      this.logger.log('Attempting to reconnect to MQTT broker');
      this.emit('reconnecting');
    });
  }

  async subscribe(topic: string, qos: 0 | 1 | 2 = 1): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      this.logger.error('MQTT client is not connected');
      return false;
    }

    return new Promise((resolve) => {
      this.client!.subscribe(topic, { qos }, (error) => {
        if (error) {
          this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
          resolve(false);
        } else {
          this.subscriptions.set(topic, qos);
          this.logger.log(
            `Successfully subscribed to topic: ${topic} with QoS ${qos}`,
          );
          resolve(true);
        }
      });
    });
  }

  async unsubscribe(topic: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      this.logger.error('MQTT client is not connected');
      return false;
    }

    return new Promise((resolve) => {
      this.client!.unsubscribe(topic, (error) => {
        if (error) {
          this.logger.error(
            `Failed to unsubscribe from topic ${topic}:`,
            error,
          );
          resolve(false);
        } else {
          this.subscriptions.delete(topic);
          this.logger.log(`Successfully unsubscribed from topic: ${topic}`);
          resolve(true);
        }
      });
    });
  }

  async publish(
    topic: string,
    message: any,
    qos: 0 | 1 | 2 = 1,
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      this.logger.error('MQTT client is not connected');
      return false;
    }

    return new Promise((resolve) => {
      const payload =
        typeof message === 'string' ? message : JSON.stringify(message);
      this.client!.publish(topic, payload, { qos }, (error) => {
        if (error) {
          this.logger.error(`Failed to publish to topic ${topic}:`, error);
          resolve(false);
        } else {
          this.logger.debug(`Successfully published to topic: ${topic}`);
          resolve(true);
        }
      });
    });
  }

  getSubscriptions(): Map<string, number> {
    return new Map(this.subscriptions);
  }

  isClientConnected(): boolean {
    return this.isConnected && this.client?.connected === true;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.logger.log('Disconnecting from MQTT broker');
      await new Promise<void>((resolve) => {
        this.client!.end(true, () => {
          this.isConnected = false;
          resolve();
        });
      });
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  // Convenience methods for DNSE market data topics
  async subscribeToTick(symbol: string): Promise<boolean> {
    const topic = `plaintext/quotes/krx/mdds/tick/v1/roundlot/symbol/${symbol}`;
    return this.subscribe(topic);
  }

  async subscribeToStockInfo(symbol: string): Promise<boolean> {
    const topic = `plaintext/quotes/krx/mdds/stockinfo/v1/symbol/${symbol}`;
    return this.subscribe(topic);
  }

  async subscribeToTopPrice(symbol: string): Promise<boolean> {
    const topic = `plaintext/quotes/krx/mdds/topprice/v1/symbol/${symbol}`;
    return this.subscribe(topic);
  }

  async subscribeToMarketIndex(indexCode: string): Promise<boolean> {
    const topic = `plaintext/quotes/krx/mdds/index/v1/code/${indexCode}`;
    return this.subscribe(topic);
  }

  async subscribeToOHLC(
    symbol: string,
    resolution: string = '1D',
  ): Promise<boolean> {
    const topic = `plaintext/quotes/krx/mdds/ohlc/v1/${resolution}/symbol/${symbol}`;
    return this.subscribe(topic);
  }

  async subscribeToBoardEvent(symbol: string): Promise<boolean> {
    const topic = `plaintext/quotes/krx/mdds/boardevent/v1/symbol/${symbol}`;
    return this.subscribe(topic);
  }
}
