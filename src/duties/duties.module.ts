import { Module } from '@nestjs/common';
import { DutiesService } from './duties.service';
import { DutiesController } from './duties.controller';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],
  providers: [DutiesService],
  controllers: [DutiesController],
})
export class DutiesModule {}
