import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsDate, IsBoolean, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Role } from '../../auth/enums/role.enum';
import { IsRole } from '../../common/validators/is.role.validator';
import { isDateNotPassed } from '../validators/is-date-not-passed.validator';

export class UpdateAppointmentDto {
  @ApiProperty()
  @IsOptional()
  @isDateNotPassed()
  @IsDate({ message: i18nValidationMessage('appointment.date.format') })
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  @Type(() => Date)
  readonly date?: Date;

  @ApiProperty()
  @IsOptional()
  @IsRole(Role.DOC)
  @IsBoolean()
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  @Type(() => Boolean)
  readonly active?: boolean;
}
