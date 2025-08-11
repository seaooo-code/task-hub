/**
 * 飞书 API 基础响应接口
 */
export interface FeishuBaseResponse {
  code: number;
  msg: string;
}

/**
 * 用户相关接口
 */
export interface QueryUserResult extends FeishuBaseResponse {
  data?: {
    users: {
      open_id: string;
      name: string;
    }[];
  };
}

export interface BatchQueryUserResult extends FeishuBaseResponse {
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
      department_ids: string[];
    }[];
  };
}

export interface SearchUserWithEmailResult {
  users: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    city?: string;
    departmentId?: string;
    departmentName?: string;
  }[];
}

/**
 * 聊天相关接口
 */
export interface GetChatsResult extends FeishuBaseResponse {
  data?: {
    items: {
      avatar: string;
      chat_id: string;
      name: string;
    }[];
  };
}

/**
 * 部门相关接口
 */
export interface GetDepartmentsByIdsResult extends FeishuBaseResponse {
  data?: {
    items: {
      open_department_id: string;
      name: string;
    }[];
  };
}

/**
 * 认证相关接口
 */
export interface TenantAccessTokenResponse extends FeishuBaseResponse {
  expire: number;
  tenant_access_token: string;
}

export interface AppAccessTokenResponse extends FeishuBaseResponse {
  expire: number;
  app_access_token: string;
}

export interface UserAccessTokenResponse extends FeishuBaseResponse {
  data: {
    access_token: string;
    refresh_token: string;
  };
}

export interface UserInfoResponse extends FeishuBaseResponse {
  data: {
    name: string;
    avatar_url: string;
    email: string;
  };
}

export interface RefreshTokenResponse extends FeishuBaseResponse {
  data?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
    token_type: string;
    scope: string;
  };
}

export interface RefreshTokenResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * 消息相关接口
 */
export interface SendMessageParams {
  receiveId: string;
  msgType: string;
  content: string;
}

// 发送消息响应直接使用基础响应接口

/**
 * API 响应包装器
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}
