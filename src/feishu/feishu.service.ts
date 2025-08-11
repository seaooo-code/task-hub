import { HttpService } from "@nestjs/axios";
import {
	BadGatewayException,
	BadRequestException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { convertKeysToSnakeCase } from "../utils";
import type {
	AppAccessTokenResponse,
	BatchQueryUserResult,
	FeishuBaseResponse,
	GetChatsResult,
	GetDepartmentsByIdsResult,
	QueryUserResult,
	RefreshTokenResponse,
	RefreshTokenResult,
	SearchUserWithEmailResult,
	SendMessageParams,
	SuccessResponse,
	TenantAccessTokenResponse,
	UserAccessTokenResponse,
	UserInfoResponse,
} from "./feishu.types";

/**
 * 飞书 API 基础 URL 和端点配置
 */
const API_BASE_URL = "https://open.f.mioffice.cn/open-apis";
const API_ENDPOINTS = {
	// 认证相关端点
	TENANT_ACCESS_TOKEN: `${API_BASE_URL}/auth/v3/tenant_access_token/internal`,
	APP_ACCESS_TOKEN: `${API_BASE_URL}/auth/v3/app_access_token/internal`,
	USER_ACCESS_TOKEN: `${API_BASE_URL}/authen/v1/oidc/access_token`,
	REFRESH_ACCESS_TOKEN: `${API_BASE_URL}/authen/v1/oidc/refresh_access_token`,
	USER_INFO: `${API_BASE_URL}/authen/v1/user_info`,
	// 用户相关端点
	SEARCH_USER: `${API_BASE_URL}/search/v1/user`,
	BATCH_GET_USERS: `${API_BASE_URL}/contact/v3/users/batch`,
	// 部门相关端点
	BATCH_GET_DEPARTMENTS: `${API_BASE_URL}/contact/v3/departments/batch`,
	// 聊天相关端点
	GET_CHATS: `${API_BASE_URL}/im/v1/chats`,
	// 消息相关端点
	SEND_MESSAGE: `${API_BASE_URL}/im/v1/messages`,
};

/**
 * API 请求的默认请求头
 */
const DEFAULT_HEADERS = {
	"Content-Type": "application/json;charset=UTF-8",
};

/**
 * 飞书 API 交互服务
 */
@Injectable()
export class FeishuService {
	constructor(
		private readonly httpService: HttpService,
		private readonly config: ConfigService,
	) {}

	/**
	 * 创建带有令牌的授权请求头的辅助方法
	 */
	private createAuthHeaders(token: string): Record<string, string> {
		return {
			...DEFAULT_HEADERS,
			Authorization: `Bearer ${token}`,
		};
	}

	/**
	 * 统一处理 API 错误的辅助方法
	 */
	private handleApiError(
		response: FeishuBaseResponse,
		customMessage?: string,
	): void {
		switch (response.code) {
			case 0:
				break;
			case 20005:
				throw new UnauthorizedException("登录已过期");
			default:
				throw new BadGatewayException(
					`${customMessage || "API Error"}: ${response.msg}`,
				);
		}
	}

	/**
	 * 执行 API GET 请求的辅助方法
	 */
	private async apiGet<T>(
		url: string,
		headers: Record<string, string>,
	): Promise<T> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<T>(url, { headers }),
			);
			return response.data;
		} catch (error) {
			throw new BadGatewayException(
				`API request failed: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * 执行 API POST 请求的辅助方法
	 */
	private async apiPost<T>(
		url: string,
		data: Record<string, any>,
		headers: Record<string, string>,
	): Promise<T> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<T>(url, data, { headers }),
			);
			return response.data;
		} catch (error) {
			throw new BadGatewayException(
				`API request failed: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * 创建成功响应的辅助方法
	 */
	private createSuccessResponse<T>(data: T): SuccessResponse<T> {
		return {
			success: true,
			data,
		};
	}

	// ==================== 认证相关方法 ====================

	/**
	 * 获取租户访问令牌用于 API 调用
	 * @returns 租户访问令牌，如果请求失败则返回 null
	 */
	async getTenantAccessToken(): Promise<string | null> {
		try {
			const response = await this.apiPost<TenantAccessTokenResponse>(
				API_ENDPOINTS.TENANT_ACCESS_TOKEN,
				{
					app_id: this.config.get<string>("APP_ID"),
					app_secret: this.config.get<string>("APP_SECRET"),
				},
				DEFAULT_HEADERS,
			);

			return response.tenant_access_token || null;
		} catch (error) {
			console.error("Failed to get tenant access token:", error);
			return null;
		}
	}

	/**
	 * 获取应用访问令牌用于 API 调用
	 * @returns 应用访问令牌，如果请求失败则返回 null
	 */
	async getAppAccessToken(): Promise<string | null> {
		try {
			const response = await this.apiPost<AppAccessTokenResponse>(
				API_ENDPOINTS.APP_ACCESS_TOKEN,
				{
					app_id: this.config.get<string>("APP_ID"),
					app_secret: this.config.get<string>("APP_SECRET"),
				},
				DEFAULT_HEADERS,
			);

			return response.app_access_token || null;
		} catch (error) {
			console.error("Failed to get app access token:", error);
			return null;
		}
	}

	/**
	 * 使用授权码获取用户访问令牌
	 * @param code OAuth 流程中的授权码
	 * @returns 用户访问令牌响应
	 */
	async getUserAccessToken(code: string) {
		const appAccessToken = await this.getAppAccessToken();

		if (!appAccessToken) {
			throw new UnauthorizedException("无法获取应用访问令牌");
		}

		const response = await this.apiPost<UserAccessTokenResponse>(
			API_ENDPOINTS.USER_ACCESS_TOKEN,
			{
				grant_type: "authorization_code",
				code,
			},
			this.createAuthHeaders(appAccessToken),
		);

		this.handleApiError(response, "Failed to get user access token");
		return response;
	}

	/**
	 * 使用用户访问令牌获取用户信息
	 * @param userAccessToken 用户访问令牌
	 * @returns 用户信息
	 */
	async getUserInfoByUserAccessToken(userAccessToken: string) {
		const response = await this.apiGet<UserInfoResponse>(
			API_ENDPOINTS.USER_INFO,
			this.createAuthHeaders(userAccessToken),
		);

		this.handleApiError(response, "Failed to get user info");
		return response;
	}

	/**
	 * 使用刷新令牌刷新用户访问令牌
	 * @param refreshToken 刷新令牌
	 * @returns 新的令牌和过期信息
	 */
	async refreshUserAccessToken(
		refreshToken: string,
	): Promise<RefreshTokenResult> {
		if (!refreshToken?.trim()) {
			throw new BadRequestException("刷新令牌不能为空");
		}

		const appAccessToken = await this.getAppAccessToken();

		if (!appAccessToken) {
			throw new UnauthorizedException("无法获取应用访问令牌");
		}

		const response = await this.apiPost<RefreshTokenResponse>(
			API_ENDPOINTS.REFRESH_ACCESS_TOKEN,
			{
				grant_type: "refresh_token",
				refresh_token: refreshToken,
			},
			this.createAuthHeaders(appAccessToken),
		);

		this.handleApiError(response, "刷新用户访问令牌失败");

		if (!response.data?.access_token) {
			throw new BadGatewayException("刷新令牌响应数据无效");
		}

		return response.data;
	}

	// ==================== 消息相关方法 ====================

	/**
	 * 发送消息到飞书群聊
	 * @param params 消息参数 (receiveId, msgType, content)
	 * @returns API 响应
	 */
	async sendMessage(params: SendMessageParams): Promise<FeishuBaseResponse> {
		const tenantAccessToken = await this.getTenantAccessToken();

		if (!tenantAccessToken) {
			throw new UnauthorizedException("无法获取租户访问令牌");
		}

		const response = await this.apiPost<FeishuBaseResponse>(
			`${API_ENDPOINTS.SEND_MESSAGE}?receive_id_type=chat_id`,
			convertKeysToSnakeCase(params),
			this.createAuthHeaders(tenantAccessToken),
		);

		this.handleApiError(response, "Failed to send message");
		return response;
	}

	// ==================== 用户相关方法 ====================

	/**
	 * 根据查询字符串搜索用户
	 * @param params 搜索参数 (query, token)
	 * @returns 包含邮箱信息的用户列表
	 */
	async searchUser(params: {
		query: string;
		token: string;
	}): Promise<SearchUserWithEmailResult> {
		// 步骤 1: 使用提供的令牌搜索用户
		const searchResponse = await this.apiGet<QueryUserResult>(
			`${API_ENDPOINTS.SEARCH_USER}?query=${params.query}&page_size=20`,
			this.createAuthHeaders(params.token),
		);

		this.handleApiError(searchResponse, "搜索用户失败");

		const users = searchResponse.data?.users || [];

		// 如果没有找到用户，返回空结果
		if (users.length === 0) {
			return { users: [] };
		}

		// 步骤 2: 获取租户访问令牌用于批量查询
		const tenantAccessToken = await this.getTenantAccessToken();

		if (!tenantAccessToken) {
			throw new UnauthorizedException("无法获取租户访问令牌");
		}

		// 步骤 3: 批量查询用户详情（包括邮箱）
		const userIds = users.map((user) => user.open_id);
		const query = userIds.map((userId) => `user_ids=${userId}`).join("&");

		const batchResponse = await this.apiGet<BatchQueryUserResult>(
			`${API_ENDPOINTS.BATCH_GET_USERS}?${query}`,
			this.createAuthHeaders(tenantAccessToken),
		);

		this.handleApiError(batchResponse, "批量查询用户详情失败");

		const userDetails = batchResponse.data?.items || [];

		// 步骤 4: 获取部门信息
		const departmentIds = userDetails
			.map((user) => user.department_ids?.[0])
			.filter(Boolean);

		// 去除重复的部门ID
		const uniqueDepartmentIds = [...new Set(departmentIds)];

		// 获取部门信息
		const departmentsResponse =
			await this.getDepartmentsByIds(uniqueDepartmentIds);

		// 创建部门映射表
		const departmentMap = new Map<string, string>();
		departmentsResponse.data?.items?.forEach((dept) => {
			departmentMap.set(dept.open_department_id, dept.name);
		});

		// 步骤 5: 组合数据并过滤没有邮箱的用户
		const combinedUsers = users
			.map((searchUser) => {
				const detail = userDetails.find(
					(d) => d.open_id === searchUser.open_id,
				);
				return {
					id: searchUser.open_id,
					name: searchUser.name,
					email: detail?.email || "",
					avatar: detail?.avatar?.avatar_origin || "",
					city: detail?.city || "",
					description: detail?.description || "",
					departmentId: detail?.department_ids?.[0] || "",
					departmentName:
						departmentMap.get(detail?.department_ids?.[0] || "") || "未知部门",
				};
			})
			.filter((user) => user.email && user.email.trim() !== ""); // 过滤没有邮箱的用户

		return { users: combinedUsers };
	}

	// ==================== 聊天相关方法 ====================

	/**
	 * 获取聊天列表
	 * @returns 聊天列表
	 */
	async getChats(): Promise<SuccessResponse<GetChatsResult["data"]>> {
		const tenantAccessToken = await this.getTenantAccessToken();

		if (!tenantAccessToken) {
			throw new Error("无法获取访问令牌");
		}

		const response = await this.apiGet<GetChatsResult>(
			API_ENDPOINTS.GET_CHATS,
			this.createAuthHeaders(tenantAccessToken),
		);

		this.handleApiError(response, "Failed to get chats");

		return this.createSuccessResponse(response.data);
	}

	// ==================== 部门相关方法 ====================

	/**
	 * 根据 ID 获取部门信息
	 * @param ids 部门 ID 列表
	 * @returns 部门信息
	 */
	async getDepartmentsByIds(
		ids: string[],
	): Promise<SuccessResponse<GetDepartmentsByIdsResult["data"]>> {
		const tenantAccessToken = await this.getTenantAccessToken();

		if (!tenantAccessToken) {
			throw new Error("无法获取访问令牌");
		}

		const queryParams = ids?.map((id) => `department_ids=${id}`)?.join("&");
		const response = await this.apiGet<GetDepartmentsByIdsResult>(
			`${API_ENDPOINTS.BATCH_GET_DEPARTMENTS}?${queryParams}`,
			this.createAuthHeaders(tenantAccessToken),
		);

		this.handleApiError(response, "Failed to get departments");

		return this.createSuccessResponse(response.data);
	}
}
