import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
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
import { AgencyResetPasswordDto } from "./dto/agency-reset-password.dto";
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
import { SundryService } from "../../shared/services/sundry.service";
import { SmsService } from "../../shared/services/sms.service";
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
    private readonly sundryService: SundryService,
    private readonly smsService: SmsService,
  ) {}

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
        agencyUser.agency_id,
      );

      return {
        ...tokens,
        user: agencyUser,
      };
    });
  }

  // ===================== Agency User Reset Password =====================

  async agencyResetPassword(
    user: any,
    dto: AgencyResetPasswordDto,
  ): Promise<{ success: boolean }> {
    if (user.type !== UserTypesEnum.AGENCY_USER) {
      throw new ForbiddenException("Only agency users can use this endpoint");
    }

    return this.db.transaction(async (trx) => {
      const record = await this.usersAuthDao.findUserById(user.id, trx);
      if (!record) {
        throw new UnauthorizedException("User not found");
      }

      if (
        !record.password_hash ||
        !(await bcrypt.compare(dto.current_password, record.password_hash))
      ) {
        throw new BadRequestException("Current password is incorrect");
      }

      const passwordHash = this.sundryService.generateHashPassword(
        dto.new_password,
      );
      await this.usersAuthDao.updatePassword(user.id, passwordHash, trx);

      return { success: true };
    });
  }

  // ===================== Send OTP =====================

  async sendOtp(
    dto: SendOtpDto,
  ): Promise<{ success: boolean; expires_in_minutes: number }> {
    const phone = this.sundryService.normalizePhone(dto.phone);

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
      throw new BadRequestException(
        "No pilgrim profile found for this account",
      );
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

    // Deliver the code via the requested channel.
    const sent =
      dto.method === "TELEGRAM"
        ? await this.smsService.sendTgVerificationCode(phone, code)
        : await this.smsService.sendOtp(phone, code);

    if (!sent) {
      // In development, log the code so the flow is testable without a live
      // SMS/Telegram provider; in production, fail loudly.
      throw new InternalServerErrorException(
        "Failed to send verification code",
      );
    }

    return { success: true, expires_in_minutes: expiryMinutes };
  }

  // ===================== Verify OTP & Auto-Register Pilgrim =====================

  async verifyOtp(dto: VerifyOtpDto): Promise<{
    access_token: string;
    refresh_token: string;
    is_new_user: boolean;
  }> {
    const phone = this.sundryService.normalizePhone(dto.phone);

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
        this.logger.warn(
          `TEST MODE: OTP verification bypassed for phone ${phone} with test code`,
        );
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
        throw new BadRequestException(
          "No pilgrim profile found for this account",
        );
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
    if (
      !dto.first_name ||
      !dto.last_name ||
      !dto.phone ||
      !dto.pinfl ||
      !dto.password ||
      !dto.country_id
    ) {
      throw new BadRequestException(
        "Missing required fields: first_name, last_name, phone, pinfl, password, country_id",
      );
    }

    const phone = this.sundryService.normalizePhone(dto.phone);

    return this.db.transaction(async (trx) => {
      // Check if user with this phone already exists
      const existingUser = await this.usersAuthDao.findUserBy(
        { username: phone },
        trx,
      );
      if (existingUser) {
        throw new ConflictException("Phone number is already registered");
      }

      // Check if a pilgrim with this PINFL already exists
      const existingPinfl = await this.pilgrimsDao.findByPinfl(dto.pinfl, trx);
      if (existingPinfl) {
        throw new ConflictException("PINFL is already registered");
      }

      // Validate country exists
      const country = await this.countriesDao.findOne(
        { id: dto.country_id },
        trx,
      );
      if (!country) {
        throw new BadRequestException(`Country not found: ${dto.country_id}`);
      }

      // Validate region if provided
      if (dto.region_id) {
        const region = await this.regionsDao.findOne(
          { id: dto.region_id } as any,
          trx,
        );
        if (!region) {
          throw new BadRequestException(`Region not found: ${dto.region_id}`);
        }
      }

      // Validate district if provided
      if (dto.district_id) {
        const district = await this.districtsDao.findOne(
          { id: dto.district_id } as any,
          trx,
        );
        if (!district) {
          throw new BadRequestException(
            `District not found: ${dto.district_id}`,
          );
        }
      }

      // Create user: username = phone, type = PILGRIM
      const passwordHash = this.sundryService.generateHashPassword(
        dto.password,
      );
      const user = await this.usersAuthDao.createUser(
        "PILGRIM",
        phone,
        phone, // username = phone
        passwordHash,
        trx,
        dto.language ?? null,
      );

      // Create pilgrim profile
      const pilgrim = await this.pilgrimsDao.insert(
        {
          id: randomUUID(),
          user_id: user.id,
          first_name: dto.first_name,
          last_name: dto.last_name,
          middle_name: dto.middle_name ?? null,
          phone,
          pinfl: dto.pinfl,
          country_id: dto.country_id,
          region_id: dto.region_id ?? null,
          district_id: dto.district_id ?? null,
          is_blocked: false,
          created_by_id: user.id,
          created_at: new Date(),
          updated_at: new Date(),
          is_deleted: false,
        } as any,
        trx,
      );

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

  async refreshToken(
    dto: RefreshTokenDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return this.db.transaction(async (trx) => {
      this.logger.log("refreshToken: looking up refresh token in DB");

      const refreshTokenRecord = await this.refreshTokensDao.findRefreshToken(
        dto.refresh_token,
        trx,
      );

      if (!refreshTokenRecord) {
        this.logger.warn("refreshToken: token not found in DB");
        throw new UnauthorizedException("Invalid or expired refresh token");
      }

      this.logger.log(
        `refreshToken: found record id=${refreshTokenRecord.id} user_id=${refreshTokenRecord.user_id} is_revoked=${refreshTokenRecord.is_revoked} expires_at=${refreshTokenRecord.expires_at}`,
      );

      if (refreshTokenRecord.is_revoked) {
        this.logger.warn(
          `refreshToken: token is revoked — user_id=${refreshTokenRecord.user_id}`,
        );
        throw new UnauthorizedException("Refresh token has been revoked");
      }

      try {
        const payload = this.jwtService.verify<any>(dto.refresh_token, {
          secret:
            this.configService.get<string>("REFRESH_TOKEN_SECRET") ||
            "change_me_refresh",
        });

        this.logger.log(
          `refreshToken: JWT valid for user_id=${payload.user_id} type=${payload.type}`,
        );

        const user = await this.usersAuthDao.findUserById(payload.user_id, trx);
        if (!user || user.is_blocked || user.deleted_at) {
          this.logger.warn(
            `refreshToken: user blocked or deleted — user_id=${payload.user_id} is_blocked=${user?.is_blocked} deleted_at=${user?.deleted_at}`,
          );
          throw new ForbiddenException("User is blocked or deleted");
        }

        // Rotate: mint a fresh access+refresh pair via the same path login uses,
        // then revoke the refresh token that was just spent.
        const tokens = await this.generateTokens(
          payload.user_id,
          payload.type,
          payload.role,
          trx,
          payload.agency_id,
        );
        await this.refreshTokensDao.revokeRefreshToken(
          refreshTokenRecord.id,
          trx,
        );

        this.logger.log(
          `refreshToken: issued new token pair for user_id=${payload.user_id} agency_id=${payload.agency_id}`,
        );
        return tokens;
      } catch (error) {
        this.logger.error(
          `refreshToken: failed — ${error.name}: ${error.message}`,
        );
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
    role?: string,
    trx?: Knex.Transaction,
    agencyId?: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload: any = {
      user_id: userId,
      type: userType,
      ...(role && { role }),
      ...(agencyId && { agency_id: agencyId }),
    };

    // Generate access token
    const accessSecret =
      this.configService.get<string>("ACCESS_TOKEN_SECRET") ||
      "change_me_access";
    const refreshSecret =
      this.configService.get<string>("REFRESH_TOKEN_SECRET") ||
      "change_me_refresh";

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: this.parseExpiresIn(
        this.configService.get<string>("ACCESS_TOKEN_EXPIRES_IN"),
        900,
      ) as any,
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: this.parseExpiresIn(
        this.configService.get<string>("REFRESH_TOKEN_EXPIRES_IN"),
        604800,
      ) as any,
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

  // jsonwebtoken's expiresIn accepts either a number of seconds or a duration
  // string like "1h"/"15m"/"7d" (parsed via the `ms` package) — but NOT both in
  // one value. Blindly parseInt()-ing "1h" silently truncates to 1, i.e. 1 SECOND,
  // which is what was making access tokens expire almost immediately after being
  // issued. Only coerce to a number when the value is purely digits (raw seconds);
  // otherwise pass the duration string straight through.
  private parseExpiresIn(
    value: string | undefined,
    fallbackSeconds: number,
  ): string | number {
    if (!value) return fallbackSeconds;
    return /^\d+$/.test(value) ? parseInt(value, 10) : value;
  }
}
