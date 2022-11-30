import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../auth/enums/role.enum';

export class AuthUserDto {
  @ApiProperty({ description: 'Email or name' })
  readonly name: string;

  @ApiProperty({ description: 'User ID' })
  readonly clientId: string;

  @ApiProperty({ enum: Role, description: 'User role' })
  readonly scope: string;
}
