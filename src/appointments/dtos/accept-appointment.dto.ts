import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { isAppointmentExist } from '../validators/is.appointments.exists.validator';

export class AcceptAppointmentDto {
  @ApiProperty({ description: 'Appointment ID' })
  @isAppointmentExist()
  @IsMongoId()
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  readonly id: string;
}
