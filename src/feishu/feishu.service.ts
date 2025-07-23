import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { convertKeysToSnakeCase } from '../utils';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface Base {
  code: number;
  msg: string;
}

interface QueryUserResult extends Base {
  data?: {
    users: {
      open_id: string;
      name: string;
    }[];
  };
}

interface BatchQueryUserResult extends Base {
  data?: {
    items: {
      name: string;
      en_name: string;
      open_id: string;
      avatar: { avatar_origin: string };
      email: string;
      gender: 1 | 0;
      description: string;
      employee_no: string;
      city: string;
      status: number;
    }[];
  };
}

// 定义完整的搜索用户结果接口
export interface SearchUserWithEmailResult {
  users: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }[];
}

interface GetChatsResult extends Base {
  data?: {
    items: {
      avatar: string;
      chat_id: string;
      name: string;
    }[];
  };
}

// 定义刷新令牌的响应接口
interface RefreshTokenResponse extends Base {
  data?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
    token_type: string;
    scope: string;
  };
}

// 定义刷新令牌的结果接口
export interface RefreshTokenResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
}

@Injectable()
export class FeishuService {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  async getTenantAccessToken(): Promise<string | null> {
    const response = await firstValueFrom(
      this.httpService.post<{
        code: number;
        expire: number;
        msg: string;
        tenant_access_token: string;
      }>(
        'https://open.f.mioffice.cn/open-apis/auth/v3/tenant_access_token/internal',
        {
          app_id: this.config.get<string>('APP_ID'),
          app_secret: this.config.get<string>('APP_SECRET'),
        },
      ),
    );

    return response.data?.tenant_access_token || null;
  }

  async getAppAccessToken(): Promise<string | null> {
    const response = await firstValueFrom(
      this.httpService.post<{
        code: number;
        expire: number;
        msg: string;
        app_access_token: string;
      }>(
        'https://open.f.mioffice.cn/open-apis/auth/v3/app_access_token/internal',
        {
          app_id: this.config.get<string>('APP_ID'),
          app_secret: this.config.get<string>('APP_SECRET'),
        },
      ),
    );

    return response.data?.app_access_token || null;
  }

  async getUserAccessToken(code: string) {
    const appAccessToken = await this.getAppAccessToken();

    if (!appAccessToken) {
      throw new Error('无法获取应用访问令牌');
    }

    const response = await firstValueFrom(
      this.httpService.post<{
        code: number;
        msg: string;
        data: {
          access_token: string;
          refresh_token: string;
        };
      }>(
        'https://open.f.mioffice.cn/open-apis/authen/v1/oidc/access_token',
        {
          grant_type: 'authorization_code',
          code,
        },
        {
          headers: {
            Authorization: 'Bearer ' + appAccessToken,
            'Content-Type': 'application/json;charset=UTF-8',
          },
        },
      ),
    );

    return response.data;
  }

  async getUserInfoByUserAccessToken(userAccessToken: string) {
    const response = await firstValueFrom(
      this.httpService.get<{
        code: number;
        msg: string;
        data: {
          name: string;
          avatar_url: string;
          email: string;
        };
      }>('https://open.f.mioffice.cn/open-apis/authen/v1/user_info', {
        headers: {
          Authorization: 'Bearer ' + userAccessToken,
          'Content-Type': 'application/json;charset=UTF-8',
        },
      }),
    );

    return response.data;
  }

