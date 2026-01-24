import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  RefreshTokenDto,
  RefreshResponseDto,
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from './dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type?: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  private readonly accessTokenExpiresIn: number; // seconds
  private readonly refreshTokenExpiresIn: number; // seconds
  private readonly passwordResetExpiresIn: number = 60 * 60 * 1000; // 1 hour in ms

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Parse expiration times (default: 15min access, 7 days refresh)
    this.accessTokenExpiresIn = this.parseExpirationToSeconds(
      this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
    );
    this.refreshTokenExpiresIn = this.parseExpirationToSeconds(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    );
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role,
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = this.generateRefreshToken(user.id, user.email, user.role);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Determine token expiration based on rememberMe
    const rememberMe = loginDto.rememberMe ?? false;

    // If rememberMe, use longer expiration (7 days for access, 30 days for refresh)
    // Otherwise use shorter expiration (15 min for access, 7 days for refresh)
    const accessExpiresIn = rememberMe
      ? this.parseExpirationToSeconds('7d')
      : this.accessTokenExpiresIn;
    const refreshExpiresIn = rememberMe
      ? this.parseExpirationToSeconds('30d')
      : this.refreshTokenExpiresIn;

    // Generate tokens with appropriate expiration
    const accessToken = this.generateAccessToken(user.id, user.email, user.role, accessExpiresIn);
    const refreshToken = this.generateRefreshToken(
      user.id,
      user.email,
      user.role,
      refreshExpiresIn,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshResponseDto> {
    try {
      // Verify the refresh token
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        this.configService.get<string>('JWT_SECRET') ||
        'default-secret-key';

      const payload = this.jwtService.verify<JwtPayload>(refreshTokenDto.refreshToken, {
        secret: refreshSecret,
      });

      // Ensure it's a refresh token
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Verify user still exists
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user.id, user.email, user.role);

      return {
        accessToken,
        expiresIn: this.accessTokenExpiresIn,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success message to prevent email enumeration attacks
    const successMessage =
      'If an account with that email exists, a password reset link has been sent.';

    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return { message: successMessage };
    }

    // Invalidate any existing reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store the hashed token in database
    await this.prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + this.passwordResetExpiresIn),
      },
    });

    // In production, send email with reset link
    // For now, we'll return the token in development mode
    const isDevelopment = this.configService.get<string>('NODE_ENV') !== 'production';

    if (isDevelopment) {
      return {
        message: successMessage,
        resetToken, // Only include in development for testing
      };
    }

    // TODO: Implement email sending
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: successMessage };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    const { token, newPassword } = resetPasswordDto;

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the reset token
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Check if token has already been used
    if (resetToken.used) {
      throw new BadRequestException('Reset token has already been used');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return { message: 'Password has been reset successfully' };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private generateAccessToken(
    userId: string,
    email: string,
    role: string,
    expiresIn: number = this.accessTokenExpiresIn,
  ): string {
    const payload: JwtPayload = { sub: userId, email, role, type: 'access' };
    return this.jwtService.sign(payload, {
      expiresIn,
    });
  }

  private generateRefreshToken(
    userId: string,
    email: string,
    role: string,
    expiresIn: number = this.refreshTokenExpiresIn,
  ): string {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'default-secret-key';

    const payload: JwtPayload = { sub: userId, email, role, type: 'refresh' };
    return this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn,
    });
  }

  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return 900; // Default: 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900;
    }
  }
}
