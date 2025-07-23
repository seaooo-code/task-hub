import { Module } from '@nestjs/common';
import { FeishuService } from './feishu.service';
import { HttpModule } from '@nestjs/axios';
import { FeishuController } from './feishu.controller';

@Module({
  imports: [HttpModule],
  providers: [FeishuService],
  exports: [FeishuService],
  controllers: [FeishuController],
})
export class FeishuModule {}
