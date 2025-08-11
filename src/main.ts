import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalFilters(new AllExceptionsFilter());
	app.useGlobalPipes(new ValidationPipe());
	app.enableCors({
		origin: [
			"https://push-on-duty.be.xiaomiev.com",
			"http://localhost:3000",
			"http://127.0.0.1:3000",
		],
	});
	await app.listen(process.env.PORT ?? 3001);
}
bootstrap()
	.then(() => console.log("服务启动成功"))
	.catch((err) => console.log("服务启动失败", err));
