import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch() // 不写具体类 => 捕获所有异常
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    /* ① 判断类型 */
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    /* ② 规范化错误对象（可以扩展 code、traceId 等字段） */
    const message = isHttpException
      ? exception.message
      : 'Internal server error';

    const stack = exception instanceof Error ? exception.stack : undefined;

    /* ③ 统一日志输出 */
    this.logger.error(
      `[${request.method}] ${request.url} -> ${status} ${message}`,
      stack,
    );

    /* ④ 返回统一响应结构 */
    response.status(status).json({
      code: status, // 业务可替换为自定义 errorCode
      message,
      data: null,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
