import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Makes PrismaService available globally without importing the module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
