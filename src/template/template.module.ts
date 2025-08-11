import { forwardRef, Module } from "@nestjs/common";
import { DutiesModule } from "../duties/duties.module";
import { TemplateController } from "./template.controller";
import { TemplateService } from "./template.service";
import { TemplateVariablesService } from "./variable.service";

@Module({
	imports: [forwardRef(() => DutiesModule)],
	providers: [TemplateService, TemplateVariablesService],
	controllers: [TemplateController],
	exports: [TemplateVariablesService],
})
export class TemplateModule {}
