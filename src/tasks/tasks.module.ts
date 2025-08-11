import { Module, forwardRef } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { FeishuModule } from '../feishu/feishu.module';
import { DutiesModule } from '../duties/duties.module';
import { TemplateModule } from '../template/template.module';

@Module({
  imports: [FeishuModule, forwardRef(() => DutiesModule), TemplateModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
