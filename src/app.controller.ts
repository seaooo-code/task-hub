import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	@Get("dashboard")
	async getDashboard() {
		try {
			const stats = await this.appService.getDashboardStats();
			return {
				success: true,
				message: "获取仪表板数据成功",
				data: stats,
			};
		} catch (error) {
			throw new HttpException(
				{
					success: false,
					message: "获取仪表板数据失败",
					error: error.message,
				},
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
