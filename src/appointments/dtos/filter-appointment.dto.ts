import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Role } from '../../auth/enums/role.enum';
import { isUserExist } from '../../users/validators/is.user.exists.validator';

export class FilterAppointmentDto {
  @ApiProperty({ description: 'Filter by doctor' })
  @isUserExist({ role: Role.DOC })
  @IsMongoId()
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  @IsOptional()
  doctor?: string;

  @ApiProperty({ description: 'Filter by user' })
  @isUserExist({ role: Role.USER })
  @IsMongoId()
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  @IsOptional()
  user?: string;

  @ApiProperty({ description: 'Filter by appointment ID' })
  @IsMongoId()
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  @IsOptional()
  readonly id?: string;

  @ApiProperty({ description: 'Filter by appointment status' })
  @IsBoolean()
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  @IsOptional()
  readonly active?: boolean;

  @ApiProperty({ description: 'Filter by date. Min date' })
  @IsDate()
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  @IsOptional()
  readonly minDate?: Date;

  @ApiProperty({ description: 'Filter by date. Max date' })
  @IsDate()
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  @IsOptional()
  readonly maxDate?: Date;
}
