import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { FeishuController } from "./feishu.controller";
import { FeishuService } from "./feishu.service";

@Module({
	imports: [HttpModule],
	providers: [FeishuService],
	exports: [FeishuService],
	controllers: [FeishuController],
})
export class FeishuModule {}
