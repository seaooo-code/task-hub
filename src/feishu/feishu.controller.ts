import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Query,
} from '@nestjs/common';
import { FeishuService } from './feishu.service';

@Controller('feishu')
export class FeishuController {
  constructor(private readonly feishu: FeishuService) {}

  @Get('search')
  searchUser(@Headers('Token') token: string, @Query('query') query: string) {
    return this.feishu.searchUser({ query: query || '杨晨辉', token });
  }

  @Get('chats')
  getChats() {
    return this.feishu.getChats();
  }

  @Get('user-access-token')
  getUserAccessToken(@Query('code') code: string) {
    return this.feishu.getUserAccessToken(code);
  }

  @Get('user-info')
  getUserInfoByUserAccessToken(@Headers('token') token: string) {
    return this.feishu.getUserInfoByUserAccessToken(token);
  }

  @Get('refresh-token')
  async refreshToken(@Headers('refresh_token') token: string) {
    if (!token) {
      throw new BadRequestException('缺少刷新令牌');
    }

    try {
      const result = await this.feishu.refreshUserAccessToken(token);
      return {
        success: true,
        data: result,
        message: '令牌刷新成功',
      };
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : '未知错误',
      };
    }
  }
}
