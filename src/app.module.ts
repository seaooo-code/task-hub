import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { DrizzleModule } from './drizzle/drizzle.module';
import { TasksModule } from './tasks/tasks.module';
import { FeishuModule } from './feishu/feishu.module';
import { UsersModule } from './users/users.module';
import { DutiesModule } from './duties/duties.module';
import { TemplateController } from './template/template.controller';
import { TemplateService } from './template/template.service';
import { TemplateModule } from './template/template.module';
import { ConfigModule } from '@nestjs/config';
import { ThriftModule } from './thrift/thrift.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: ['.env.local'],
      isGlobal: true,
    }),
    DrizzleModule,
    TasksModule,
    FeishuModule,
    UsersModule,
    DutiesModule,
    TemplateModule,
    ThriftModule,
  ],
  controllers: [AppController, TemplateController],
  providers: [AppService, TemplateService],
})
export class AppModule {}
