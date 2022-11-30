import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiExtraModels,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import * as moment from 'moment';
import { Appointment } from './appointments.schema';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dtos/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateAppointmentDto } from './dtos/update-appointment.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiPaginatedResponse } from '../common/decorators/paginate.swagger';
import { PaginationResultDto } from '../common/dtos/pagination-result.dto';
import { PaginationParams } from '../common/params/pagination.params';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AcceptAppointmentDto } from './dtos/accept-appointment.dto';
import { InjectJWTToBody } from '../common/decorators/inject.jwt.decorator';
import { JwtDto } from '../common/dtos/jwt.dto';
import { FilterAppointmentDto } from './dtos/filter-appointment.dto';
import { I18n, I18nContext } from 'nestjs-i18n';

@ApiTags('Appointments')
@ApiBearerAuth('access-token')
@ApiExtraModels()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(protected readonly appointmentsService: AppointmentsService) {}

  @ApiPaginatedResponse(Appointment)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  async findAll(
    @Query() { limit, page, sort }: PaginationParams,
    @Req() { user }: any,
  ): Promise<PaginationResultDto<Appointment>> {
    const payload: PaginationParams & FilterAppointmentDto = {
      limit,
      page,
      sort,
    };
    if (user.role === Role.DOC) payload.doctor = user.id;
    else if (user.role === Role.USER) payload.user = user.id;
    return this.appointmentsService.findAll(payload);
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @I18n() i18n: I18nContext,
    @Req() { user }: any,
  ): Promise<Appointment> {
    const minDate = moment(createAppointmentDto.date)
      .hour(2)
      .minute(0)
      .second(0)
      .millisecond(0)
      .format();
    const maxDate = moment(createAppointmentDto.date)
      .add(1, 'days')
      .hour(1)
      .minute(59)
      .second(59)
      .millisecond(999)
      .format();
    const activeAppointmentsCount = await this.appointmentsService.getCount({
      doctor: createAppointmentDto.doctor,
      active: true,
      minDate: new Date(minDate),
      maxDate: new Date(maxDate),
    });

    if (activeAppointmentsCount >= Number(process.env.MAX_DOC_APPOINTMENTS)) {
      throw new BadRequestException(
        i18n.translate('appointment.doctor.isBusy', {
          lang: user.lang,
          args: {
            currentDate: moment(createAppointmentDto.date).format('DD.MM.YY'),
          },
        }),
      );
    }

    return this.appointmentsService.create({
      ...createAppointmentDto,
      user: user.id,
    });
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(
    @Param('id') id: string,
    @Req() { user }: any,
  ): Promise<Appointment> {
    return this.appointmentsService.findById(id, user.id);
  }

  @Put(':id')
  @InjectJWTToBody()
  @HttpCode(204)
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update({ id }, updateAppointmentDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    await this.appointmentsService.delete(id);
  }

  @Patch('/accept')
  @ApiBody({ type: AcceptAppointmentDto })
  @InjectJWTToBody()
  @Roles(Role.DOC)
  @UseGuards(RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async accept(
    @Body() body: AcceptAppointmentDto & JwtDto,
    @I18n() i18n: I18nContext,
  ): Promise<void> {
    const appointment = await this.appointmentsService.findById(body.id);
    const minDate = moment(appointment.date)
      .hour(2)
      .minute(0)
      .second(0)
      .millisecond(0)
      .format();
    const maxDate = moment(appointment.date)
      .add(1, 'days')
      .hour(1)
      .minute(59)
      .second(59)
      .millisecond(999)
      .format();

    const activeAppointmentsCount = await this.appointmentsService.getCount({
      doctor: body.jwt.id,
      active: true,
      minDate: new Date(minDate),
      maxDate: new Date(maxDate),
    });

    if (activeAppointmentsCount >= Number(process.env.MAX_DOC_APPOINTMENTS)) {
      throw new BadRequestException(
        i18n.translate('appointment.doctor.acceptLimit', {
          lang: body.jwt.lang,
          args: {
            currentDate: moment(appointment.date).format('DD.MM.YY'),
          },
        }),
      );
    }

    return this.appointmentsService.update(
      { id: body.id, doctor: body.jwt.id },
      { active: true },
    );
  }
}
