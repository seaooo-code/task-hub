import { Body, Controller, Delete, Post } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly task: TasksService) {}

  @Post('update')
  update(@Body('id') id: number) {
    const planId = Number(id);
    if (isNaN(planId)) {
      return { success: false, message: '无效的任务ID' };
    }
    return this.task.updateCron(planId);
  }

  @Delete('delete')
  delete(@Body('id') id: number) {
    const planId = Number(id);
    if (isNaN(planId)) {
      return { success: false, message: '无效的任务ID' };
    }
    return this.task.deleteCron(planId);
  }
}
