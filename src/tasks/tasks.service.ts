import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { eq } from 'drizzle-orm';
import { addDays, format, startOfWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DrizzleService } from '../drizzle/drizzle.service';
import { dutiesTable, dutiesUsers } from '../../drizzle/schema';
import { FeishuService } from '../feishu/feishu.service';
import { convertToCron } from '../utils';

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);
  private taskCallbacks = new Map<number, () => void>();

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly feishu: FeishuService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  /**
   * 获取值班计划当前和下一周负责人信息
   * @param planId
   */
  async getDutyUserInfo(planId: number) {
    // 执行计划查询
    const plans = await this.drizzle.db
      .select()
      .from(dutiesTable)
      .where(eq(dutiesTable.id, planId));

    const plan = plans[0];
    if (!plan) {
      throw new NotFoundException(`未找到ID为 ${planId} 的值班计划`);
    }

    // 执行用户查询
    const users = await this.drizzle.db
      .select({
        id: dutiesUsers.userId,
      })
      .from(dutiesUsers)
      .where(eq(dutiesUsers.dutyId, planId))
      .orderBy(dutiesUsers.orderIndex);

    if (users.length === 0) {
      throw new InternalServerErrorException(
        `值班计划 ${planId} 没有关联的用户`,
      );
    }

    return {
      currentUserId: users[plan.personIndex].id,
      nextUserId: users[(plan.personIndex + 1) % users.length].id,
      index: plan.personIndex,
    };
  }

  /**
   * 创建回调函数处理器
   */
  private createCallbackHandler(
    plan: typeof dutiesTable.$inferSelect,
  ): () => void {
    switch (plan.templateId) {
      case '0':
        return () => {
          void (async () => {
            try {
              const { currentUserId } = await this.getDutyUserInfo(plan.id);

              await this.feishu.sendMessage({
                receiveId: plan.receiveId,
                msgType: 'text',
                content: JSON.stringify({
                  text: `🔔 本周周会已结束，下周周会主持人是 <at user_id="${currentUserId}"></at>，请关注会议室预定情况。`,
                }),
              });

              await this.drizzle.db
                .update(dutiesTable)
                .set({
                  lastRunTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                })
                .where(eq(dutiesTable.id, plan.id));
            } catch (error) {
              this.logger.error('执行任务失败:', error);
            }
          })();
        };

      case 'AAq4NEqabytNS':
        return () => {
          void (async () => {
            try {
              const { currentUserId, nextUserId } = await this.getDutyUserInfo(
                plan.id,
              );

              const today = new Date();
              const start = startOfWeek(today, { weekStartsOn: 1 });
              const thursday = addDays(start, 3);
              const formattedDate = format(thursday, 'yyyy年M月d日 (EEEE)', {
                locale: zhCN,
              });

              await this.feishu.sendMessage({
                receiveId: plan.receiveId,
                msgType: 'interactive',
                content: JSON.stringify({
                  type: 'template',
                  data: {
                    template_id: 'AAq4NEqabytNS',
                    template_variable: {
                      host: currentUserId,
                      nextHost: nextUserId,
                      date: formattedDate,
                      at: `<at id=${currentUserId}></at>`,
                      next: `<at id=${nextUserId}></at>`,
                    },
                  },
                }),
              });

              await this.drizzle.db
                .update(dutiesTable)
                .set({
                  lastRunTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                })
                .where(eq(dutiesTable.id, plan.id));
            } catch (error) {
              this.logger.error('执行任务失败:', error);
            }
          })();
        };

      case 'AAqdruv7QvD1U':
        return () => {
          void (async () => {
            try {
              const { currentUserId } = await this.getDutyUserInfo(plan.id);

              const tomorrow = addDays(new Date(), 1);
              const formattedDate = format(tomorrow, 'yyyy-MM-dd');
              const dayOfWeek = format(tomorrow, 'EEEE', { locale: zhCN });

              await this.feishu.sendMessage({
                receiveId: plan.receiveId,
                msgType: 'interactive',
                content: JSON.stringify({
                  type: 'template',
                  data: {
                    template_id: 'AAqdruv7QvD1U',
                    template_variable: {
                      date: `发版时间：${formattedDate}（${dayOfWeek}）`,
                      manager: `<at id=${currentUserId}></at>`,
                      branch: `release/${formattedDate.split('-').join('')}`,
                    },
                  },
                }),
              });

              await this.drizzle.db
                .update(dutiesTable)
                .set({
                  lastRunTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                })
                .where(eq(dutiesTable.id, plan.id));
            } catch (error) {
              this.logger.error('执行任务失败:', error);
            }
          })();
        };

      case 'AAqdr8y0VxPDi':
        return () => {
          void (async () => {
            try {
              const { currentUserId } = await this.getDutyUserInfo(plan.id);

              const formattedDate = format(new Date(), 'yyyy-MM-dd');

              await this.feishu.sendMessage({
                receiveId: plan.receiveId,
                msgType: 'interactive',
                content: JSON.stringify({
                  type: 'template',
                  data: {
                    template_id: 'AAqdr8y0VxPDi',
                    template_variable: {
                      date: `发版时间：${formattedDate}（今天）`,
                      manager: `<at id=${currentUserId}></at>`,
                    },
                  },
                }),
              });

              await this.drizzle.db
                .update(dutiesTable)
                .set({
                  lastRunTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                })
                .where(eq(dutiesTable.id, plan.id));
            } catch (error) {
              this.logger.error('执行任务失败:', error);
            }
          })();
        };

      default:
        return () => {
          // 空的同步函数，返回 void
        };
    }
  }

  /**
   * 创建轮转值班人员的回调函数
   */
  private createRotatorCallback(planId: number): () => void {
    return () => {
      void (async () => {
        const dutyInfo = await this.getDutyUserInfo(planId);
        const users = await this.drizzle.db
          .select()
          .from(dutiesUsers)
          .where(eq(dutiesUsers.dutyId, planId));

        await this.drizzle.db
          .update(dutiesTable)
          .set({
            personIndex: (dutyInfo.index + 1) % users.length,
          })
          .where(eq(dutiesTable.id, planId));
      })();
    };
  }

  /**
   * 添加定时任务
   * @param plan
   */
  addCronJob(plan: typeof dutiesTable.$inferSelect): void {
    try {
      const callback = this.createCallbackHandler(plan);
      this.taskCallbacks.set(plan.id, callback);

      // 创建执行推送任务的 CronJob
      const executeTask = new CronJob(plan.cronSchedule, callback);

      // 创建轮转值班人员的 CronJob
      const dutyRotator = new CronJob(
        convertToCron(plan.dayOfWeek, plan.endTimeHour, plan.endTimeMinute),
        this.createRotatorCallback(plan.id),
      );

      // 删除已存在的任务
      if (this.scheduler.doesExist('cron', `${plan.id}-execute`)) {
        this.scheduler.deleteCronJob(`${plan.id}-execute`);
      }
      if (this.scheduler.doesExist('cron', `${plan.id}-rotator`)) {
        this.scheduler.deleteCronJob(`${plan.id}-rotator`);
      }

      // 添加新任务
      this.scheduler.addCronJob(`${plan.id}-execute`, executeTask);
      this.scheduler.addCronJob(`${plan.id}-rotator`, dutyRotator);

      // 检查计划是否启用
      if (plan.enabled) {
        this.scheduler.getCronJob(`${plan.id}-execute`).start();
        this.scheduler.getCronJob(`${plan.id}-rotator`).start();
        this.logger.log(`已添加值班计划: ${plan.name} 的定时任务`);
      } else {
        this.logger.log(`${plan.name} 的状态为禁用，取消定时任务`);
      }
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          `添加定时任务失败: ${error instanceof Error ? error.message : '未知错误'}`,
        );
      }
    }
  }

  /**
   * 根据值班 id 删除对应定时任务（不删除数据库记录）
   * @param planId 值班计划ID
   * @returns 删除操作的结果信息
   */
  deleteCron(planId: number) {
    const jobs = [`${planId}-execute`, `${planId}-rotator`];

    // 删除回调函数
    this.taskCallbacks.delete(planId);

    // 删除定时任务
    jobs.forEach((jobName) => {
      try {
        if (this.scheduler.doesExist('cron', jobName)) {
          this.scheduler.deleteCronJob(jobName);
          this.logger.log(`已删除定时任务: ${jobName}`);
        }
      } catch (error) {
        throw new InternalServerErrorException(
          `删除定时任务 ${jobName} 时出现错误: ${error}`,
        );
      }
    });
  }

  /**
   * 根据值班 id 更新对应定时任务
   * @param planId 值班计划ID
   */
  async updateCron(planId: number): Promise<void> {
    // 从数据库获取值班计划
    const plans = await this.drizzle.db
      .select()
      .from(dutiesTable)
      .where(eq(dutiesTable.id, planId));

    if (plans.length > 0) {
      this.addCronJob(plans[0]);
    } else {
      throw new NotFoundException(`未找到ID为 ${planId} 的值班计划`);
    }
  }

  /**
   * 根据值班 id 手动运行对应定时任务
   * @param planId
   */
  manualRun(planId: number): { success: boolean; message: string } {
    const callback = this.taskCallbacks.get(planId);

    if (!callback) {
      throw new InternalServerErrorException(
        `未找到ID为 ${planId} 的任务或任务未初始化`,
      );
    }

    // 执行回调函数（回调函数内部会处理更新最后运行时间的逻辑）
    callback();
    return {
      success: true,
      message: `ID为 ${planId} 的任务已成功手动执行`,
    };
  }

  async onModuleInit() {
    try {
      const plans = await this.drizzle.db.select().from(dutiesTable);
      for (const plan of plans) {
        this.addCronJob(plan);
      }
    } catch (error) {
      this.logger.error('初始化定时任务失败:', error);
    }
  }
}
