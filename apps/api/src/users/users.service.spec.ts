import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { createMockPrismaService } from '../../test/mocks/prisma.mock';
import {
  createMockUser,
  createMockStudent,
  createMockProfessor,
  createCreateUserDto,
  createUpdateUserDto,
} from '../../test/factories/test-data.factory';
import * as bcrypt from 'bcryptjs';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hashedpassword'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto = createCreateUserDto();
    const hashedPassword = '$2a$10$hashedpassword';

    it('should successfully create a new user', async () => {
      const createdUser = createMockStudent({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        githubUsername: createUserDto.githubUsername,
      });

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          passwordHash: hashedPassword,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          role: createUserDto.role,
          githubUsername: createUserDto.githubUsername,
        },
      });
      expect(result.email).toBe(createUserDto.email);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException if user already exists', async () => {
      const existingUser = createMockUser({ email: createUserDto.email });
      prismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'User with this email already exists',
      );

      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should hash the password before storing', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(
        createMockStudent({ email: createUserDto.email }),
      );

      await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        createMockStudent({ id: 'user-1' }),
        createMockProfessor({ id: 'user-2' }),
      ];

      prismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('passwordHash');
    });

    it('should return empty array when no users exist', async () => {
      prismaService.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const userId = 'test-user-id-123';

    it('should return a user if found', async () => {
      const mockUser = createMockUser({ id: userId });
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result.id).toBe(userId);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(userId)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );
    });
  });

  describe('findByEmail', () => {
    const email = 'test@example.com';

    it('should return a user if found by email', async () => {
      const mockUser = createMockUser({ email });
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result.email).toBe(email);
    });

    it('should throw NotFoundException if user not found by email', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findByEmail(email)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByEmail(email)).rejects.toThrow(
        `User with email ${email} not found`,
      );
    });
  });

  describe('update', () => {
    const userId = 'test-user-id-123';
    const updateUserDto = createUpdateUserDto();

    it('should successfully update a user', async () => {
      const existingUser = createMockUser({ id: userId });
      const updatedUser = createMockUser({
        id: userId,
        ...updateUserDto,
      });

      prismaService.user.findUnique.mockResolvedValue(existingUser);
      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          firstName: updateUserDto.firstName,
          lastName: updateUserDto.lastName,
        }),
      });
      expect(result.firstName).toBe(updateUserDto.firstName);
    });

    it('should throw NotFoundException if user to update not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should hash password if provided in update', async () => {
      const existingUser = createMockUser({ id: userId });
      const updateWithPassword = { ...updateUserDto, password: 'NewPassword123!' };
      const updatedUser = createMockUser({ id: userId, ...updateUserDto });

      prismaService.user.findUnique.mockResolvedValue(existingUser);
      prismaService.user.update.mockResolvedValue(updatedUser);

      await service.update(userId, updateWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 10);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          passwordHash: '$2a$10$hashedpassword',
        }),
      });
    });

    it('should not update password hash if password not provided', async () => {
      const existingUser = createMockUser({ id: userId });
      const updatedUser = createMockUser({ id: userId, ...updateUserDto });

      prismaService.user.findUnique.mockResolvedValue(existingUser);
      prismaService.user.update.mockResolvedValue(updatedUser);

      await service.update(userId, updateUserDto);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.not.objectContaining({
          passwordHash: expect.anything(),
        }),
      });
    });
  });

  describe('toResponseDto (implicit through public methods)', () => {
    it('should exclude passwordHash from response', async () => {
      const mockUserWithHash = createMockUser({
        id: 'test-id',
        passwordHash: 'super-secret-hash',
      });

      prismaService.user.findUnique.mockResolvedValue(mockUserWithHash);

      const result = await service.findOne('test-id');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
    });
  });
});
