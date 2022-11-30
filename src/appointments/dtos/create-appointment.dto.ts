import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Role } from '../../auth/enums/role.enum';
import { isUserExist } from '../../users/validators/is.user.exists.validator';
import { isDateNotPassed } from '../validators/is-date-not-passed.validator';

export class CreateAppointmentDto {
  readonly user: string;

  @ApiProperty({ description: 'Doc ID' })
  @isUserExist({
    role: Role.DOC,
    validationOptions: {
      message: i18nValidationMessage('appointment.doctor.notFound'),
    },
  })
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  readonly doctor: string;

  @ApiProperty({ description: 'Appointment date' })
  @isDateNotPassed()
  @IsDate({ message: i18nValidationMessage('appointment.date.format') })
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  @Type(() => Date)
  readonly date: Date;
}
