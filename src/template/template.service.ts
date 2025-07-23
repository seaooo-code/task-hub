import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { count, desc, like, or, SQL } from 'drizzle-orm';
import { templatesTable } from '../../drizzle/schema';
interface SearchTemplatesParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedTemplatesResult {
  templates: any[];
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
    const { keyword = '', page = 1, pageSize = 10 } = params;

    // 参数验证
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(Math.max(1, pageSize), 100);
    const offset = (validPage - 1) * validPageSize;

    // 构建查询条件
    const whereConditions: Array<SQL | undefined> = [];

    if (keyword && keyword.trim()) {
      const searchTerm = `%${keyword.trim()}%`;
      whereConditions.push(like(templatesTable.name, searchTerm));
    }

    // 执行查询 - 获取总数
    const [totalResult] = await this.drizzle.db
      .select({ count: count() })
      .from(templatesTable)
      .where(whereConditions.length > 0 ? or(...whereConditions) : undefined);

    const total = totalResult.count;

    // 执行查询 - 获取分页数据
    const templates = await this.drizzle.db
      .select()
      .from(templatesTable)
      .where(whereConditions.length > 0 ? or(...whereConditions) : undefined)
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
}
