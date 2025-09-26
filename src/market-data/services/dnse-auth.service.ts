import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface DnseCredentials {
  username: string;
  password: string;
  investorId?: string;
  token?: string;
}

export interface DnseAuthResponse {
  token: string;
  investorId: string;
}

@Injectable()
export class DnseAuthService {
  private readonly logger = new Logger(DnseAuthService.name);
  private readonly AUTH_URL = 'https://api.dnse.com.vn/user-service/api/auth';
  private readonly USER_INFO_URL = 'https://api.dnse.com.vn/user-service/api/me';

  constructor(private readonly configService: ConfigService) {}

  async authenticate(username: string, password: string): Promise<DnseAuthResponse | null> {
    try {
      this.logger.log(`🔐 Authenticating with DNSE API for user: ${username}`);

      // Step 1: Login to get token
      const authResponse = await axios.post(this.AUTH_URL, {
        username,
        password,
      });

      if (!authResponse.data?.token) {
        this.logger.error('❌ No token received from DNSE authentication');
        this.logger.error(`🔍 Response data: ${JSON.stringify(authResponse.data)}`);
        throw new Error('No token received from authentication');
      }

      const token = authResponse.data.token;
      this.logger.log('✅ Authentication successful, fetching investor info...');

      // Step 2: Get investor info
      const userInfoResponse = await axios.get(this.USER_INFO_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userInfoResponse.data?.investorId) {
        this.logger.error('❌ No investorId received from DNSE user info');
        this.logger.error(`🔍 Response data: ${JSON.stringify(userInfoResponse.data)}`);
        throw new Error('No investorId received from user info');
      }

      const investorId = userInfoResponse.data.investorId.toString();

      this.logger.log(`🎉 Successfully authenticated! InvestorId: ${investorId}`);
      this.logger.log(`🔑 Token: ${token.substring(0, 30)}...`);

      return {
        token,
        investorId,
      };
    } catch (error) {
      if (error.response) {
        this.logger.error(`❌ DNSE API error (${error.response.status}): ${error.response.statusText}`);
        this.logger.error(`🔍 Response data: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        this.logger.error('❌ No response from DNSE API - check network connectivity');
        this.logger.error(`🔍 Request: ${error.request}`);
      } else {
        this.logger.error(`❌ DNSE authentication failed: ${error.message}`);
      }
      return null;
    }
  }

  async getCredentialsFromEnv(): Promise<DnseAuthResponse | null> {
    this.logger.log('🔍 Getting DNSE credentials from environment...');

    const username = this.configService.get<string>('DNSE_USERNAME');
    const password = this.configService.get<string>('DNSE_PASSWORD');

    // Check if we already have stored credentials
    const existingInvestorId = this.configService.get<string>('DNSE_INVESTOR_ID');
    const existingToken = this.configService.get<string>('DNSE_TOKEN');

    if (existingInvestorId && existingToken) {
      this.logger.log('✅ Using existing DNSE credentials from environment');
      this.logger.log(`👤 InvestorId: ${existingInvestorId}`);
      this.logger.log(`🔑 Token: ${existingToken.substring(0, 30)}...`);
      return {
        investorId: existingInvestorId,
        token: existingToken,
      };
    }

    if (!username || !password) {
      this.logger.error('❌ DNSE credentials not found in environment variables');
      this.logger.error('⚠️ Please set DNSE_USERNAME and DNSE_PASSWORD in your .env file');
      this.logger.error('💡 See DNSE_CREDENTIALS_SETUP.md for instructions');
      return null;
    }

    this.logger.log(`👤 Found username: ${username}`);
    this.logger.log('🔐 Found password in environment');
    this.logger.log('📞 Authenticating with DNSE API...');

    return this.authenticate(username, password);
  }

  getStoredCredentials(): { investorId?: string; token?: string } {
    return {
      investorId: this.configService.get<string>('DNSE_INVESTOR_ID'),
      token: this.configService.get<string>('DNSE_TOKEN'),
    };
  }
}