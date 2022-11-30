import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types, Document } from 'mongoose';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/users.schema';

export type AppointmentDocument = Appointment & Document;

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ type: SchemaTypes.ObjectId, default: Types.ObjectId })
  @Exclude()
  _id: Types.ObjectId;
  @Exclude()
  __v: number;

  @ApiProperty()
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'users' })
  @Type(() => String)
  user: User;

  @ApiProperty()
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'users' })
  @Type(() => String)
  doctor: User;

  @ApiProperty()
  @Prop({ type: Date, default: Date })
  @Type(() => Date)
  date: Date;

  @ApiProperty()
  @Prop({ type: Boolean, default: false })
  active: boolean;

  constructor(partial: Partial<Appointment>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  @Expose()
  get id(): string {
    return String(this._id);
  }
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
