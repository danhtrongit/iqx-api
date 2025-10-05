import { Test, TestingModule } from '@nestjs/testing';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

describe('UserManagementController', () => {
  let controller: UserManagementController;
  let service: UserManagementService;

  const mockUserManagementService = {
    getUserStats: jest.fn(),
    listUsers: jest.fn(),
    getUserById: jest.fn(),
    activateUser: jest.fn(),
    deactivateUser: jest.fn(),
    updateUserRole: jest.fn(),
    getUserSubscriptions: jest.fn(),
    assignSubscription: jest.fn(),
    updateSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserManagementController],
      providers: [
        {
          provide: UserManagementService,
          useValue: mockUserManagementService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserManagementController>(
      UserManagementController,
    );
    service = module.get<UserManagementService>(UserManagementService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      const stats = {
        totalUsers: 100,
        activeUsers: 90,
        inactiveUsers: 10,
        premiumUsers: 20,
        adminUsers: 5,
        newUsersThisMonth: 15,
      };

      mockUserManagementService.getUserStats.mockResolvedValue(stats);

      const result = await controller.getStats();
      expect(result).toEqual(stats);
      expect(service.getUserStats).toHaveBeenCalled();
    });
  });

  describe('listUsers', () => {
    it('should return paginated users list', async () => {
      const query = {
        page: 1,
        limit: 10,
      };

      const response = {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      };

      mockUserManagementService.listUsers.mockResolvedValue(response);

      const result = await controller.listUsers(query);
      expect(result).toEqual(response);
      expect(service.listUsers).toHaveBeenCalledWith(query);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const userId = 'test-user-id';
      const user = {
        id: userId,
        email: 'test@example.com',
        role: 'member',
        isActive: true,
      };

      mockUserManagementService.getUserById.mockResolvedValue(user);

      const result = await controller.getUserById(userId);
      expect(result).toEqual(user);
      expect(service.getUserById).toHaveBeenCalledWith(userId);
    });
  });

  describe('activateUser', () => {
    it('should activate a user', async () => {
      const userId = 'test-user-id';
      const adminId = 'admin-id';
      const req = {
        user: { sub: adminId },
        headers: { 'user-agent': 'test-agent' },
      };
      const ip = '127.0.0.1';

      const response = {
        message: 'Kích hoạt người dùng thành công',
        user: { id: userId, isActive: true },
      };

      mockUserManagementService.activateUser.mockResolvedValue(response);

      const result = await controller.activateUser(userId, req, ip);
      expect(result).toEqual(response);
      expect(service.activateUser).toHaveBeenCalledWith(
        userId,
        adminId,
        ip,
        'test-agent',
      );
    });
  });

  describe('assignSubscription', () => {
    it('should assign subscription to user', async () => {
      const userId = 'test-user-id';
      const adminId = 'admin-id';
      const assignDto = {
        packageId: 'package-id',
        startsAt: '2024-01-15T00:00:00Z',
        durationDays: 30,
        autoRenew: false,
      };
      const req = {
        user: { sub: adminId },
        headers: { 'user-agent': 'test-agent' },
      };
      const ip = '127.0.0.1';

      const response = {
        message: 'Gắn gói subscription cho người dùng thành công',
        subscription: { id: 'subscription-id', userId, packageId: assignDto.packageId },
      };

      mockUserManagementService.assignSubscription.mockResolvedValue(response);

      const result = await controller.assignSubscription(
        userId,
        assignDto,
        req,
        ip,
      );
      expect(result).toEqual(response);
      expect(service.assignSubscription).toHaveBeenCalledWith(
        userId,
        assignDto,
        adminId,
        ip,
        'test-agent',
      );
    });
  });
});

