import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { AppointmentsService } from '../appointments.service';

@ValidatorConstraint({ name: 'isAppointmentExist', async: false })
@Injectable()
export class isAppointmentExistConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly appointmentsService: AppointmentsService) {}

  async validate(payload: string) {
    return (await this.appointmentsService.findById(payload)) !== null;
  }

  defaultMessage() {
    return 'appointment.notFound';
  }
}

export function isAppointmentExist(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isAppointmentExist',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: isAppointmentExistConstraint,
    });
  };
}
