import {
  Catch,
  ExceptionFilter,
  HttpException,
  ArgumentsHost,
} from '@nestjs/common';
import { getI18nContextFromArgumentsHost } from 'nestjs-i18n';

@Catch(HttpException)
export class ExceptionFilterTranslate implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const i18n = getI18nContextFromArgumentsHost(host);
    const response = host.switchToHttp().getResponse<any>();

    const status = exception.getStatus();

    response.status(status).send({
      statusCode: status,
      message: i18n.translate(exception.message, {
        lang: i18n.lang,
      }),
    });
  }
}
