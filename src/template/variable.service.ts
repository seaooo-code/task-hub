import { Injectable, NotFoundException } from "@nestjs/common";
import { addWeeks, format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { templatesTable } from "../../drizzle/schema";
import { DrizzleService } from "../drizzle/drizzle.service";
import { DutiesService } from "../duties/duties.service";

@Injectable()
export class TemplateVariablesService {
	constructor(
		private readonly dutiesService: DutiesService,
		private readonly drizzle: DrizzleService,
	) {}

	/**
	 * 根据模板 ID 查询模板数据并获取对应的模板变量
	 */
	async getTemplateVariables(
		planId: number,
		templateId: string,
	): Promise<{
		template_id: string;
		template_variable: Record<string, string>;
	}> {
		// 根据 templateId 查询模板数据
		const templates = await this.drizzle.db
			.select()
			.from(templatesTable)
			.where(eq(templatesTable.id, templateId))
			.limit(1);

		if (templates.length === 0) {
			throw new NotFoundException(`未找到ID为 ${templateId} 的模板`);
		}

		const templateItem = templates[0];
		// 获取值班用户信息
		const dutyUserInfo = await this.dutiesService.getDutyUserInfo(planId);
		const { currentUserId, nextUserId } = dutyUserInfo;

		const today = new Date();
		const nextWeek = addWeeks(today, 1);

		// 定义可用的变量映射
		const variableMap: Record<string, string> = {
			// 用户ID
			currentUserId: currentUserId.toString(),
			nextUserId: nextUserId.toString(),

			// @ 用户格式
			atCurrentUser: `<at id=${currentUserId}></at>`,
			atNextUser: `<at id=${nextUserId}></at>`,
			// 日期相关
			date: format(today, "yyyy年M月d日", { locale: zhCN }),
			dayOfWeek: format(today, "EEEE", { locale: zhCN }),
			nextDate: format(nextWeek, "yyyy年M月d日", { locale: zhCN }),
		};

		// 根据 vars 字段进行映射
		const template_variable: Record<string, string> = {};
		if (templateItem.vars && typeof templateItem.vars === "object") {
			for (const [key, variableName] of Object.entries(templateItem.vars)) {
				const varName = String(variableName);
				if (variableMap[varName]) {
					template_variable[key] = variableMap[varName];
				} else {
					// 如果找不到对应的变量，使用原值或空字符串
					template_variable[key] = varName;
				}
			}
		}

		return { template_id: templateId, template_variable };
	}
}
