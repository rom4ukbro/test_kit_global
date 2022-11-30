import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users.service';
import { ExtendedValidationArguments } from '../../common/validators/extended.validation.arguments';

@ValidatorConstraint({ name: 'isUserUnique', async: false })
@Injectable()
export class isUserUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly usersService: UsersService) {}

  async validate(payload: string, args?: ExtendedValidationArguments) {
    return (
      (await this.usersService.isUserExist(
        payload,
        args?.object?.jwt?.id || null,
      )) === null
    );
  }

  defaultMessage() {
    return 'Користувач вже існує';
  }
}

export function isUserUnique(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isUserUnique',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: isUserUniqueConstraint,
    });
  };
}
