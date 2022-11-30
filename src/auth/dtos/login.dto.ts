import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginDto {
  @ApiProperty({ description: 'User email or name' })
  @IsEmail({}, { message: i18nValidationMessage('user.email.type') })
  @Length(4, 128, {
    message: i18nValidationMessage('common.length'),
  })
  @IsNotEmpty({ message: i18nValidationMessage('user.name.empty') })
  readonly email: string;

  @ApiProperty({ description: 'User password' })
  @Length(8, 128, {
    message: i18nValidationMessage('common.length'),
  })
  @IsString()
  @IsNotEmpty({ message: i18nValidationMessage('user.password.empty') })
  readonly password: string;
}
