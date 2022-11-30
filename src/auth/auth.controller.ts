import {
  Controller,
  UseGuards,
  Post,
  UseInterceptors,
  ClassSerializerInterceptor,
  Body,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { User } from '../users/users.schema';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBody({ type: LoginDto })
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @ApiBody({ type: CreateUserDto })
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('register')
  async register(@Body() registerDto: CreateUserDto): Promise<User> {
    return this.authService.register(registerDto);
  }
}
