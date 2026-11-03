import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, createHmac, createPublicKey, randomBytes, randomUUID, verify as cryptoVerify } from 'crypto';

/**
 * "Log In With Telegram" (OpenID Connect, Authorization Code + PKCE).
 * Docs: https://core.telegram.org/bots/telegram-login
 *
 * Browser flow for the Capacitor app:
 *   app ──(system browser)──▶ GET /auth/telegram/start?app_challenge=…
 *       ──302──▶ oauth.telegram.org/auth ──user approves──▶
 *       GET /auth/telegram/callback?code&state  (code ↔ id_token, verified)
 *       ──deep link──▶ <app scheme>://auth/telegram?ticket=…
 *   app ── POST /auth/telegram/exchange { ticket, app_verifier } ──▶ tokens
 *
 * `state` is a short random id kept in memory (Telegram caps its length);
 * `ticket` is a short-lived signed JWT. The Telegram PKCE verifier is derived
 * server-side (HMAC of the state id) so it never travels through the browser. The app binds the
 * ticket with its own PKCE-style pair (app_challenge / app_verifier), so a
 * ticket intercepted from the deep link is useless to another app.
 */

const ISSUER = 'https://oauth.telegram.org';
const AUTH_URL = `${ISSUER}/auth`;
const TOKEN_URL = `${ISSUER}/token`;
const JWKS_URL = `${ISSUER}/.well-known/jwks.json`;

const STATE_TTL_MS = 10 * 60 * 1000;
const TICKET_TTL = '3m';

export interface TelegramIdentity {
  phone: string; // digits only
  telegram_id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

const b64url = (buf: Buffer) => buf.toString('base64url');

@Injectable()
export class TelegramLoginService {
  private readonly logger = new Logger(TelegramLoginService.name);
  private jwksCache: { keys: any[]; at: number } | null = null;
  /** One-time ticket guard (ticket jti → expiry ms). */
  private readonly usedTickets = new Map<string, number>();
  /** Pending authorizations (state id → app_challenge, expiry ms). */
  private readonly pendingStates = new Map<string, { ac: string; exp: number }>();

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private cfg(key: string): string {
    const v = this.configService.get<string>(key);
    if (!v) throw new BadRequestException(`Telegram login is not configured (${key})`);
    return v;
  }

  private get secret(): string {
    // Dedicated secret preferred; falls back to the access-token secret.
    return (
      this.configService.get<string>('TELEGRAM_LOGIN_STATE_SECRET') ||
      this.cfg('ACCESS_TOKEN_SECRET')
    );
  }

  get appRedirect(): string {
    return this.configService.get<string>('TELEGRAM_LOGIN_APP_REDIRECT') || 'uz.hajji.guide://auth/telegram';
  }

  private pkceVerifier(nonce: string): string {
    return b64url(createHmac('sha256', this.secret).update(`tg-pkce:${nonce}`).digest());
  }

  // ── 1. Start: build the Telegram authorization URL ─────────────────────
  buildAuthUrl(appChallenge: string): string {
    if (!/^[A-Za-z0-9_-]{43}$/.test(appChallenge ?? '')) {
      throw new BadRequestException('Invalid app_challenge');
    }
    const clientId = this.cfg('TELEGRAM_LOGIN_CLIENT_ID');
    const redirectUri = this.cfg('TELEGRAM_LOGIN_REDIRECT_URI');

    // Telegram rejects long `state` values ("state too long"), so the state is a
    // short random id and its data stays in memory until the callback.
    const now = Date.now();
    for (const [k, v] of this.pendingStates) if (v.exp < now) this.pendingStates.delete(k);
    const state = b64url(randomBytes(16)); // 22 chars
    this.pendingStates.set(state, { ac: appChallenge, exp: now + STATE_TTL_MS });
    const codeChallenge = b64url(createHash('sha256').update(this.pkceVerifier(state)).digest());

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile phone',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  // ── 2. Callback: exchange code → verified identity → app ticket ────────
  async handleCallback(code: string, state: string): Promise<string> {
    const pending = this.pendingStates.get(state);
    this.pendingStates.delete(state); // one-time
    if (!pending || pending.exp < Date.now()) {
      throw new UnauthorizedException('Login session expired, please try again');
    }
    const st = { n: state, ac: pending.ac };

    const clientId = this.cfg('TELEGRAM_LOGIN_CLIENT_ID');
    const clientSecret = this.cfg('TELEGRAM_LOGIN_CLIENT_SECRET');
    const redirectUri = this.cfg('TELEGRAM_LOGIN_REDIRECT_URI');

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: this.pkceVerifier(st.n),
      }).toString(),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id_token) {
      this.logger.warn(`Telegram token exchange failed (${res.status}): ${JSON.stringify(data)}`);
      throw new UnauthorizedException('Telegram login failed');
    }

