import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsController } from './appointments.controller';
import { Appointment, AppointmentSchema } from './appointments.schema';
import { AppointmentsService } from './appointments.service';
import { isDateNotPassedConstraint } from './validators/is-date-not-passed.validator';
import { isAppointmentExistConstraint } from './validators/is.appointments.exists.validator';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    isAppointmentExistConstraint,
    isDateNotPassedConstraint,
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
