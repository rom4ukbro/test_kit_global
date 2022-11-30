import { Module } from '@nestjs/common';
import { AppointmentsModule } from './../appointments/appointments.module';
import { NotificationsCronService } from './notifications.cron.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [AppointmentsModule, LoggerModule],
  providers: [NotificationsCronService],
  exports: [NotificationsCronService],
})
export class NotificationsModule {}
