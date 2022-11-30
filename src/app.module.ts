import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExceptionFilterTranslate } from './common/i18n/i18n.exception-filter';
import { I18nTsLoader } from './common/i18n/i18n.loader';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { LangEnum } from './common/enums/lang.enum';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    RedisModule.forRoot({
      config: [{ namespace: 'notify' }],
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    I18nModule.forRoot({
      fallbackLanguage: LangEnum.uk,
      fallbacks: {
        'uk-*': 'uk',
        'en-*': 'en',
        'ru-*': 'ru',
      },
      loaderOptions: {},
      loader: I18nTsLoader,
      resolvers: [AcceptLanguageResolver],
      logging: false,
    }),
    AuthModule,
    UsersModule,
    AppointmentsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_FILTER',
      useClass: ExceptionFilterTranslate,
    },
  ],
})
export class AppModule {}
