import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types, Document } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../auth/enums/role.enum';
import { LangEnum } from '../common/enums/lang.enum';
import { SpecEnum } from './enums/spec.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: SchemaTypes.ObjectId, default: Types.ObjectId })
  @Exclude()
  _id: Types.ObjectId;
  @Exclude()
  __v: number;

  @ApiProperty()
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: String, required: true })
  @Exclude()
  password: string;

  @ApiProperty()
  @Prop({ type: String, required: true })
  email: string;

  @ApiProperty()
  @Prop({ type: String, enum: Role, default: Role.USER })
  role: Role;

  @ApiProperty()
  @Prop({ type: String, required: true })
  avatar: string;

  @ApiProperty()
  @Prop({ type: String, required: true })
  phone: string;

  @ApiProperty()
  @Prop({ type: String, enum: Object.values(SpecEnum).concat([null]) })
  spec: string;

  @ApiProperty()
  @Prop({ type: String, enum: LangEnum, default: LangEnum.uk })
  lang: string;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  @Expose()
  get id(): string {
    return String(this._id);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
