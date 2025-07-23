import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { FeishuModule } from '../feishu/feishu.module';

@Module({
  imports: [FeishuModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