  async refreshUserAccessToken(
    refreshToken: string,
  ): Promise<RefreshTokenResult> {
    if (!refreshToken?.trim()) {
      throw new Error('刷新令牌不能为空');
    }

    const appAccessToken = await this.getAppAccessToken();

    if (!appAccessToken) {
      throw new Error('无法获取应用访问令牌');
    }

    const response = await firstValueFrom(
      this.httpService.post<RefreshTokenResponse>(
        'https://open.f.mioffice.cn/open-apis/authen/v1/oidc/refresh_access_token',
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
        {
          headers: {
            Authorization: `Bearer ${appAccessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      ),
    );

    if (response.data.code !== 0) {
      throw new Error(`刷新用户访问令牌失败: ${response.data.msg}`);
    }

    if (!response.data.data?.access_token) {
      throw new Error('刷新令牌响应数据无效');
    }

    return response.data.data;
  }

  /**
   * 向机器人发送飞书消息
   * @param params
   */
  async sendMessage(params: {
    receiveId: string;
    msgType: string;
    content: string;
  }): Promise<any> {
    const tenantAccessToken = await this.getTenantAccessToken();

    if (!tenantAccessToken) {
      throw new Error('无法获取租户访问令牌');
    }

    const response = await firstValueFrom(
      this.httpService.post<{
        code: number;
        msg: string;
      }>(
        'https://open.f.mioffice.cn/open-apis/im/v1/messages?receive_id_type=chat_id',
        convertKeysToSnakeCase(params),
        {
          headers: {
            Authorization: 'Bearer ' + tenantAccessToken,
            'Content-Type': 'application/json;charset=UTF-8',
          },
        },
      ),
    );

    return response.data;
  }

  async searchUser(params: {
    query: string;
    token: string;
  }): Promise<SearchUserWithEmailResult> {
    // 第一步：使用传入的 ak 搜索用户
    const searchResponse = await firstValueFrom(
      this.httpService.get<QueryUserResult>(
        `https://open.f.mioffice.cn/open-apis/search/v1/user?query=${params.query}&page_size=20`,
        {
          headers: {
            Authorization: `Bearer ${params.token}`,
            'Content-Type': 'application/json;charset=UTF-8',
          },
        },
      ),
    );

    // 验证搜索响应
    if (searchResponse.data.code !== 0) {
      throw new Error(`搜索用户失败: ${searchResponse.data.msg}`);
    }

    const users = searchResponse.data.data?.users || [];

    // 如果没有搜索到用户，直接返回空结果
    if (users.length === 0) {
      return {
        users: [],
      };
    }

    // 第二步：获取 tenantAccessToken 用于批量查询邮箱
    const tenantAccessToken = await this.getTenantAccessToken();

    if (!tenantAccessToken) {
      throw new Error('无法获取租户访问令牌');
    }

    // 第三步：使用 tenantAccessToken 批量查询用户详细信息（包含邮箱）
    const userIds = users.map((user) => user.open_id);
    const query = userIds.map((userId) => `user_ids=${userId}`).join('&');

    const batchResponse = await firstValueFrom(
      this.httpService.get<BatchQueryUserResult>(
        `https://open.f.mioffice.cn/open-apis/contact/v3/users/batch?${query}`,
        {
          headers: {
            Authorization: `Bearer ${tenantAccessToken}`,
            'Content-Type': 'application/json;charset=UTF-8',
          },
        },
      ),
    );

    // 验证批量查询响应
    if (batchResponse.data.code !== 0) {
      throw new Error(`批量查询用户详情失败: ${batchResponse.data.msg}`);
    }

    const userDetails = batchResponse.data.data?.items || [];

    // 第四步：组合数据，合并搜索结果和详细信息
    const combinedUsers = users
      .map((searchUser) => {
        const detail = userDetails.find(
          (d) => d.open_id === searchUser.open_id,
        );
        return {
          id: searchUser.open_id,
          name: searchUser.name,
          email: detail?.email || '',
          avatar: detail?.avatar?.avatar_origin || '',
        };
      })
      .filter((user) => user.email && user.email.trim() !== ''); // 过滤掉没有邮箱的用户

    return {
      users: combinedUsers,
    };
  }

  async getChats() {
    const tenantAccessToken = await this.getTenantAccessToken();

    if (!tenantAccessToken) {
      throw new Error('无法获取访问令牌');
    }

    const response = await firstValueFrom(
      this.httpService.get<GetChatsResult>(
        'https://open.f.mioffice.cn/open-apis/im/v1/chats',
        {
          headers: {
            Authorization: `Bearer ${tenantAccessToken}`,
            'Content-Type': 'application/json;charset=UTF-8',
          },
        },
      ),
    );

    if (response.data.code !== 0) {
      throw new Error(`API 错误: ${response.data.msg}`);
    }

    return {
      success: true,
      data: response.data.data,
    };
  }
}
