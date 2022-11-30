import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { FilterQuery, Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { CreateAppointmentDto } from './dtos/create-appointment.dto';
import { Appointment, AppointmentDocument } from './appointments.schema';
import { UpdateAppointmentDto } from './dtos/update-appointment.dto';
import { PaginationResultDto } from '../common/dtos/pagination-result.dto';
import { PaginationParams } from '../common/params/pagination.params';
import { FilterAppointmentDto } from './dtos/filter-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    @InjectRedis('notify') private readonly redis: Redis,
  ) {}

  async isAppointmentExist(
    value: string,
    appointmentId?: string,
  ): Promise<null | Appointment> {
    const filter = {
      $or: [{ name: value }, { email: value }],
    };
    if (appointmentId != null) {
      filter['_id'] = { $ne: appointmentId };
    }
    const doc: any = await this.appointmentModel.findOne(filter);
    return doc != null ? new Appointment(doc.toJSON()) : null;
  }

  async findAll({
    limit,
    page,
    sort,
    doctor,
    user,
    minDate,
    maxDate,
  }: PaginationParams & FilterAppointmentDto): Promise<
    PaginationResultDto<Appointment>
  > {
    const filter: FilterQuery<Appointment> = {};

    if (doctor) filter.doctor = new Types.ObjectId(doctor);
    if (user) filter.user = new Types.ObjectId(user);
    if (minDate && maxDate) filter.date = { $gt: minDate, $lte: maxDate };
    else if (minDate) filter.date = { $gt: minDate };
    else if (maxDate) filter.date = { $lte: maxDate };

    const models: Appointment[] = [];
    const docs = await this.appointmentModel
      .aggregate()
      .match(filter)
      .sort(sort)
      .skip(Math.ceil(limit * page - limit))
      .limit(page * limit)
      .lookup({
        from: 'users',
        let: { doctorId: '$doctor' },
        pipeline: [
          {
            $match: { $expr: { $eq: ['$_id', '$$doctorId'] } },
          },
          {
            $project: {
              id: { $toString: '$_id' },
              avatar: 1,
              email: 1,
              name: 1,
              lang: 1,
              spec: 1,
            },
          },
        ],
        as: 'doctor',
      })
      .addFields({ doctor: { $first: '$doctor' } })
      .lookup({
        from: 'users',
        let: { userId: '$user' },
        pipeline: [
          {
            $match: { $expr: { $eq: ['$_id', '$$userId'] } },
          },
          {
            $project: {
              id: { $toString: '$_id' },
              avatar: 1,
              email: 1,
              name: 1,
              lang: 1,
            },
          },
        ],
        as: 'user',
      })
      .addFields({ user: { $first: '$user' } });

    for (const doc of docs) {
      models.push(new Appointment(doc));
    }

    const count: number = await this.appointmentModel.countDocuments(filter);
    return { models, count };
  }

  async getCount({
    user,
    doctor,
    minDate,
    maxDate,
  }: FilterAppointmentDto): Promise<number> {
    const filter: FilterQuery<Appointment> = {};

    if (doctor) filter.doctor = new Types.ObjectId(doctor);
    if (user) filter.user = new Types.ObjectId(user);
    if (minDate && maxDate) filter.date = { $gt: minDate, $lte: maxDate };
    else if (minDate) filter.date = { $gt: minDate };
    else if (maxDate) filter.date = { $lte: maxDate };
    return await this.appointmentModel.countDocuments(filter);
  }

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    createAppointmentDto = JSON.parse(JSON.stringify(createAppointmentDto));
    const doc = new this.appointmentModel({ ...createAppointmentDto });
    await doc.save();
    return new Appointment(doc.toJSON());
  }

  async findById(id: string, user?: string): Promise<null | Appointment> {
    const filter: FilterQuery<Appointment> = { _id: id };
    if (user) filter.user = user;

    const doc: any = await this.appointmentModel.findOne(filter);
    if (doc == null) return null;
    return new Appointment(doc.toJSON());
  }

  async update(
    { id, doctor }: FilterAppointmentDto,
    updateAppointmentDto: UpdateAppointmentDto,
  ) {
    const filter: FilterQuery<Appointment> = JSON.parse(
      JSON.stringify({ _id: id, doctor }),
    );
    await this.appointmentModel.updateOne(filter, {
      $set: updateAppointmentDto,
    });

    if (updateAppointmentDto.date) {
      await this.redis.del([`notify:oneDay:${id}`, `notify:twoHours:${id}`]);
    }
  }

  async delete(id: string) {
    await this.appointmentModel.deleteOne({ _id: id });
  }
}
