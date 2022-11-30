import {
  Controller,
  UseGuards,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
  Post,
  Body,
  Param,
  Put,
  HttpCode,
  Delete,
  Request,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';
import { InjectJWTToBody } from '../common/decorators/inject.jwt.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiPaginatedResponse } from '../common/decorators/paginate.swagger';
import { PaginationResultDto } from '../common/dtos/pagination-result.dto';
import { PaginationParams } from '../common/params/pagination.params';
import { AuthUserDto } from './dtos/auth-user.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { User } from './users.schema';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@ApiExtraModels()
@Controller('users')
export class UsersController {
  constructor(protected readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth')
  async auth(@Request() req): Promise<AuthUserDto> {
    const user = await this.usersService.findOne(req.user.id);
    return {
      clientId: req.user.id,
      scope: user.role,
      name: user.name,
    };
  }

  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  @ApiPaginatedResponse(User)
  async findAll(
    @Query() { limit, page, sort }: PaginationParams,
  ): Promise<PaginationResultDto<User>> {
    return this.usersService.findAll({
      limit,
      page,
      sort,
    });
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findOne({ id });
    if (!user) {
      throw new NotFoundException('user.notFound');
    }
    return user;
  }

  @Put()
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @InjectJWTToBody()
  async update(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    await this.usersService.update(req.user.id, updateUserDto);
  }

  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete()
  @HttpCode(204)
  async delete(@Request() req: any) {
    await this.usersService.delete(req.user.id);
  }
}
