import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const prefix = `${request.method} ${request.url}`;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? (exceptionResponse as { message?: unknown }).message
          : exceptionResponse;

      if (status >= 500) {
        this.logger.error(`${prefix} → ${status}`, exception.stack);
      } else {
        this.logger.warn(`${prefix} → ${status}: ${JSON.stringify(message)}`);
      }

      // Extra fields such as `code` (e.g. INSUFFICIENT_COINS) and its details go to the client too.
      const { message: _m, statusCode: _s, error: _e, ...extra } =
        typeof exceptionResponse === 'object' && exceptionResponse !== null ? (exceptionResponse as Record<string, unknown>) : {};

      response.status(status).json({
        success: false,
        message,
        ...extra,
      });
      return;
    }

    this.logger.error(
      `${prefix} → ${HttpStatus.INTERNAL_SERVER_ERROR}: Unhandled exception`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
