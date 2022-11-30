import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { I18nService } from 'nestjs-i18n';
import { LoggerService } from 'nest-logger';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import * as moment from 'moment';
import 'moment-timezone';
import { FilterAppointmentDto } from '../appointments/dtos/filter-appointment.dto';
import { PaginationParams } from '../common/params/pagination.params';
import { AppointmentsService } from '../appointments/appointments.service';

@Injectable()
export class NotificationsCronService {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly i18nService: I18nService,
    @InjectRedis('notify') private readonly redis: Redis,
    private readonly logger: LoggerService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async notifyOneDay() {
    const tomorrow = moment().tz('Europe/Kyiv').add(1, 'days');
    const minDate = tomorrow
      .hour(2)
      .minute(0)
      .second(0)
      .millisecond(0)
      .format();
    const maxDate = tomorrow
      .add(1, 'days')
      .hour(1)
      .minute(59)
      .second(59)
      .millisecond(999)
      .format();

    try {
      const filter: PaginationParams & FilterAppointmentDto = {
        page: 1,
        limit: 30,
        sort: '-createdAt',
        minDate: new Date(minDate),
        maxDate: new Date(maxDate),
        active: true,
      };

      const { models: appointments } = await this.appointmentsService.findAll(
        filter,
      );

      for (const appointment of appointments) {
        const appointmentCache = await this.redis.get(
          `notify:oneDay:${appointment.id}`,
        );
        if (appointmentCache) continue;

        this.logger.log(
          this.i18nService.translate('notify.users.oneDay', {
            lang: appointment.user.lang,
            args: {
              current_date: new Date().toLocaleDateString(),
              ...appointment,
              date: moment(appointment.date).tz('Europe/Kyiv').format('hh:mm'),
            },
          }),
        );
        await this.redis.set(`notify:oneDay:${appointment.id}`, 1);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async notifyTwoHours() {
    const date = new Date();
    date.setHours(date.getHours() + 4);
    const minDate = new Date(
      date.toISOString().substring(0, 14) + '00:00.000Z',
    );
    const maxDate = new Date(
      date.toISOString().substring(0, 14) + '59:59.999Z',
    );

    try {
      const filter: PaginationParams & FilterAppointmentDto = {
        page: 1,
        limit: 30,
        sort: '-createdAt',
        minDate: new Date(minDate),
        maxDate: new Date(maxDate),
        active: true,
      };

      const { models: appointments } = await this.appointmentsService.findAll(
        filter,
      );

      for (const appointment of appointments) {
        const appointmentCache = await this.redis.get(
          `notify:twoHours:${appointment.id}`,
        );
        if (appointmentCache) continue;

        this.logger.info(
          this.i18nService.translate('notify.users.twoHours', {
            lang: appointment.user.lang,
            args: {
              current_date: new Date().toLocaleDateString(),
              ...appointment,
              date: moment(appointment.date).tz('Europe/Kyiv').format('hh:mm'),
            },
          }),
          'Notify',
        );

        const ttl = moment(appointment.date).diff(moment(), 'seconds');
        await this.redis.set(`notify:twoHours:${appointment.id}`, 1);
        await this.redis.expire(`notify:twoHours:${appointment.id}`, ttl);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
