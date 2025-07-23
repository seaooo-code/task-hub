import { Controller, Get, Query } from '@nestjs/common';
import { TemplateService } from './template.service';

@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}
  @Get('search')
  searchTemplates(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const searchParams = {
      keyword: keyword || '',
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    };

    // 参数验证
    if (searchParams.page < 1) {
      return { success: false, message: '页码必须大于0' };
    }

    if (searchParams.pageSize < 1 || searchParams.pageSize > 100) {
      return { success: false, message: '每页数量必须在1-100之间' };
    }

    return this.templateService.searchTemplates(searchParams);
  }
}