    const claims = await this.verifyIdToken(data.id_token, clientId);
    const phone = String(claims.phone_number ?? '').replace(/\D/g, '');
    if (!phone) throw new BadRequestException('PHONE_REQUIRED');

    const identity: TelegramIdentity = {
      phone,
      telegram_id: String(claims.id ?? claims.sub),
      first_name: claims.given_name ?? claims.name?.split(' ')[0],
      last_name: claims.family_name ?? claims.name?.split(' ').slice(1).join(' ') ?? undefined,
      username: claims.preferred_username,
    };

    return this.jwtService.sign(
      { typ: 'tg_ticket', ac: st.ac, idn: identity },
      { secret: this.secret, expiresIn: TICKET_TTL, jwtid: randomUUID() },
    );
  }

  // ── 3. Exchange: app proves possession of app_verifier ─────────────────
  redeemTicket(ticket: string, appVerifier: string): TelegramIdentity {
    let t: any;
    try {
      t = this.jwtService.verify(ticket, { secret: this.secret });
    } catch {
      throw new UnauthorizedException('Login ticket expired, please try again');
    }
    if (t?.typ !== 'tg_ticket' || !t.jti) throw new UnauthorizedException('Invalid ticket');

    const challenge = b64url(createHash('sha256').update(appVerifier ?? '').digest());
    if (challenge !== t.ac) throw new UnauthorizedException('Invalid ticket');

    const now = Date.now();
    for (const [k, exp] of this.usedTickets) if (exp < now) this.usedTickets.delete(k);
    if (this.usedTickets.has(t.jti)) throw new UnauthorizedException('Ticket already used');
    this.usedTickets.set(t.jti, t.exp * 1000);

    return t.idn as TelegramIdentity;
  }

  // ── id_token verification (JWKS, no extra deps) ────────────────────────
  private async getJwks(force = false): Promise<any[]> {
    if (!force && this.jwksCache && Date.now() - this.jwksCache.at < 6 * 3600_000) {
      return this.jwksCache.keys;
    }
    const res = await fetch(JWKS_URL);
    const body: any = await res.json();
    this.jwksCache = { keys: body?.keys ?? [], at: Date.now() };
    return this.jwksCache.keys;
  }

  private async verifyIdToken(idToken: string, clientId: string): Promise<any> {
    const [h, p, s] = idToken.split('.');
    if (!h || !p || !s) throw new UnauthorizedException('Malformed id_token');
    const header = JSON.parse(Buffer.from(h, 'base64url').toString());
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString());

    let jwk = (await this.getJwks()).find((k) => k.kid === header.kid);
    if (!jwk) jwk = (await this.getJwks(true)).find((k) => k.kid === header.kid);
    if (!jwk) throw new UnauthorizedException('Unknown id_token key');

    const key = createPublicKey({ key: jwk, format: 'jwk' });
    const data = Buffer.from(`${h}.${p}`);
    const sig = Buffer.from(s, 'base64url');
    let ok = false;
    switch (header.alg) {
      case 'RS256':
        ok = cryptoVerify('RSA-SHA256', data, key, sig);
        break;
      case 'ES256':
        ok = cryptoVerify('SHA256', data, { key, dsaEncoding: 'ieee-p1363' }, sig);
        break;
      default:
        throw new UnauthorizedException(`Unsupported id_token alg ${header.alg}`);
    }
    if (!ok) throw new UnauthorizedException('Invalid id_token signature');

    const aud = Array.isArray(payload.aud) ? payload.aud.map(String) : [String(payload.aud)];
    if (payload.iss !== ISSUER) throw new UnauthorizedException('Invalid id_token issuer');
    if (!aud.includes(String(clientId))) throw new UnauthorizedException('Invalid id_token audience');
    if (!payload.exp || payload.exp * 1000 < Date.now() - 60_000) {
      throw new UnauthorizedException('id_token expired');
    }
    return payload;
  }
}
