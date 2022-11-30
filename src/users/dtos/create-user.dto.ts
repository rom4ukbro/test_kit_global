import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { Role } from '../../auth/enums/role.enum';
import { LangEnum } from '../../common/enums/lang.enum';
import { IsPasswordMatch } from '../../common/validators/is.password.match.validator';
import { SpecEnum } from '../enums/spec.enum';
import { isUserUnique } from '../validators/is.user.unique.validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User name' })
  @isUserUnique({
    message: i18nValidationMessage('user.name.exists'),
  })
  @Length(4, 128, {
    message: i18nValidationMessage('common.length'),
  })
  @IsString()
  @IsNotEmpty({ message: i18nValidationMessage('user.name.empty') })
  readonly name: string;

  @ApiProperty({ description: 'User email' })
  @isUserUnique({ message: i18nValidationMessage('user.email.exists') })
  @Length(4, 128, {
    message: i18nValidationMessage('common.length'),
  })
  @IsEmail({}, { message: i18nValidationMessage('user.email.type') })
  @IsNotEmpty({ message: i18nValidationMessage('user.email.empty') })
  readonly email: string;

  @ApiProperty({ description: 'User password' })
  @Length(8, 128, {
    message: i18nValidationMessage('common.length'),
  })
  @IsString()
  @IsNotEmpty({ message: i18nValidationMessage('user.password.empty') })
  readonly password: string;

  @ApiProperty({ description: 'Confirm user password' })
  @IsPasswordMatch('password', {
    message: i18nValidationMessage('user.confirmPassword.notMatch'),
  })
  @Length(8, 128, {
    message: i18nValidationMessage('common.length'),
  })
  @IsString()
  @IsNotEmpty({
    message: i18nValidationMessage('user.confirmPassword.empty'),
  })
  readonly confirmPassword: string;

  @ApiProperty({ description: 'User avatar' })
  @IsNotEmpty({ message: i18nValidationMessage('user.avatar.empty') })
  @Transform(({ value, obj }) => {
    if (value) return value;
    const name = obj.name.replace(/ /g, '+');
    return `https://eu.ui-avatars.com/api/?background=random&name=${name}`;
  })
  readonly avatar: string;

  @ApiProperty({ description: 'User phone number. Start at +380 or 380' })
  @IsPhoneNumber('UA', {
    message: i18nValidationMessage('user.phone.format'),
  })
  @IsNotEmpty({ message: i18nValidationMessage('user.phone.empty') })
  readonly phone: string;

  @ApiProperty({ description: 'User role', enum: Role, default: Role.USER })
  @IsEnum(Role, { message: i18nValidationMessage('user.role.enum') })
  @IsNotEmpty({ message: i18nValidationMessage('common.notEmpty') })
  readonly role: string;

  @ApiProperty({
    description: 'User language',
    enum: LangEnum,
    default: LangEnum.uk,
  })
  @IsEnum(LangEnum, { message: i18nValidationMessage('user.lang.enum') })
  @IsOptional()
  readonly lang?: string;

  @ApiProperty({ description: 'Doctor specialty', enum: SpecEnum })
  @ValidateIf((obj) => obj.role === Role.DOC)
  @IsEnum(SpecEnum, { message: i18nValidationMessage('user.spec.enum') })
  @IsString()
  @IsNotEmpty({ message: i18nValidationMessage('user.spec.enum') })
  readonly spec?: string;
}
