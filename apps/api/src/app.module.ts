import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger/logger.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
// import { AssignmentsModule } from './assignments/assignments.module';
// import { RubricsModule } from './rubrics/rubrics.module';
// import { SubmissionsModule } from './submissions/submissions.module';
// import { GradingModule } from './grading/grading.module';
// import { WebsocketsModule } from './websockets/websockets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    // TODO: Implement these modules to match Prisma schema
    // AssignmentsModule,
    // RubricsModule,
    // SubmissionsModule,
    // GradingModule,
    // WebsocketsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
