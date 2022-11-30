import { Role } from '../../auth/enums/role.enum';
import { LangEnum } from '../enums/lang.enum';

export class JwtDto {
  jwt: {
    id: string;
    role: Role;
    lang: LangEnum;
    iat: number;
    exp: number;
  };
}
