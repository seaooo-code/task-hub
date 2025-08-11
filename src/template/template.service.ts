import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { count, desc, eq, like, or, type SQL } from "drizzle-orm";
import { dutiesTable, templatesTable } from "../../drizzle/schema";
import { DrizzleService } from "../drizzle/drizzle.service";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { UpdateTemplateDto } from "./dto/update-template.dto";

interface SearchTemplatesParams {
	keyword?: string;
	page?: number;
	pageSize?: number;
}

type Template = typeof templatesTable.$inferSelect;
type TemplateWithDutyCount = Template & { dutyCount: number };

export interface PaginatedTemplatesResult {
	templates: TemplateWithDutyCount[];
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
export class TemplateService {
	constructor(private readonly drizzle: DrizzleService) {}

	async searchTemplates(
		params: SearchTemplatesParams = {},
	): Promise<PaginatedTemplatesResult> {
		const { keyword = "", page = 1, pageSize = 10 } = params;

		// 参数验证
		const validPage = Math.max(1, page);
		const validPageSize = Math.min(Math.max(1, pageSize), 100);
		const offset = (validPage - 1) * validPageSize;

		// 构建查询条件
		const whereConditions: Array<SQL | undefined> = [];

		if (keyword?.trim()) {
			const searchTerm = `%${keyword.trim()}%`;
			whereConditions.push(like(templatesTable.name, searchTerm));
		}

		// 执行查询 - 获取总数
		const [totalResult] = await this.drizzle.db
			.select({ count: count() })
			.from(templatesTable)
			.where(whereConditions.length > 0 ? or(...whereConditions) : undefined);

		const total = totalResult.count;

		// 执行查询 - 获取分页数据，包含duty引用数量
		const templates = await this.drizzle.db
			.select({
				id: templatesTable.id,
				name: templatesTable.name,
				createAt: templatesTable.createAt,
				updateAt: templatesTable.updateAt,
				imageUrl: templatesTable.imageUrl,
				vars: templatesTable.vars,
				dutyCount: count(dutiesTable.id),
			})
			.from(templatesTable)
			.leftJoin(dutiesTable, eq(templatesTable.id, dutiesTable.templateId))
			.where(whereConditions.length > 0 ? or(...whereConditions) : undefined)
			.groupBy(templatesTable.id)
			.orderBy(desc(templatesTable.createAt))
			.limit(validPageSize)
			.offset(offset);

		// 计算分页信息
		const totalPages = Math.ceil(total / validPageSize);
		const hasNextPage = validPage < totalPages;
		const hasPrevPage = validPage > 1;

		return {
			templates,
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

	async createTemplate(
		createTemplateDto: CreateTemplateDto,
	): Promise<Template> {
		const { id, name, imageUrl, vars } = createTemplateDto;

		// 插入新模板
		await this.drizzle.db.insert(templatesTable).values({
			id,
			name,
			imageUrl,
			vars: vars || null,
		});

		// 查询并返回创建的模板
		const [createdTemplate] = await this.drizzle.db
			.select()
			.from(templatesTable)
			.where(eq(templatesTable.id, id));

		return createdTemplate;
	}

	async getTemplateById(id: string): Promise<Template> {
		const [template] = await this.drizzle.db
			.select()
			.from(templatesTable)
			.where(eq(templatesTable.id, id));

		if (!template) {
			throw new NotFoundException("模板不存在");
		}

		return template;
	}

	async updateTemplate(
		updateTemplateDto: UpdateTemplateDto,
	): Promise<Template> {
		// 检查模板是否存在
		const existingTemplate = await this.getTemplateById(updateTemplateDto.id);

		// 构建更新数据，只更新提供的字段
		const updateData: Partial<typeof templatesTable.$inferInsert> = {};

		if (updateTemplateDto.name !== undefined) {
			updateData.name = updateTemplateDto.name;
		}

		if (updateTemplateDto.imageUrl !== undefined) {
			updateData.imageUrl = updateTemplateDto.imageUrl;
		}

		if (updateTemplateDto.vars !== undefined) {
			updateData.vars = updateTemplateDto.vars;
		}

		// 如果没有需要更新的字段，直接返回原模板
		if (Object.keys(updateData).length === 0) {
			return existingTemplate;
		}

		// 执行更新
		await this.drizzle.db
			.update(templatesTable)
			.set(updateData)
			.where(eq(templatesTable.id, updateTemplateDto.id));

		// 查询并返回更新后的模板
		const [updatedTemplate] = await this.drizzle.db
			.select()
			.from(templatesTable)
			.where(eq(templatesTable.id, updateTemplateDto.id));

		return updatedTemplate;
	}

	async deleteTemplate(id: string): Promise<void> {
		// 检查模板是否存在
		await this.getTemplateById(id);

		// 检查模板是否被使用
		const [dutyCountResult] = await this.drizzle.db
			.select({ count: count() })
			.from(dutiesTable)
			.where(eq(dutiesTable.templateId, id));

		if (dutyCountResult.count > 0) {
			throw new BadRequestException(
				`模板正在被 ${dutyCountResult.count} 个任务使用，无法删除`,
			);
		}

		// 删除模板
		await this.drizzle.db
			.delete(templatesTable)
			.where(eq(templatesTable.id, id));
	}
}
