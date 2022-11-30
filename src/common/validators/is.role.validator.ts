import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ExtendedValidationArguments } from './extended.validation.arguments';
import { Role } from '../../auth/enums/role.enum';

@ValidatorConstraint({ name: 'IsRole', async: false })
export class IsRoleConstraint implements ValidatorConstraintInterface {
  async validate(payload: string, args?: ExtendedValidationArguments) {
    const [role] = args.constraints;
    return args.object.jwt.role === role;
  }

  defaultMessage() {
    return 'user.forbiddenParams';
  }
}

export function IsRole(role: Role, validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsRole',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [role],
      validator: IsRoleConstraint,
    });
  };
}
