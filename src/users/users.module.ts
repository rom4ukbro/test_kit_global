import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { User, UserSchema } from './users.schema';
import { UsersService } from './users.service';
import { isUserExistConstraint } from './validators/is.user.exists.validator';
import { isUserUniqueConstraint } from './validators/is.user.unique.validator';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [isUserExistConstraint, isUserUniqueConstraint, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
