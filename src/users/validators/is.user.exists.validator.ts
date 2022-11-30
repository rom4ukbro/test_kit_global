import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users.service';
import { Role } from '../../auth/enums/role.enum';

@ValidatorConstraint({ name: 'isUserExist', async: false })
@Injectable()
export class isUserExistConstraint implements ValidatorConstraintInterface {
  constructor(private readonly usersService: UsersService) {}
  async validate(id: string, args: ValidationArguments) {
    const [role] = args.constraints;
    const user = await this.usersService.findOne({ id, role });
    return user !== null;
  }

  defaultMessage() {
    return 'user.notFound';
  }
}

export function isUserExist({
  role,
  validationOptions,
}: {
  role?: Role;
  validationOptions?: ValidationOptions;
}) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isUserExist',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [role],
      validator: isUserExistConstraint,
    });
  };
}
