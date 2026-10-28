import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';

/**
 * OTP delivery service — ported from tirgo-v2's SmsService, adapted to
 * hajji-backend conventions (native fetch instead of request-promise/sendpulse-api,
 * credentials from ConfigService/.env instead of a DB `configs` table).
 *
 * SMS is routed by phone prefix to the same providers tirgo uses:
 *   998 (Uzbekistan) → smsxabar.uz    992 (Tajikistan) → osonsms.com
 *   79  (Russia)     → iqsms.ru        other            → SendPulse global
 *
 * Telegram uses the official Telegram Gateway API (gatewayapi.telegram.org).
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  private cfg(key: string, fallback = ''): string {
    return this.configService.get<string>(key) ?? fallback;
  }

  // ── Public entry points ───────────────────────────────────────────────

  /** Sends the OTP over SMS, routing by phone prefix. `phone` = digits only. */
  async sendOtp(phone: string, code: string | number): Promise<boolean> {
    const text = `Tasdiqlash kodi: ${code}`;
    try {
      if (phone.startsWith('998')) return await this.sendSmsLocal(phone, text);
      if (phone.startsWith('992')) return await this.sendSmsOson(phone, text);
      if (phone.startsWith('79')) return await this.sendSmsRu(phone, code);
      return await this.sendSmsGlobal(phone, text);
    } catch (err: any) {
      this.logger.error(`sendOtp failed for ${phone}: ${err?.message}`);
      return false;
    }
  }

  /** Sends the OTP through the Telegram Gateway API. `phone` = digits only. */
  async sendTgVerificationCode(phone: string, code: string): Promise<boolean> {
    const token = this.cfg('TELEGRAM_GATEWAY_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_GATEWAY_TOKEN not configured');
      return false;
    }
    try {
      const res = await fetch('https://gatewayapi.telegram.org/sendVerificationMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: `+${phone}`, code }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!data?.ok) this.logger.warn(`Telegram Gateway error: ${JSON.stringify(data?.error ?? data)}`);
      return !!data?.ok;
    } catch (err: any) {
      this.logger.error(`sendTgVerificationCode failed: ${err?.message}`);
      return false;
    }
  }

  // ── Providers ─────────────────────────────────────────────────────────

  // Uzbekistan (998) — smsxabar.uz broker API
  private async sendSmsLocal(phone: string, text: string): Promise<boolean> {
    const auth = this.cfg('SMS_LOCAL_AUTH'); // "login:password"
    const originator = this.cfg('SMS_LOCAL_ORIGINATOR', '3700');
    if (!auth) {
      this.logger.warn('SMS_LOCAL_AUTH not configured');
      return false;
    }
    const res = await fetch('https://send.smsxabar.uz/broker-api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(auth).toString('base64'),
      },
      body: JSON.stringify({
        messages: [
          {
            recipient: phone,
            'message-id': 'a' + Date.now().toString(),
            sms: { originator, content: { text } },
          },
        ],
      }),
    });
    const body = await res.text();
    return body.includes('Request is received');
  }

  // Tajikistan (992) — osonsms.com
  private async sendSmsOson(phone: string, text: string): Promise<boolean> {
    const login = this.cfg('SMS_OSON_LOGIN');
    const sender = this.cfg('SMS_OSON_SENDER', 'TIRGO');
    const hashKey = this.cfg('SMS_OSON_HASH');
    if (!login || !hashKey) {
      this.logger.warn('SMS_OSON_LOGIN / SMS_OSON_HASH not configured');
      return false;
    }
    const txnId = randomBytes(16).toString('hex');
    const strHash = createHash('sha256')
      .update([txnId, login, sender, phone, hashKey].join(';'))
      .digest('hex');
    const url =
      `https://api.osonsms.com/sendsms_v1.php?login=${login}` +
      `&from=${sender}&phone_number=${phone}&msg=${encodeURIComponent(text)}` +
      `&txn_id=${txnId}&str_hash=${strHash}`;
    const res = await fetch(url);
    const body = await res.text();
    try {
      return JSON.parse(body).status === 'ok';
    } catch {
      return false;
    }
  }

  // Russia (79) — iqsms.ru
  private async sendSmsRu(phone: string, code: string | number): Promise<boolean> {
    const auth = this.cfg('SMS_RU_AUTH'); // "login:password"
    if (!auth) {
      this.logger.warn('SMS_RU_AUTH not configured');
      return false;
    }
    const url =
      `http://api.iqsms.ru/messages/v2/send/?phone=${phone}` +
      `&text=${encodeURIComponent('Confirmation code ' + code)}`;
    const res = await fetch(url, {
      headers: { Authorization: 'Basic ' + Buffer.from(auth).toString('base64') },
    });
    return res.ok;
  }

  // Everything else — SendPulse global SMS (REST OAuth)
  private async sendSmsGlobal(phone: string, text: string): Promise<boolean> {
    const id = this.cfg('SENDPULSE_CLIENT_ID');
    const secret = this.cfg('SENDPULSE_CLIENT_SECRET');
    const sender = this.cfg('SENDPULSE_SENDER', 'TIRGO');
    if (!id || !secret) {
      this.logger.warn('SENDPULSE_CLIENT_ID / SENDPULSE_CLIENT_SECRET not configured');
      return false;
    }
    const tokenRes = await fetch('https://api.sendpulse.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
    });
    const tokenData: any = await tokenRes.json().catch(() => ({}));
    const accessToken = tokenData?.access_token;
    if (!accessToken) return false;

    const sendRes = await fetch('https://api.sendpulse.com/sms/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, phones: [phone], body: text }),
    });
    const sendData: any = await sendRes.json().catch(() => ({}));
    return !!sendData?.result;
  }
}
