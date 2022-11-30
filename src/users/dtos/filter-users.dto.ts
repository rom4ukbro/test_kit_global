import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Role } from '../../auth/enums/role.enum';

export class FilterUsersDto {
  @ApiProperty({ description: 'Filter by role' })
  @IsEnum(Role)
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  readonly role?: string;

  @ApiProperty({ description: 'User ID' })
  @IsMongoId()
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  readonly id: string;
}
