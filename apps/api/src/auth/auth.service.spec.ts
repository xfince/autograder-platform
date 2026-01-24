import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { createMockPrismaService } from '../../test/mocks/prisma.mock';
import {
  createMockUser,
  createMockStudent,
  createRegisterDto,
  createLoginDto,
} from '../../test/factories/test-data.factory';
import * as bcrypt from 'bcryptjs';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let _jwtService: JwtService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    _jwtService = module.get<JwtService>(JwtService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = createRegisterDto();
    const hashedPassword = '$2a$10$hashedpassword';

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
    });

    it('should successfully register a new user', async () => {
      const createdUser = createMockStudent({
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          passwordHash: hashedPassword,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          role: registerDto.role,
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw UnauthorizedException if user already exists', async () => {
      const existingUser = createMockUser({ email: registerDto.email });
      prismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.register(registerDto)).rejects.toThrow(
        'User with this email already exists',
      );

      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should hash the password before storing', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(createMockStudent({ email: registerDto.email }));

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordHash: hashedPassword,
          }),
        }),
      );
    });

    it('should generate a JWT token upon successful registration', async () => {
      const createdUser = createMockStudent();
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      // Check that sign was called for both access and refresh tokens
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: createdUser.id,
          email: createdUser.email,
          role: createdUser.role,
          type: 'access',
        }),
        expect.any(Object),
      );
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.refreshToken).toBe('mock.jwt.token');
      expect(result.expiresIn).toBe(900); // 15 minutes in seconds
    });
  });

  describe('login', () => {
    const loginDto = createLoginDto();
    const mockUser = createMockUser({
      email: loginDto.email,
      passwordHash: '$2a$10$hashedpassword',
    });

    it('should successfully login with valid credentials', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.passwordHash);
      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
      expect(result).toHaveProperty('refreshToken', 'mock.jwt.token');
      expect(result).toHaveProperty('expiresIn', 900);
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should use longer token expiration when rememberMe is true', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const rememberMeDto = { ...loginDto, rememberMe: true };
      const result = await service.login(rememberMeDto);

      // With rememberMe=true, access token should expire in 7 days (604800 seconds)
      expect(result).toHaveProperty('expiresIn', 604800);
      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
      expect(result).toHaveProperty('refreshToken', 'mock.jwt.token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should return user data without password hash', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('firstName');
      expect(result.user).toHaveProperty('lastName');
      expect(result.user).toHaveProperty('role');
    });
  });

  describe('validateUser', () => {
    const userId = 'test-user-id-123';
    const mockUser = createMockUser({ id: userId });

    it('should return user if found', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
      });

      const result = await service.validateUser(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });
      expect(result.id).toBe(userId);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser(userId)).rejects.toThrow(UnauthorizedException);
      await expect(service.validateUser(userId)).rejects.toThrow('User not found');
    });
  });

  describe('refreshToken', () => {
    const userId = 'test-user-id-123';
    const mockUser = createMockUser({ id: userId });

    it('should return new access token with valid refresh token', async () => {
      const validPayload = {
        sub: userId,
        email: mockUser.email,
        role: mockUser.role,
        type: 'refresh',
      };

      mockJwtService.verify.mockReturnValue(validPayload);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.refreshToken({ refreshToken: 'valid.refresh.token' });

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid.refresh.token', {
        secret: 'test-refresh-secret',
      });
      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
      expect(result).toHaveProperty('expiresIn', 900);
    });

    it('should throw UnauthorizedException if token type is not refresh', async () => {
      const invalidPayload = {
        sub: userId,
        email: mockUser.email,
        role: mockUser.role,
        type: 'access', // Wrong type
      };

      mockJwtService.verify.mockReturnValue(invalidPayload);

      await expect(service.refreshToken({ refreshToken: 'invalid.token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const validPayload = {
        sub: userId,
        email: mockUser.email,
        role: mockUser.role,
        type: 'refresh',
      };

      mockJwtService.verify.mockReturnValue(validPayload);
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken({ refreshToken: 'valid.refresh.token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(service.refreshToken({ refreshToken: 'expired.token' })).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken({ refreshToken: 'expired.token' })).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });
  });

  describe('forgotPassword', () => {
    const mockUser = createMockUser({ email: 'test@example.com' });

    it('should return success message even if user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'nonexistent@example.com' });

      expect(result.message).toContain('If an account with that email exists');
    });

    it('should create reset token when user exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prismaService.passwordResetToken.create.mockResolvedValue({
        id: 'token-id',
        token: 'hashed-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        used: false,
      });

      const result = await service.forgotPassword({ email: mockUser.email });

      expect(result.message).toContain('If an account with that email exists');
      expect(prismaService.passwordResetToken.updateMany).toHaveBeenCalled();
      expect(prismaService.passwordResetToken.create).toHaveBeenCalled();
    });

    it('should invalidate existing reset tokens', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
      prismaService.passwordResetToken.create.mockResolvedValue({
        id: 'token-id',
        token: 'hashed-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        used: false,
      });

      await service.forgotPassword({ email: mockUser.email });

      expect(prismaService.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, used: false },
        data: { used: true },
      });
    });
  });

  describe('resetPassword', () => {
    const mockUser = createMockUser();
    const mockResetToken = {
      id: 'token-id',
      token: 'hashed-token',
      userId: mockUser.id,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      used: false,
      user: mockUser,
    };

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$newhashedpassword');
    });

    it('should reset password with valid token', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue(mockResetToken);
      prismaService.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'newPassword123',
      });

      expect(result.message).toBe('Password has been reset successfully');
    });

    it('should throw BadRequestException if token not found', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'invalid-token', newPassword: 'newPassword123' }),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw BadRequestException if token is expired', async () => {
      const expiredToken = {
        ...mockResetToken,
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      };
      prismaService.passwordResetToken.findUnique.mockResolvedValue(expiredToken);

      await expect(
        service.resetPassword({ token: 'expired-token', newPassword: 'newPassword123' }),
      ).rejects.toThrow('Reset token has expired');
    });

    it('should throw BadRequestException if token is already used', async () => {
      const usedToken = {
        ...mockResetToken,
        used: true,
      };
      prismaService.passwordResetToken.findUnique.mockResolvedValue(usedToken);

      await expect(
        service.resetPassword({ token: 'used-token', newPassword: 'newPassword123' }),
      ).rejects.toThrow('Reset token has already been used');
    });
  });
});
