import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { dutiesUsers, usersTable } from '../../drizzle/schema';
import { count, desc, eq, like, or, SQL } from 'drizzle-orm';

// 定义查询参数接口
export interface SearchUsersParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

// 定义分页结果接口
export interface PaginatedUsersResult {
  users: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    createAt: string;
    updateAt: string;
  }>;
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
export class UsersService {
  constructor(private readonly drizzle: DrizzleService) {}

  createUser(user: typeof usersTable.$inferInsert) {
    return this.drizzle.db
      .insert(usersTable)
      .values(user)
      .onDuplicateKeyUpdate({
        set: {
          name: user.name,
          avatar: user.avatar,
          email: user.email,
        },
      });
  }

  async searchUsers(
    params: SearchUsersParams = {},
  ): Promise<PaginatedUsersResult> {
    const { keyword = '', page = 1, pageSize = 10 } = params;

    // 参数验证
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(Math.max(1, pageSize), 100); // 限制最大页面大小为100
    const offset = (validPage - 1) * validPageSize;

    // 构建查询条件
    const whereConditions: Array<SQL | undefined> = [];

    if (keyword && keyword.trim()) {
      const searchTerm = `%${keyword.trim()}%`;
      whereConditions.push(
        or(
          like(usersTable.name, searchTerm),
          like(usersTable.email, searchTerm),
        ),
      );
    }

    // 构建基础查询
    const baseQuery = this.drizzle.db.select().from(usersTable);

    // 添加查询条件
    const queryWithConditions =
      whereConditions.length > 0
        ? baseQuery.where(or(...whereConditions))
        : baseQuery;

    // 执行查询 - 获取总数
    const [totalResult] = await this.drizzle.db
      .select({ count: count() })
      .from(usersTable)
      .where(whereConditions.length > 0 ? or(...whereConditions) : undefined);

    const total = totalResult.count;

    // 执行查询 - 获取分页数据
    const users = await queryWithConditions
      .orderBy(desc(usersTable.createAt))
      .limit(validPageSize)
      .offset(offset);

    // 计算分页信息
    const totalPages = Math.ceil(total / validPageSize);
    const hasNextPage = validPage < totalPages;
    const hasPrevPage = validPage > 1;

    return {
      users,
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

  async deleteUser(id: string) {
    // 首先检查用户是否在 dutiesUsers 关联表中存在
    const userInDuties = await this.drizzle.db
      .select()
      .from(dutiesUsers)
      .where(eq(dutiesUsers.userId, id))
      .limit(1);

    // 如果用户在关联表中存在，则不能删除
    if (userInDuties.length > 0) {
      throw new Error(
        '无法删除用户：该用户正在参与值班计划，请先从值班计划中移除该用户',
      );
    }

    // 如果不在关联表中，则可以删除用户
    return this.drizzle.db.delete(usersTable).where(eq(usersTable.id, id));
  }
}
