import { Injectable, Logger } from "@nestjs/common";
import  { ConfigService } from "@nestjs/config";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";

@Injectable()
export class DrizzleService {
	public db: MySql2Database;
	private readonly logger = new Logger(DrizzleService.name);

	constructor(private readonly config: ConfigService) {
		try {
			this.db = drizzle(this.config.get<string>("DATABASE_URL", ""));
		} catch (error) {
			this.logger.error("数据库连接错误:", error);
		}
	}
}
