import { ValidationArguments } from 'class-validator';
import { JwtDto } from '../dtos/jwt.dto';

export interface ExtendedValidationArguments extends ValidationArguments {
  object: {
    params: any;
  } & JwtDto;
}
