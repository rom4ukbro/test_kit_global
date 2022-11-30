import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { InjectJWTInterceptor } from '../interceptors/inject.jwt.interceptor';

export function InjectJWTToBody() {
  return applyDecorators(InjectJWTTo('body'));
}

export function InjectJWTTo(context: 'body') {
  return applyDecorators(UseInterceptors(new InjectJWTInterceptor(context)));
}
