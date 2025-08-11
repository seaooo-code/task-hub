import { forwardRef, Module } from "@nestjs/common";
import { TasksModule } from "../tasks/tasks.module";
import { DutiesController } from "./duties.controller";
import { DutiesService } from "./duties.service";

@Module({
	imports: [forwardRef(() => TasksModule)],
	providers: [DutiesService],
	controllers: [DutiesController],
	exports: [DutiesService],
})
export class DutiesModule {}
