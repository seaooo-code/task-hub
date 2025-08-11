import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		let statusCode = 500;
		let message: string | string[] = "Internal server error";

		if (exception instanceof HttpException) {
			const exceptionResponse = exception.getResponse();
			statusCode = exception.getStatus();

			if (typeof exceptionResponse === "string") {
				message = exceptionResponse;
			} else if (typeof exceptionResponse === "object") {
				message =
					(exceptionResponse as { message: string | string[] })?.message ||
					exception.message;
			}
		}

		// 处理数组格式的 message
		if (Array.isArray(message)) {
			message = message.join("; ");
		}

		this.logger.error(
			`[${request.method}] ${request.url} -> ${statusCode} ${message}`,
		);

		response.status(statusCode).json({
			code: statusCode,
			message,
			path: request.url,
			timestamp: new Date().toISOString(),
		});
	}
}
