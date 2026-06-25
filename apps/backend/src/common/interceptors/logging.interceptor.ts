import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req   = context.switchToHttp().getRequest();
    const start = Date.now();
    const { method, url } = req;

    return next.handle().pipe(
      tap({
        next: () => {
          const status = context.switchToHttp().getResponse().statusCode;
          const ms     = Date.now() - start;
          this.logger.log(`${method} ${url} ${status} +${ms}ms`);
        },
        error: () => {
          const ms = Date.now() - start;
          this.logger.warn(`${method} ${url} ERROR +${ms}ms`);
        },
      }),
    );
  }
}
