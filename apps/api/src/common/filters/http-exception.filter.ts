import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown[];
}

/**
 * Global exception filter — ensures all errors return the standard format:
 * { success: false, error: { code, message, details } }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error: ErrorBody = {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        error = { code: this.statusToCode(status), message: exResponse };
      } else if (typeof exResponse === 'object') {
        const obj = exResponse as Record<string, unknown>;
        error = {
          code: (obj.code as string) ?? this.statusToCode(status),
          message: (obj.message as string) ?? exception.message,
          details: obj.details as unknown[] | undefined,
        };
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      success: false,
      error,
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'AUTH_REQUIRED',
      403: 'FORBIDDEN',
      404: 'RESOURCE_NOT_FOUND',
      409: 'DUPLICATE_ENTRY',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
    };
    return map[status] ?? 'INTERNAL_ERROR';
  }
}
