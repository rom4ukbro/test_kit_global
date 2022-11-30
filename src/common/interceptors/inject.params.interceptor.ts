import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class InjectParamsInterceptor implements NestInterceptor {
  constructor(private type?: NonNullable<'query' | 'body' | 'params'>) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    if (this.type && request[this.type]) {
      request[this.type]['params'] = request['params'];
    }
    return next.handle();
  }
}
