import { createHash, timingSafeEqual } from 'node:crypto';
import type { Config } from '../../config.js';
import { badGateway, HttpError } from '../../common/http-error.js';

export interface SnapPayload {
  transaction_details: { order_id: string; gross_amount: number };
  item_details: { id: string; name: string; price: number; quantity: number }[];
  customer_details: { first_name: string; email: string };
}

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
  [key: string]: unknown;
}

export class MidtransClient {
  constructor(private config: Config['midtrans']) {}

  private get serverKey() {
    if (!this.config.serverKey) throw new HttpError(503, 'Payment is not configured: set MIDTRANS_SERVER_KEY');
    return this.config.serverKey;
  }

  async createSnapTransaction(payload: SnapPayload): Promise<{ token: string; redirect_url: string }> {
    const res = await fetch(this.config.snapUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Basic ${Buffer.from(`${this.serverKey}:`).toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };
    if (!res.ok || !body.token || !body.redirect_url) {
      throw badGateway(
        `Midtrans rejected the request (${res.status}): ${body.error_messages?.join(', ') ?? 'no message'}`,
      );
    }
    return { token: body.token, redirect_url: body.redirect_url };
  }

  async getTransactionStatus(orderId: string): Promise<MidtransNotification | null> {
    const res = await fetch(`${this.config.apiUrl}/v2/${encodeURIComponent(orderId)}/status`, {
      headers: {
        accept: 'application/json',
        authorization: `Basic ${Buffer.from(`${this.serverKey}:`).toString('base64')}`,
      },
      signal: AbortSignal.timeout(8000),
    });
    const body = (await res.json().catch(() => null)) as Partial<MidtransNotification> | null;
    if (body?.status_code === '404') return null;
    if (!body || !body.transaction_status || !(body.status_code === '200' || body.status_code === '201')) {
      throw badGateway(`Midtrans failed to return the status of ${orderId} (HTTP ${res.status})`);
    }
    return body as MidtransNotification;
  }

  sign(n: Pick<MidtransNotification, 'order_id' | 'status_code' | 'gross_amount'>) {
    return createHash('sha512')
      .update(`${n.order_id}${n.status_code}${n.gross_amount}${this.serverKey}`)
      .digest('hex');
  }

  verifySignature(n: Pick<MidtransNotification, 'order_id' | 'status_code' | 'gross_amount' | 'signature_key'>) {
    if (!n.order_id || !n.status_code || !n.gross_amount || !n.signature_key) return false;
    const a = Buffer.from(this.sign(n));
    const b = Buffer.from(String(n.signature_key));
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
