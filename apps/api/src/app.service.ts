import { Injectable } from '@nestjs/common';
import { PrismaService } from './common/prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Welcome to AutoGrader Platform API! 🚀';
  }

  async getHealth() {
    // Test database connectivity
    const dbStatus = await this.checkDatabase();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
    };
  }

  private async checkDatabase() {
    try {
      // Simple query to check if database is accessible
      await this.prisma.$queryRaw`SELECT 1`;
      const userCount = await this.prisma.user.count();
      const courseCount = await this.prisma.course.count();
      const assignmentCount = await this.prisma.assignment.count();

      return {
        status: 'connected',
        users: userCount,
        courses: courseCount,
        assignments: assignmentCount,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
