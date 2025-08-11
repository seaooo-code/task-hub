import {
	forwardRef,
	HttpException,
	Inject,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	type OnModuleInit,
} from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import { dutiesTable, dutiesUsers } from "../../drizzle/schema";
import { DrizzleService } from "../drizzle/drizzle.service";
import { DutiesService } from "../duties/duties.service";
import { FeishuService } from "../feishu/feishu.service";
import { TemplateVariablesService } from "../template/variable.service";
import { convertToCron } from "../utils";

@Injectable()
export class TasksService implements OnModuleInit {
	private readonly logger = new Logger(TasksService.name);
	private taskCallbacks = new Map<number, () => Promise<void>>();

	constructor(
		private readonly drizzle: DrizzleService,
		private readonly feishu: FeishuService,
		private readonly scheduler: SchedulerRegistry,
		@Inject(forwardRef(() => DutiesService))
		private readonly duty: DutiesService,
		private readonly templateVariables: TemplateVariablesService,
	) {}

	/**
	 * 创建回调函数处理器
	 */
	private createCallbackHandler(plan: typeof dutiesTable.$inferSelect) {
		return async () => {
			try {
				const templateData = await this.templateVariables.getTemplateVariables(
					plan.id,
					plan.templateId,
				);

				await this.feishu.sendMessage({
					receiveId: plan.receiveId,
					msgType: "interactive",
					content: JSON.stringify({
						type: "template",
						data: templateData,
					}),
				});

				await this.drizzle.db
					.update(dutiesTable)
					.set({
						lastRunTime: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
					})
					.where(eq(dutiesTable.id, plan.id));
			} catch (error) {
				this.logger.error("执行任务失败:", error);
			}
		};
	}

	/**
	 * 创建轮转值班人员的回调函数
	 */
	private createRotatorCallback(planId: number): () => void {
		return () => {
			void (async () => {
				const dutyInfo = await this.duty.getDutyUserInfo(planId);
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
			if (this.scheduler.doesExist("cron", `${plan.id}-execute`)) {
				this.scheduler.deleteCronJob(`${plan.id}-execute`);
			}
			if (this.scheduler.doesExist("cron", `${plan.id}-rotator`)) {
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
					`添加定时任务失败: ${error instanceof Error ? error.message : "未知错误"}`,
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
				if (this.scheduler.doesExist("cron", jobName)) {
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
			this.logger.error("初始化定时任务失败:", error);
		}
	}
}
