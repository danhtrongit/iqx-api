import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MqttService } from './services/mqtt.service';
import { User } from '../entities/user.entity';
import {
  SubscriptionDto,
  UnsubscriptionDto,
  TickDataDto,
  StockInfoDto,
  TopPriceDto,
  MarketIndexDto,
  OHLCDto,
  BoardEventDto,
} from './dto/market-data.dto';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    token: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/market-data',
})
export class MarketDataGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MarketDataGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();
  private clientSubscriptions = new Map<string, Set<string>>();

  constructor(
    private readonly mqttService: MqttService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.setupMqttListeners();
  }

  private setupMqttListeners() {
    this.mqttService.on('message', ({ topic, message }) => {
      this.broadcastMessage(topic, message);
    });

    this.mqttService.on('connected', () => {
      this.server.emit('mqtt_status', { status: 'connected' });
    });

    this.mqttService.on('disconnected', () => {
      this.server.emit('mqtt_status', { status: 'disconnected' });
    });

    this.mqttService.on('error', (error) => {
      this.server.emit('mqtt_error', { error: error.message });
    });
  }

  private broadcastMessage(topic: string, message: any) {
    // Broadcast to all clients subscribed to this topic
    this.connectedClients.forEach((client, clientId) => {
      const subscriptions = this.clientSubscriptions.get(clientId);
      if (subscriptions && subscriptions.has(topic)) {
        client.emit('market_data', {
          topic,
          data: message,
          timestamp: Date.now(),
        });
      }
    });
  }

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(
          `Client ${client.id} attempted to connect without token`,
        );
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);

      // Find user by ID from JWT payload
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
      });

      if (!user) {
        this.logger.warn(`Invalid user for client ${client.id}`);
        client.disconnect();
        return;
      }

      // Store authenticated user info
      client.user = {
        id: user.id,
        email: user.email,
        token: token,
      };

      this.connectedClients.set(client.id, client);
      this.clientSubscriptions.set(client.id, new Set());

      this.logger.log(`Client ${client.id} connected (User: ${user.id})`);
      client.emit('connection_status', {
        status: 'authenticated',
        userId: user.id,
        mqttConnected: this.mqttService.isClientConnected(),
      });

      // Initialize MQTT connection if not already connected
      if (!this.mqttService.isClientConnected()) {
        await this.mqttService.connectWithAuth();
      }
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}:`,
        error,
      );
      client.emit('auth_error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.clientSubscriptions.delete(client.id);
    this.logger.log(`Client ${client.id} disconnected`);

    // If no more clients, consider disconnecting MQTT
    if (this.connectedClients.size === 0) {
      // Keep MQTT connection alive for a short period in case of reconnections
      setTimeout(() => {
        if (this.connectedClients.size === 0) {
          this.mqttService.disconnect();
        }
      }, 30000); // 30 seconds grace period
    }
  }

  @SubscribeMessage('subscribe_tick')
  async handleSubscribeTick(
    @MessageBody() data: SubscriptionDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user || !data.symbol) {
      client.emit('error', { message: 'Invalid subscription request' });
      return;
    }

    const topic = `plaintext/quotes/krx/mdds/tick/v1/roundlot/symbol/${data.symbol}`;
    const success = await this.mqttService.subscribeToTick(data.symbol);

    if (success) {
      const subscriptions = this.clientSubscriptions.get(client.id);
      subscriptions?.add(topic);
      client.emit('subscription_confirmed', {
        type: 'tick',
        symbol: data.symbol,
        topic,
      });
      this.logger.log(
        `Client ${client.id} subscribed to tick data for ${data.symbol}`,
      );
    } else {
      client.emit('subscription_error', {
        type: 'tick',
        symbol: data.symbol,
        error: 'Failed to subscribe',
      });
    }
  }

  @SubscribeMessage('subscribe_stock_info')
  async handleSubscribeStockInfo(
    @MessageBody() data: SubscriptionDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user || !data.symbol) {
      client.emit('error', { message: 'Invalid subscription request' });
      return;
    }

    const topic = `plaintext/quotes/krx/mdds/stockinfo/v1/symbol/${data.symbol}`;
    const success = await this.mqttService.subscribeToStockInfo(data.symbol);

    if (success) {
      const subscriptions = this.clientSubscriptions.get(client.id);
      subscriptions?.add(topic);
      client.emit('subscription_confirmed', {
        type: 'stock_info',
        symbol: data.symbol,
        topic,
      });
      this.logger.log(
        `Client ${client.id} subscribed to stock info for ${data.symbol}`,
      );
    } else {
      client.emit('subscription_error', {
        type: 'stock_info',
        symbol: data.symbol,
        error: 'Failed to subscribe',
      });
    }
  }

  @SubscribeMessage('subscribe_top_price')
  async handleSubscribeTopPrice(
    @MessageBody() data: SubscriptionDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user || !data.symbol) {
      client.emit('error', { message: 'Invalid subscription request' });
      return;
    }

    const topic = `plaintext/quotes/krx/mdds/topprice/v1/symbol/${data.symbol}`;
    const success = await this.mqttService.subscribeToTopPrice(data.symbol);

    if (success) {
      const subscriptions = this.clientSubscriptions.get(client.id);
      subscriptions?.add(topic);
      client.emit('subscription_confirmed', {
        type: 'top_price',
        symbol: data.symbol,
        topic,
      });
      this.logger.log(
        `Client ${client.id} subscribed to top price for ${data.symbol}`,
      );
    } else {
      client.emit('subscription_error', {
        type: 'top_price',
        symbol: data.symbol,
        error: 'Failed to subscribe',
      });
    }
  }

  @SubscribeMessage('subscribe_market_index')
  async handleSubscribeMarketIndex(
    @MessageBody() data: SubscriptionDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user || !data.symbol) {
      client.emit('error', { message: 'Invalid subscription request' });
      return;
    }

    const topic = `plaintext/quotes/krx/mdds/index/v1/code/${data.symbol}`;
    const success = await this.mqttService.subscribeToMarketIndex(data.symbol);

    if (success) {
      const subscriptions = this.clientSubscriptions.get(client.id);
      subscriptions?.add(topic);
      client.emit('subscription_confirmed', {
        type: 'market_index',
        indexCode: data.symbol,
        topic,
      });
      this.logger.log(
        `Client ${client.id} subscribed to market index for ${data.symbol}`,
      );
    } else {
      client.emit('subscription_error', {
        type: 'market_index',
        indexCode: data.symbol,
        error: 'Failed to subscribe',
      });
    }
  }

  @SubscribeMessage('subscribe_ohlc')
  async handleSubscribeOHLC(
    @MessageBody() data: SubscriptionDto & { resolution?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user || !data.symbol) {
      client.emit('error', { message: 'Invalid subscription request' });
      return;
    }

    const resolution = data.resolution || '1D';
    const topic = `plaintext/quotes/krx/mdds/ohlc/v1/${resolution}/symbol/${data.symbol}`;
    const success = await this.mqttService.subscribeToOHLC(
      data.symbol,
      resolution,
    );

    if (success) {
      const subscriptions = this.clientSubscriptions.get(client.id);
      subscriptions?.add(topic);
      client.emit('subscription_confirmed', {
        type: 'ohlc',
        symbol: data.symbol,
        resolution,
        topic,
      });
      this.logger.log(
        `Client ${client.id} subscribed to OHLC data for ${data.symbol} (${resolution})`,
      );
    } else {
      client.emit('subscription_error', {
        type: 'ohlc',
        symbol: data.symbol,
        resolution,
        error: 'Failed to subscribe',
      });
    }
  }

  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @MessageBody() data: UnsubscriptionDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user || !data.topic) {
      client.emit('error', { message: 'Invalid unsubscription request' });
      return;
    }

    const success = await this.mqttService.unsubscribe(data.topic);

    if (success) {
      const subscriptions = this.clientSubscriptions.get(client.id);
      subscriptions?.delete(data.topic);
      client.emit('unsubscription_confirmed', {
        topic: data.topic,
      });
      this.logger.log(`Client ${client.id} unsubscribed from ${data.topic}`);
    } else {
      client.emit('unsubscription_error', {
        topic: data.topic,
        error: 'Failed to unsubscribe',
      });
    }
  }

  @SubscribeMessage('get_subscriptions')
  handleGetSubscriptions(@ConnectedSocket() client: AuthenticatedSocket) {
    const subscriptions = this.clientSubscriptions.get(client.id);
    client.emit('current_subscriptions', {
      subscriptions: Array.from(subscriptions || []),
      mqttSubscriptions: Array.from(this.mqttService.getSubscriptions().keys()),
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', {
      timestamp: Date.now(),
      mqttConnected: this.mqttService.isClientConnected(),
    });
  }
}
