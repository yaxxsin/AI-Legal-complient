import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

interface StandardResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Wraps all controller responses in the standard format:
 * { success: true, data: {...}, meta: {...} }
 */
@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If already has success property, pass through (e.g. paginated responses)
        if (data && typeof data === 'object' && 'success' in data) {
          return data as unknown as StandardResponse<T>;
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
