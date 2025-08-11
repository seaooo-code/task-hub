import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
} from "@nestjs/common";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { UpdateTemplateDto } from "./dto/update-template.dto";
import { TemplateService } from "./template.service";

@Controller("templates")
export class TemplateController {
	constructor(private readonly templateService: TemplateService) {}
	@Get("search")
	searchTemplates(
		@Query("keyword") keyword?: string,
		@Query("page") page?: string,
		@Query("pageSize") pageSize?: string,
	) {
		const searchParams = {
			keyword: keyword || "",
			page: page ? parseInt(page, 10) : 1,
			pageSize: pageSize ? parseInt(pageSize, 10) : 10,
		};

		// 参数验证
		if (searchParams.page < 1) {
			return { success: false, message: "页码必须大于0" };
		}

		if (searchParams.pageSize < 1 || searchParams.pageSize > 100) {
			return { success: false, message: "每页数量必须在1-100之间" };
		}

		return this.templateService.searchTemplates(searchParams);
	}

	@Post("create")
	async createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
		const template =
			await this.templateService.createTemplate(createTemplateDto);
		return {
			success: true,
			message: "模板创建成功",
			data: template,
		};
	}

	@Get(":id")
	async getTemplateById(@Param("id") id: string) {
		const template = await this.templateService.getTemplateById(id);
		return {
			success: true,
			message: "获取模板详情成功",
			data: template,
		};
	}

	@Put("update")
	async updateTemplate(@Body() updateTemplateDto: UpdateTemplateDto) {
		const template =
			await this.templateService.updateTemplate(updateTemplateDto);
		return {
			success: true,
			message: "模板更新成功",
			data: template,
		};
	}

	@Delete(":id")
	async deleteTemplate(@Param("id") id: string) {
		await this.templateService.deleteTemplate(id);
		return {
			success: true,
			message: "模板删除成功",
		};
	}
}
