import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DrizzleModule } from "./drizzle/drizzle.module";
import { DutiesModule } from "./duties/duties.module";
import { FeishuModule } from "./feishu/feishu.module";
import { TasksModule } from "./tasks/tasks.module";
import { TemplateModule } from "./template/template.module";
import { UsersModule } from "./users/users.module";

@Module({
	imports: [
		ScheduleModule.forRoot(),
		ConfigModule.forRoot({
			envFilePath: [".env.local"],
			isGlobal: true,
		}),
		DrizzleModule,
		TasksModule,
		FeishuModule,
		UsersModule,
		DutiesModule,
		TemplateModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
