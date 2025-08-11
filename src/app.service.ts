import { Injectable } from "@nestjs/common";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { dutiesTable, templatesTable, usersTable } from "../drizzle/schema";
import { DrizzleService } from "./drizzle/drizzle.service";

export interface DashboardStats {
	activeDutiesCount: number;
	totalUsersCount: number;
	totalTemplatesCount: number;
	todayPushedCount: number;
}

@Injectable()
export class AppService {
	constructor(private readonly drizzle: DrizzleService) {}

	getHello(): string {
		return "Hello World!";
	}

	async getDashboardStats(): Promise<DashboardStats> {
		// 获取今日开始和结束时间
		const today = new Date();
		const todayStart = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate(),
		);
		const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

		// 查询活跃的计划总数（enabled = 1）
		const [activeDutiesResult] = await this.drizzle.db
			.select({ count: count() })
			.from(dutiesTable)
			.where(eq(dutiesTable.enabled, 1));

		// 查询总值班人员数（去重）
		const [totalUsersResult] = await this.drizzle.db
			.select({ count: count() })
			.from(usersTable);

		// 查询通知模板总数
		const [totalTemplatesResult] = await this.drizzle.db
			.select({ count: count() })
			.from(templatesTable);

		// 查询今日推送的计划总数（lastRunTime在今日范围内且enabled=1）
		const [todayPushedResult] = await this.drizzle.db
			.select({ count: count() })
			.from(dutiesTable)
			.where(
				and(
					eq(dutiesTable.enabled, 1),
					gte(dutiesTable.lastRunTime, todayStart.toISOString()),
					lt(dutiesTable.lastRunTime, todayEnd.toISOString()),
				),
			);

		return {
			activeDutiesCount: activeDutiesResult.count,
			totalUsersCount: totalUsersResult.count,
			totalTemplatesCount: totalTemplatesResult.count,
			todayPushedCount: todayPushedResult.count,
		};
	}
}
