import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dtos/create-user.dto';
import { User, UserDocument } from './users.schema';
import { UpdateUserDto } from './dtos/update-user.dto';
import { PaginationResultDto } from '../common/dtos/pagination-result.dto';
import { PaginationParams } from '../common/params/pagination.params';
import { FilterUsersDto } from './dtos/filter-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async isUserExist(value: string, userId?: string): Promise<null | User> {
    const filter = {
      $or: [{ name: value }, { email: value }],
    };
    if (userId != null) {
      filter['_id'] = { $ne: userId };
    }
    const doc = await this.userModel.findOne(filter);
    return doc != null ? new User(doc.toJSON()) : null;
  }

  async findAll({
    limit,
    page,
    sort,
  }: PaginationParams): Promise<PaginationResultDto<User>> {
    const models: User[] = [];
    const docs = await this.userModel
      .find()
      .sort(sort)
      .skip(Math.ceil(limit * page - limit))
      .limit(page * limit);

    for (const doc of docs) {
      models.push(new User(doc.toJSON()));
    }

    const count: number = await this.userModel.countDocuments();
    return { models, count };
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, confirmPassword, ...data } = createUserDto;
    const user = new this.userModel({
      password: await bcrypt.hash(password, Number(process.env.SALT)),
      ...data,
    });

    await user.save();
    return new User(user.toJSON());
  }

  async findOne({ id, role }: FilterUsersDto): Promise<null | User> {
    const filter = JSON.parse(JSON.stringify({ _id: id, role }));
    if (!filter._id) return null;

    const doc: any = await this.userModel.findOne(filter);
    if (doc == null) return null;
    return new User(doc.toJSON());
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    let { password } = updateUserDto;
    if (password != null) {
      password = await bcrypt.hash(password, Number(process.env.SALT));
    }

    await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          ...updateUserDto,
          password,
        },
      },
    );
  }

  async delete(id: string) {
    await this.userModel.deleteOne({ _id: id });
  }
}
