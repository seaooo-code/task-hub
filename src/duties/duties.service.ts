import {
	forwardRef,
	Inject,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from "@nestjs/common";
import { and, count, desc, eq, like, or, type SQL } from "drizzle-orm";
import {
	dutiesTable,
	dutiesUsers,
	templatesTable,
	usersTable,
} from "../../drizzle/schema";
import { DrizzleService } from "../drizzle/drizzle.service";
import { TasksService } from "../tasks/tasks.service";
import type { CreateDutyDto } from "./dto/create-duty.dto";
import type { UpdateDutyDto } from "./dto/update-duty.dto";

type Duty = typeof dutiesTable.$inferSelect;
type User = typeof usersTable.$inferSelect;
type Template = typeof templatesTable.$inferSelect;
// 定义查询参数接口
export interface SearchDutiesParams {
	keyword?: string;
	page?: number;
	pageSize?: number;
}

// 定义分页结果接口
export interface PaginatedDutiesResult {
	duties: Array<
		Duty & {
			currentUser: User | null;
			template: Template | null;
			userCount: number;
		}
	>;
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
}

@Injectable()
export class DutiesService {
	private readonly logger = new Logger(DutiesService.name);
	constructor(
		private readonly drizzle: DrizzleService,
		@Inject(forwardRef(() => TasksService))
		private readonly task: TasksService,
	) {}

	async getDutyDetail(dutyId: number) {
		// 查询 duty 主表信息
		const duties = await this.drizzle.db
			.select()
			.from(dutiesTable)
			.where(eq(dutiesTable.id, dutyId))
			.limit(1);

		if (duties.length === 0) {
			throw new NotFoundException(`未找到ID为 ${dutyId} 的值班计划`);
		}
		const duty = duties[0];
		// 查询关联的用户信息
		const results = await this.drizzle.db
			.select()
			.from(dutiesUsers)
			.leftJoin(usersTable, eq(dutiesUsers.userId, usersTable.id))
			.where(eq(dutiesUsers.dutyId, dutyId))
			.orderBy(dutiesUsers.orderIndex);

		const users = results.map((result) => ({
			...result.users_table,
		}));

		return {
			success: true,
			data: {
				...duty,
				users,
			},
		};
	}

	async createDuty(duty: CreateDutyDto) {
		// 插入 duty 主表数据
		await this.drizzle.db.insert(dutiesTable).values({
			name: duty.name,
			receiveId: duty.receiveId,
			templateId: duty.templateId,
			cronSchedule: duty.cronSchedule,
			personIndex: duty.personIndex,
			dayOfWeek: duty.dayOfWeek,
			startTimeHour: duty.startTimeHour,
			startTimeMinute: duty.startTimeMinute,
			endTimeHour: duty.endTimeHour,
			endTimeMinute: duty.endTimeMinute,
			enabled: duty.enabled || 0,
			creatorId: duty.creatorId,
		});

		// 通过唯一条件查询刚插入的记录
		const insertedDuties = await this.drizzle.db
			.select()
			.from(dutiesTable)
			.where(
				and(
					eq(dutiesTable.name, duty.name),
					eq(dutiesTable.receiveId, duty.receiveId),
					eq(dutiesTable.templateId, duty.templateId),
					eq(dutiesTable.cronSchedule, duty.cronSchedule),
				),
			)
			.orderBy(desc(dutiesTable.createAt))
			.limit(1);

		const insertedDuty = insertedDuties[0];
		if (!insertedDuty) {
			throw new InternalServerErrorException("无法获取插入的记录");
		}

		// 如果有用户数组，则插入到 dutiesUsers 关联表
		if (duty.users && duty.users.length > 0) {
			const dutiesUsersData = duty.users.map((userId, index) => ({
				dutyId: insertedDuty.id,
				userId: userId,
				orderIndex: index,
			}));

			try {
				await this.drizzle.db.insert(dutiesUsers).values(dutiesUsersData);
			} catch (error) {
				throw new InternalServerErrorException(
					"创建用户关联失败: " + (error as Error).message,
				);
			}
		}
		try {
			this.task.addCronJob(insertedDuty);
			this.logger.log(
				`值班计划 "${insertedDuty.name}" 创建成功，已添加定时任务`,
			);
		} catch (cronError) {
			this.logger.error(
				`值班计划 "${insertedDuty.name}" 创建成功，但定时任务启动失败:`,
				cronError,
			);
		}
		return insertedDuty;
	}

	async searchDuties(
		params: SearchDutiesParams = {},
	): Promise<PaginatedDutiesResult> {
		const { keyword = "", page = 1, pageSize = 10 } = params;

		// 参数验证
		const validPage = Math.max(1, page);
		const validPageSize = Math.min(Math.max(1, pageSize), 100);
		const offset = (validPage - 1) * validPageSize;

		// 构建查询条件
		const whereConditions: Array<SQL | undefined> = [];

		if (keyword && keyword.trim()) {
			const searchTerm = `%${keyword.trim()}%`;
			whereConditions.push(like(dutiesTable.name, searchTerm));
		}

		// 执行查询 - 获取总数
		const [totalResult] = await this.drizzle.db
			.select({ count: count() })
			.from(dutiesTable)
			.where(whereConditions.length > 0 ? or(...whereConditions) : undefined);

		const total = totalResult.count;

		// 执行查询 - 获取分页数据
		const duties = await this.drizzle.db
			.select()
			.from(dutiesTable)
			.where(whereConditions.length > 0 ? or(...whereConditions) : undefined)
			.orderBy(desc(dutiesTable.createAt))
			.limit(validPageSize)
			.offset(offset);

		// 为每个 duty 获取当前值班人信息、模板信息和用户数量
		const dutiesWithDetails = await Promise.all(
			duties.map(async (duty) => {
				try {
					// 获取当前值班计划的用户列表
					const dutyUsers = await this.drizzle.db
						.select({
							userId: dutiesUsers.userId,
							orderIndex: dutiesUsers.orderIndex,
						})
						.from(dutiesUsers)
						.where(eq(dutiesUsers.dutyId, duty.id))
						.orderBy(dutiesUsers.orderIndex);

					let currentUser: User | null = null;

					if (dutyUsers.length > 0) {
						// 根据 personIndex 获取当前值班人的 userId
						const currentUserIndex = duty.personIndex % dutyUsers.length;
						const currentUserId = dutyUsers[currentUserIndex].userId;

						// 获取用户详细信息
						const [userInfo] = await this.drizzle.db
							.select()
							.from(usersTable)
							.where(eq(usersTable.id, currentUserId))
							.limit(1);

						currentUser = userInfo || null;
					}

					// 获取关联的模板信息
					let template: Template | null = null;
					if (duty.templateId) {
						const [templateInfo] = await this.drizzle.db
							.select()
							.from(templatesTable)
							.where(eq(templatesTable.id, duty.templateId))
							.limit(1);

						template = templateInfo || null;
					}

					return {
						...duty,
						currentUser,
						template,
						userCount: dutyUsers.length,
					};
				} catch (error) {
					throw new InternalServerErrorException(
						`获取值班计划 ${duty.id} 的详细信息失败: ${error}`,
					);
				}
			}),
		);

		// 计算分页信息
		const totalPages = Math.ceil(total / validPageSize);
		const hasNextPage = validPage < totalPages;
		const hasPrevPage = validPage > 1;

		return {
			duties: dutiesWithDetails,
			pagination: {
				page: validPage,
				pageSize: validPageSize,
				total,
				totalPages,
				hasNextPage,
				hasPrevPage,
			},
		};
	}

	async deleteDuty(dutyId: number) {
		// 首先查询要删除的 duty 是否存在
		const duties = await this.drizzle.db
			.select()
			.from(dutiesTable)
			.where(eq(dutiesTable.id, dutyId))
			.limit(1);

		if (duties.length === 0) {
			throw new NotFoundException(`未找到ID为 ${dutyId} 的值班计划`);
		}

		const duty = duties[0];
		// 先删除定时任务（通过 TasksService）
		this.task.deleteCron(dutyId);

		try {
			// 删除 dutiesUsers 关联表中的数据
			await this.drizzle.db
				.delete(dutiesUsers)
				.where(eq(dutiesUsers.dutyId, dutyId));

			// 删除 duty 主表数据
			await this.drizzle.db
				.delete(dutiesTable)
				.where(eq(dutiesTable.id, dutyId));

			return {
				success: true,
				message: `值班计划 "${duty.name}" 及其关联数据已成功删除`,
				deletedDuty: duty,
			};
		} catch (error) {
			throw new InternalServerErrorException(
				`删除数据库记录失败: ${(error as Error).message}`,
			);
		}
	}

	async switchStatus(dutyId: number, status: number) {
		// 首先查询要更新的 duty 是否存在
		const duties = await this.drizzle.db
			.select()
			.from(dutiesTable)
			.where(eq(dutiesTable.id, dutyId))
			.limit(1);

		if (duties.length === 0) {
			throw new NotFoundException(`未找到ID为 ${dutyId} 的值班计划`);
		}

		const currentDuty = duties[0];

		// 如果状态没有改变，直接返回成功
		if (currentDuty.enabled === status) {
			return {
				success: true,
				message: `值班计划 "${currentDuty.name}" 状态未发生变化`,
				duty: currentDuty,
			};
		}

		// 更新数据库中的状态
		await this.drizzle.db
			.update(dutiesTable)
			.set({
				enabled: status,
			})
			.where(eq(dutiesTable.id, dutyId));

		// 获取更新后的记录
		const updatedDuties = await this.drizzle.db
			.select()
			.from(dutiesTable)
			.where(eq(dutiesTable.id, dutyId))
			.limit(1);

		const updatedDuty = updatedDuties[0];

		try {
			// 调用 updateCron 来更新定时任务状态
			await this.task.updateCron(dutyId);
			return {
				success: true,
				message:
					status === 1
						? `值班计划 "${updatedDuty.name}" 已启用，定时任务已开始运行`
						: `值班计划 "${updatedDuty.name}" 已禁用，定时任务已停止`,
				duty: updatedDuty,
			};
		} catch (error) {
			this.logger.error("更新定时任务失败:", error);
			return {
				success: true,
				message: `值班计划 "${updatedDuty.name}" 状态已更新，但定时任务更新失败: ${(error as Error).message}`,
				duty: updatedDuty,
			};
		}
	}

	manualRunDuty(dutyId: number) {
		return this.task.manualRun(dutyId);
	}

	async updateDuty(dutyId: number, duty: UpdateDutyDto) {
		// 首先查询要更新的 duty 是否存在
		const existingDuties = await this.drizzle.db
			.select()
			.from(dutiesTable)
			.where(eq(dutiesTable.id, dutyId))
			.limit(1);

		if (existingDuties.length === 0) {
			throw new NotFoundException(`未找到ID为 ${dutyId} 的值班计划`);
		}

		const existingDuty = existingDuties[0];

		// 更新 duty 主表数据
		await this.drizzle.db
			.update(dutiesTable)
			.set({
				name: duty.name,
				receiveId: duty.receiveId,
				templateId: duty.templateId,
				cronSchedule: duty.cronSchedule,
				personIndex: duty.personIndex || existingDuty.personIndex,
				dayOfWeek: duty.dayOfWeek,
				startTimeHour: duty.startTimeHour,
				startTimeMinute: duty.startTimeMinute,
				endTimeHour: duty.endTimeHour,
				endTimeMinute: duty.endTimeMinute,
				enabled:
					duty.enabled !== undefined ? duty.enabled : existingDuty.enabled,
			})
			.where(eq(dutiesTable.id, dutyId));

		// 获取更新后的记录
		const updatedDuties = await this.drizzle.db
			.select()
			.from(dutiesTable)
			.where(eq(dutiesTable.id, dutyId))
			.limit(1);

		const updatedDuty = updatedDuties[0];

		// 如果有用户数组更新，则处理用户关联
		if (duty.users && duty.users.length > 0) {
			try {
				// 先删除原有的用户关联
				await this.drizzle.db
					.delete(dutiesUsers)
					.where(eq(dutiesUsers.dutyId, dutyId));

				// 插入新的用户关联
				const dutiesUsersData = duty.users.map((userId, index) => ({
					dutyId: dutyId,
					userId: userId,
					orderIndex: index,
				}));

				await this.drizzle.db.insert(dutiesUsers).values(dutiesUsersData);
			} catch (error) {
				throw new InternalServerErrorException(
					"更新用户关联失败: " + (error as Error).message,
				);
			}
		}
		try {
			// 更新定时任务
			await this.task.updateCron(dutyId);
			return {
				success: true,
				message: `值班计划 "${updatedDuty.name}" 更新成功，定时任务已同步更新`,
				duty: updatedDuty,
			};
		} catch (cronError) {
			this.logger.error("更新定时任务失败:", cronError);
			return {
				success: true,
				message: `值班计划 "${updatedDuty.name}" 更新成功，但定时任务更新失败: ${(cronError as Error).message}`,
				duty: updatedDuty,
			};
		}
	}

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
}
