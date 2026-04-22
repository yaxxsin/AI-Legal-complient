import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// Use require since midtrans-client doesn't have consistent esModule typing
const midtransClient = require('midtrans-client');

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private snap: any;
  private isProduction: boolean;
  private serverKey: string;
  private clientKey: string;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    this.serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY') || 'SB-Mid-server-DUMMY';
    this.clientKey = this.configService.get<string>('MIDTRANS_CLIENT_KEY') || 'SB-Mid-client-DUMMY';

    // Validate keys on startup
    if (this.serverKey === 'SB-Mid-server-DUMMY' || this.clientKey === 'SB-Mid-client-DUMMY') {
      this.logger.warn('⚠️  Midtrans keys not configured! Using dummy keys. Payment will not work.');
    } else {
      this.logger.log(`✅ Midtrans initialized (${this.isProduction ? 'PRODUCTION' : 'SANDBOX'} mode)`);
    }

    this.snap = new midtransClient.Snap({
      isProduction: this.isProduction,
      serverKey: this.serverKey,
      clientKey: this.clientKey,
    });
  }

  /**
   * Create Snap Token for an order
   */
  async createSnapToken(payload: {
    orderId: string;
    grossAmount: number;
    customerDetails: {
      firstName: string;
      email: string;
      phone?: string;
    };
    itemDetails: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
    }>;
  }) {
    try {
      const parameter = {
        transaction_details: {
          order_id: payload.orderId,
          gross_amount: payload.grossAmount,
        },
        item_details: payload.itemDetails,
        customer_details: {
          first_name: payload.customerDetails.firstName,
          email: payload.customerDetails.email,
          phone: payload.customerDetails.phone,
        },
        credit_card: {
          secure: true,
        },
      };

      const transaction = await this.snap.createTransaction(parameter);
      return transaction;
    } catch (err) {
      this.logger.error('Failed to create Midtrans Snap Token', err);
      throw new Error('Midtrans Error: Failed to create transaction');
    }
  }

  /**
   * Verify Midtrans Signature Key
   * signature_key = SHA512(order_id + status_code + gross_amount + server_key)
   */
  verifySignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string,
  ): boolean {
    const rawString = `${orderId}${statusCode}${grossAmount}${this.serverKey}`;
    const hashed = crypto.createHash('sha512').update(rawString).digest('hex');
    
    return hashed === signatureKey;
  }
}
