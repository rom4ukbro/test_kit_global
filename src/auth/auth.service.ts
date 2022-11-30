import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { User } from '../users/users.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(login: string, password: string): Promise<User | null> {
    const user = await this.usersService.isUserExist(login);
    if (user !== null && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    throw new BadRequestException({
      statusCode: 400,
      message: 'user.wrongData',
    });
  }

  login(user: User) {
    const { id, role, lang, password } = user;
    return {
      token: this.jwtService.sign(
        { id, role, lang },
        { secret: process.env.JWT, privateKey: password },
      ),
    };
  }

  async register(registerDto: CreateUserDto) {
    const createUserDto: CreateUserDto = JSON.parse(
      JSON.stringify(registerDto),
    );
    const user = await this.usersService.create(createUserDto);
    return user;
  }
}
