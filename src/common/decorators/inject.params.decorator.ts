import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { InjectParamsInterceptor } from '../interceptors/inject.params.interceptor';

export function InjectParamsToBody() {
  return applyDecorators(InjectParamsTo('body'));
}

export function InjectParamsTo(context: 'body') {
  return applyDecorators(UseInterceptors(new InjectParamsInterceptor(context)));
}
