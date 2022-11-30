import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'isDateNotPassed', async: false })
@Injectable()
export class isDateNotPassedConstraint implements ValidatorConstraintInterface {
  async validate(payload: string) {
    return new Date(payload) > new Date();
  }

  defaultMessage() {
    return 'appointment.date.passed';
  }
}

export function isDateNotPassed(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isDateNotPassed',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: isDateNotPassedConstraint,
    });
  };
}
