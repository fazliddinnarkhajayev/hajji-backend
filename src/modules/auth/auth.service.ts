import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Knex } from "knex";
import * as bcrypt from "bcrypt";
import { randomInt } from "crypto";
import { SendOtpDto } from "./dto/send-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { LogoutDto } from "./dto/logout.dto";
import { UsersAuthDao, UserRecord } from "../../shared/dao/users-auth.dao";
import { AdminsDao } from "../../shared/dao/admins.dao";
import { OtpSessionsDao } from "../../shared/dao/otp-sessions.dao";
import { RefreshTokensDao } from "../../shared/dao/refresh-tokens.dao";
import { PilgrimsDao } from "src/shared/dao/piligrims.dao";
import { AgencyUsersDao } from "../../modules/admins/modules/agencies/modules/agency-users/agency-users.dao";
import { KNEX_CONNECTION } from "src/core/database/database.constants";
import { UsersService } from "../users/users.service";
import { UserTypesEnum } from "src/shared/enums/user-types.enum";
import { CountriesDao } from "../references/modules/countries/countries.dao";
import { RegionsDao } from "../references/modules/regions/regions.dao";
import { DistrictsDao } from "../references/modules/districts/districts.dao";
import { randomUUID } from "crypto";

export interface JwtPayload {
  user_id: string;
  type: "ADMIN" | "PILGRIM" | "AGENCY_USER";
  role?: "STAFF" | "SUPER_ADMIN";
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(KNEX_CONNECTION) private readonly db: Knex,
    private readonly usersAuthDao: UsersAuthDao,
    private readonly adminsDao: AdminsDao,
    private readonly agencyUsersDao: AgencyUsersDao,
    private readonly usersService: UsersService,
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly otpSessionsDao: OtpSessionsDao,
    private readonly refreshTokensDao: RefreshTokensDao,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly countriesDao: CountriesDao,
    private readonly regionsDao: RegionsDao,
    private readonly districtsDao: DistrictsDao,
  ) { }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  // ===================== Admin Login =====================

  async adminLogin(
    dto: LoginDto,
  ): Promise<{ access_token: string; refresh_token: string; user: any }> {
    return this.db.transaction(async (trx) => {
      const user = await this.usersService.findOneBy(
        { username: dto.username, type: UserTypesEnum.ADMIN },
        trx,
      );
      if (!user) {
        throw new UnauthorizedException("Invalid credentials");
      }

      // Find admin by username
      const admin: any = await this.adminsDao.findOne(
        { user_id: user.id, is_deleted: false },
        trx,
      );
      if (!admin) {
        throw new UnauthorizedException("Invalid credentials");
      }

      // Check if user is blocked
      if (admin.is_blocked) {
        throw new ForbiddenException("User account is blocked");
      }

      // Verify password
      if (
        !user.password_hash ||
        !(await bcrypt.compare(dto.password, user.password_hash))
      ) {
        throw new UnauthorizedException("Invalid credentials");
      }

      // Update last login
      await this.usersAuthDao.updateLoginAt(user.id, trx);

      // Generate tokens
      const tokens = await this.generateTokens(
        user.id,
        UserTypesEnum.ADMIN,
        admin.role,
        trx,
      );

      return {
        ...tokens,
        user: admin,
      };
    });
  }

  // ===================== Agency User Login =====================

  async agencyLogin(
    dto: LoginDto,
  ): Promise<{ access_token: string; refresh_token: string; user: any }> {
    return this.db.transaction(async (trx) => {
      const user = await this.usersService.findOneBy(
        { username: dto.username, type: UserTypesEnum.AGENCY_USER },
        trx,
      );
      if (!user) {
        throw new UnauthorizedException("Invalid credentials");
      }

      // Find agency user by user_id
      const agencyUser: any = await this.agencyUsersDao.findOne(
        { user_id: user.id, is_deleted: false },
        trx,
      );
      if (!agencyUser) {
        throw new UnauthorizedException("Invalid credentials");
      }

      // Check if user is blocked
      if (agencyUser.status === "BLOCKED") {
        throw new ForbiddenException("User account is blocked");
      }

      // Verify password
      if (
        !user.password_hash ||
        !(await bcrypt.compare(dto.password, user.password_hash))
      ) {
        throw new UnauthorizedException("Invalid credentials");
      }

      // Update last login
      await this.usersAuthDao.updateLoginAt(user.id, trx);

      // Generate tokens
      const tokens = await this.generateTokens(
        user.id,
        UserTypesEnum.AGENCY_USER,
        agencyUser.role,
        trx,
      );

      return {
        ...tokens,
        user: agencyUser,
      };
    });
  }

  // ===================== Send OTP =====================

  async sendOtp(
    dto: SendOtpDto,
  ): Promise<{ success: boolean; expires_in_minutes: number }> {
    const phone = this.normalizePhone(dto.phone);

    // Validate user exists, is a PILGRIM, and has a pilgrim profile
    const user = await this.usersAuthDao.findUserBy({ username: phone });
    if (!user) {
      throw new BadRequestException("No account found for this phone number");
    }
    if (user.type !== UserTypesEnum.PILGRIM) {
      throw new ForbiddenException("Account is not a pilgrim account");
    }
    if (user.is_blocked) {
      throw new ForbiddenException("User account is blocked");
    }
    if (user.deleted_at) {
      throw new ForbiddenException("User account has been deleted");
    }
    const pilgrim = await this.pilgrimsDao.findByUserId(user.id);
    if (!pilgrim) {
      throw new BadRequestException("No pilgrim profile found for this account");
    }

    // Generate OTP code (6 digits)
    const code = String(randomInt(100000, 999999));

    // Get OTP expiry from config
    const expiryMinutes = Number(
      this.configService.get<string>("OTP_EXPIRY_MINUTES") ?? "10",
    );
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Save OTP session
    await this.otpSessionsDao.createOtpSession(
      phone,
      code,
      dto.method,
      expiresAt,
    );

    // TODO: Send OTP via SMS or Telegram (mock for now)
    console.log(`OTP sent to ${phone}: ${code} via ${dto.method}`);

    return { success: true, expires_in_minutes: expiryMinutes };
  }

  // ===================== Verify OTP & Auto-Register Pilgrim =====================

  async verifyOtp(dto: VerifyOtpDto): Promise<{
    access_token: string;
    refresh_token: string;
    is_new_user: boolean;
  }> {
    const phone = this.normalizePhone(dto.phone);

    return this.db.transaction(async (trx) => {
      // TEST BYPASS: Allow test code "123456" to skip OTP verification
      const isTestCode = dto.code === "123456";

      if (!isTestCode) {
        // Find latest OTP session
        const otpSession = await this.otpSessionsDao.findLatestOtpSession(
          phone,
          trx,
        );
        if (!otpSession) {
          throw new BadRequestException("OTP not found or expired");
        }

        // Verify code matches
        if (otpSession.code !== dto.code) {
          await this.otpSessionsDao.incrementOtpAttempts(otpSession.id, trx);
          throw new BadRequestException("Invalid OTP code");
        }

        // Check if OTP is already used
        if (otpSession.is_used) {
          throw new BadRequestException("OTP has already been used");
        }

        // Check if OTP is expired
        if (new Date() > otpSession.expires_at) {
          throw new BadRequestException("OTP has expired");
        }

        // Mark OTP as used
        await this.otpSessionsDao.verifyOtpSession(otpSession.id, trx);
      } else {
        // Test mode: log that test code was used
        this.logger.warn(`TEST MODE: OTP verification bypassed for phone ${phone} with test code`);
      }

      // Find user by phone (username)
      const user = await this.usersAuthDao.findUserBy({ username: phone }, trx);

      if (!user) {
        throw new BadRequestException("No account found for this phone number");
      }

      // Ensure user is a PILGRIM
      if (user.type !== UserTypesEnum.PILGRIM) {
        throw new ForbiddenException("Account is not a pilgrim account");
      }

      // Check if user is blocked
      if (user.is_blocked) {
        throw new ForbiddenException("User account is blocked");
      }

      // Check if user is deleted
      if (user.deleted_at) {
        throw new ForbiddenException("User account has been deleted");
      }

      // Ensure pilgrim profile exists
      const pilgrim = await this.pilgrimsDao.findByUserId(user.id, trx);
      if (!pilgrim) {
        throw new BadRequestException("No pilgrim profile found for this account");
      }

      // Update last login
      await this.usersAuthDao.updateLoginAt(user.id, trx);

      // Generate tokens
      const tokens = await this.generateTokens(
        user.id,
        "PILGRIM",
        undefined,
        trx,
      );

      return {
        ...tokens,
        is_new_user: false,
      };
    });
  }

  // ===================== Register Pilgrim (Manual or Google) =====================

  async registerPilgrim(
    dto: RegisterDto,
  ): Promise<{ access_token: string; refresh_token: string; user: any }> {
    if (dto.type === "MANUAL") {
      return this.registerPilgrimManual(dto);
    } else if (dto.type === "GOOGLE") {
      return this.registerPilgrimGoogle(dto);
    }

    throw new BadRequestException("Invalid registration type");
  }

  private async registerPilgrimManual(
    dto: RegisterDto,
  ): Promise<{ access_token: string; refresh_token: string; user: any }> {
    if (!dto.first_name || !dto.last_name || !dto.phone || !dto.country_id) {
      throw new BadRequestException(
        "Missing required fields: first_name, last_name, phone, country_id",
      );
    }

    const phone = this.normalizePhone(dto.phone);

    return this.db.transaction(async (trx) => {
      // Check if user with this phone already exists
      const existingUser = await this.usersAuthDao.findUserBy({ username: phone }, trx);
      if (existingUser) {
        throw new ConflictException("Phone number is already registered");
      }

      // Validate country exists
      const country = await this.countriesDao.findOne({ id: dto.country_id }, trx);
      if (!country) {
        throw new BadRequestException(`Country not found: ${dto.country_id}`);
      }

      // Validate region if provided
      if (dto.region_id) {
        const region = await this.regionsDao.findOne({ id: dto.region_id } as any, trx);
        if (!region) {
          throw new BadRequestException(`Region not found: ${dto.region_id}`);
        }
      }

      // Validate district if provided
      if (dto.district_id) {
        const district = await this.districtsDao.findOne({ id: dto.district_id } as any, trx);
        if (!district) {
          throw new BadRequestException(`District not found: ${dto.district_id}`);
        }
      }

      // Create user: username = phone, type = PILGRIM
      const user = await this.usersAuthDao.createUser(
        "PILGRIM",
        phone,
        phone, // username = phone
        null,
        trx,
      );

      // Create pilgrim profile
      const pilgrim = await this.pilgrimsDao.insert({
        id: randomUUID(),
        user_id: user.id,
        first_name: dto.first_name,
        last_name: dto.last_name,
        full_name: `${dto.first_name} ${dto.last_name}`.trim(),
        middle_name: dto.middle_name ?? null,
        phone,
        country_id: dto.country_id,
        region_id: dto.region_id ?? null,
        district_id: dto.district_id ?? null,
        language: dto.language ?? null,
        status: 'ACTIVE',
        is_blocked: false,
        created_by_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: false,
      } as any, trx);

      // Update last login
      await this.usersAuthDao.updateLoginAt(user.id, trx);

      // Generate tokens
      const tokens = await this.generateTokens(
        user.id,
        "PILGRIM",
        undefined,
        trx,
      );

      return {
        ...tokens,
        user: pilgrim,
      };
    });
  }

  private async registerPilgrimGoogle(
    dto: RegisterDto,
  ): Promise<{ access_token: string; refresh_token: string; user: any }> {
    if (!dto.google_token) {
      throw new BadRequestException("Missing google_token");
    }

    // TODO: Verify Google token with Google API
    // For now, we'll do a mock verification
    const googleUserInfo = this.mockVerifyGoogleToken(dto.google_token);

    return this.db.transaction(async (trx) => {
      // Check if email already exists
      const existingUser = await this.usersAuthDao.findUserByEmail(
        googleUserInfo.email,
        trx,
      );
      if (existingUser) {
        throw new ConflictException("Email is already registered");
      }

      // Create user with email
      const user = await this.usersAuthDao.createUser(
        "PILGRIM",
        null,
        googleUserInfo.email,
        null,
        trx,
      );

      // Create pilgrim profile with Google name
      const defaultCountryId =
        this.configService.get<string>("DEFAULT_COUNTRY_ID") ||
        "00000000-0000-0000-0000-000000000000";
      // await this.pilgrimsDao.createPilgrim(user.id, defaultCountryId, googleUserInfo.name, trx);

      // Update last login
      await this.usersAuthDao.updateLoginAt(user.id, trx);

      // Get pilgrim data
      // const pilgrim = await this.pilgrimsDao.findPilgrimByUserId(user.id, trx);
      // if (!pilgrim) {
      //   throw new BadRequestException('Failed to retrieve pilgrim profile');
      // }

      // Generate tokens
      const tokens = await this.generateTokens(
        user.id,
        "PILGRIM",
        undefined,
        trx,
      );

      return {
        ...tokens,
        user: null,
      };
    });
  }

  private mockVerifyGoogleToken(token: string): {
    email: string;
    name: string;
  } {
    // Mock implementation - in production, verify with:
    // https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={token}
    // or decode JWT and verify signature
    return {
      email: `user-${Date.now()}@gmail.com`,
      name: "Google User",
    };
  }

  // ===================== Refresh Token =====================

  async refreshToken(dto: RefreshTokenDto): Promise<{ access_token: string }> {
    return this.db.transaction(async (trx) => {
      // Find refresh token in database
      const refreshTokenRecord = await this.refreshTokensDao.findRefreshToken(
        dto.refresh_token,
        trx,
      );
      console.log("refreshTokenRecord", refreshTokenRecord);
      if (!refreshTokenRecord) {
        throw new UnauthorizedException("Invalid or expired refresh token");
      }

      // Check if token is revoked
      if (refreshTokenRecord.is_revoked) {
        throw new UnauthorizedException("Refresh token has been revoked");
      }

      // Verify token signature
      try {
        const payload = this.jwtService.verify<any>(dto.refresh_token, {
          secret:
            this.configService.get<string>("REFRESH_TOKEN_SECRET") ??
            "change_me_refresh",
        });

        // Verify user exists and is not blocked/deleted
        const user = await this.usersAuthDao.findUserById(payload.user_id, trx);
        if (!user || user.is_blocked || user.deleted_at) {
          throw new ForbiddenException("User is blocked or deleted");
        }

        // Generate new access token only
        const accessToken = this.jwtService.sign(
          {
            user_id: payload.user_id,
            type: payload.type,
            ...(payload.role && { role: payload.role }),
          } as any,
          {
            secret:
              this.configService.get<string>("ACCESS_TOKEN_SECRET") ??
              "change_me_access",
            expiresIn:
              this.configService.get<number>("ACCESS_TOKEN_EXPIRES_IN") ?? 900, // 15m in seconds
          },
        );

        return { access_token: accessToken };
      } catch (error) {
        console.log("Error", error);
        throw new UnauthorizedException("Invalid refresh token");
      }
    });
  }

  // ===================== Logout =====================

  async logout(dto: LogoutDto): Promise<{ success: boolean }> {
    return this.db.transaction(async (trx) => {
      // Find refresh token in database
      const refreshTokenRecord = await this.refreshTokensDao.findRefreshToken(
        dto.refresh_token,
        trx,
      );
      if (!refreshTokenRecord) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Revoke refresh token
      await this.refreshTokensDao.revokeRefreshToken(
        refreshTokenRecord.id,
        trx,
      );

      return { success: true };
    });
  }

  // ===================== Token Generation =====================

  private async generateTokens(
    userId: string,
    userType: "ADMIN" | "PILGRIM" | "AGENCY_USER",
    role?: "STAFF" | "SUPER_ADMIN",
    trx?: Knex.Transaction,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload: any = {
      user_id: userId,
      type: userType,
      ...(role && { role }),
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>("ACCESS_TOKEN_SECRET") ??
        "change_me_access",
      expiresIn:
        this.configService.get<number>("ACCESS_TOKEN_EXPIRES_IN") ?? 900, // 15m in seconds
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>("REFRESH_TOKEN_SECRET") ??
        "change_me_refresh",
      expiresIn:
        this.configService.get<number>("REFRESH_TOKEN_EXPIRES_IN") ?? 604800, // 7d in seconds
    });

    // Store refresh token in database
    const refreshTokenExpiresInDays = Number(
      this.configService.get<string>("REFRESH_TOKEN_EXPIRES_IN_DAYS") ?? "7",
    );
    const expiresAt = new Date(
      Date.now() + refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
    );
    await this.refreshTokensDao.createRefreshToken(
      userId,
      refreshToken,
      expiresAt,
      trx,
    );

    return { access_token: accessToken, refresh_token: refreshToken };
  }
}
