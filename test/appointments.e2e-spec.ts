import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection, Types } from 'mongoose';
import { useContainer } from 'class-validator';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import {
  i18nValidationErrorFactory,
  I18nMiddleware,
  I18nValidationExceptionFilter,
  AcceptLanguageResolver,
  I18nModule,
} from 'nestjs-i18n';
import * as moment from 'moment';
import { hasErrorMessages } from './help';
import { LangEnum } from '../src/common/enums/lang.enum';
import { I18nTsLoader } from '../src/common/i18n/i18n.loader';
import { ExceptionFilterTranslate } from '../src/common/i18n/i18n.exception-filter';
import { AuthModule } from '../src/auth/auth.module';
import { AppointmentsModule } from '../src/appointments/appointments.module';
import { Appointment } from '../src/appointments/appointments.schema';

describe('Appointment controller (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let testUser: any;
  let testDoctor: any;
  let userToken: string;
  let doctorToken: string;
  const testAppointments: Appointment[] = [];
  const testUsers: any[] = [];

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    mongoConnection = (await connect(uri)).connection;

    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRoot(uri),
        RedisModule.forRoot({
          config: [{ namespace: 'notify' }],
        }),
        ScheduleModule.forRoot(),
        I18nModule.forRoot({
          fallbackLanguage: LangEnum.uk,
          fallbacks: {
            'uk-*': 'uk',
            'en-*': 'en',
            'ru-*': 'ru',
          },
          loaderOptions: {},
          loader: I18nTsLoader,
          resolvers: [AcceptLanguageResolver],
          logging: false,
        }),
        AuthModule,
        AppointmentsModule,
      ],
      providers: [
        {
          provide: 'APP_FILTER',
          useClass: ExceptionFilterTranslate,
        },
      ],
    }).compile();
    app = testingModule.createNestApplication();

    useContainer(app, { fallbackOnErrors: true });

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        validationError: { target: true, value: true },
        exceptionFactory: i18nValidationErrorFactory,
      }),
    );
    app.use(I18nMiddleware);
    app.useGlobalFilters(new I18nValidationExceptionFilter());

    await app.init();

    const userPayload = {
      name: 'Test user',
      email: 'test_user@test.com',
      password: 'password',
      confirmPassword: 'password',
      role: 'user',
      phone: '380593996377',
      avatar: null,
    };
    const userRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(userPayload);

    testUser = { ...userPayload, id: userRes.body.id };

    const docPayload = {
      name: 'Test doc',
      email: 'test_doc@test.com',
      password: 'password',
      confirmPassword: 'password',
      role: 'doc',
      phone: '380593996377',
      avatar: null,
      spec: 'dentist',
    };
    const docRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(docPayload);

    testDoctor = { ...docPayload, id: docRes.body.id };

    testUsers.push(testUser, testDoctor);
  });

  beforeEach(async () => {
    if (testUser) {
      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      userToken = res.body.token;
    }
    if (testDoctor) {
      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: testDoctor.email,
        password: testDoctor.password,
      });
      doctorToken = res.body.token;
    }
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();

    await app.close();
  });

  describe('Testing create appointment', () => {
    it('Should throw unauthorized errors', async () => {
      const res = await request(app.getHttpServer())
        .post('/appointments')
        .send({});

      expect(res.status).toEqual(401);
      expect(res.body.message).toEqual('Авторизуйтесь, щоб отримати доступ');
    });

    it('Should throw validation errors', async () => {
      const res = await request(app.getHttpServer())
        .post('/appointments')
        .send({})
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        });

      expect(res.status).toEqual(400);
      expect(
        hasErrorMessages({
          errors: res.body.errors,
          propertiesMessages: {
            doctor: ["Це поле є обов'язковим", 'Лікар не знайдений'],
            date: [
              "Це поле є обов'язковим",
              'Не правильний формат дати',
              'Дата вже минула',
            ],
          },
        }),
      ).toEqual(true);
    });

    it('Should created appointment', async () => {
      const payload = {
        doctor: testDoctor.id,
        date: moment().add(4, 'hours').toDate(),
      };
      const res = await request(app.getHttpServer())
        .post('/appointments')
        .send(payload)
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        });

      expect(res.status).toEqual(201);

      const { doctor, date, user, active } = res.body;

      expect(doctor).toEqual(testDoctor.id);
      expect(new Date(date)).toEqual(payload.date);
      expect(user).toEqual(testUser.id);
      expect(active).toEqual(false);

      testAppointments.push(res.body);
    });
  });

  describe('Testing accept appointment', () => {
    it('Should throw forbidden error ', async () => {
      const res = await request(app.getHttpServer())
        .patch('/appointments/accept')
        .send({ id: testAppointments[0].id })
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        });

      expect(res.status).toEqual(403);
    });

    it('Should activate appointment', async () => {
      const res = await request(app.getHttpServer())
        .patch('/appointments/accept')
        .send({ id: testAppointments[0].id })
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${doctorToken}`,
        });

      expect(res.status).toEqual(200);

      const resGet = await request(app.getHttpServer())
        .get(`/appointments/${testAppointments[0].id}`)
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        });

      expect(resGet.status).toEqual(200);
      expect(resGet.body.active).toEqual(true);

      testAppointments[0] = resGet.body;
    });
  });

  describe('Testing appointments limit', () => {
    it('Should throw error accept limit', async () => {
      const appointment = {
        date: moment().add(6, 'hours').toDate(),
        doctor: new Types.ObjectId(testDoctor.id),
        user: new Types.ObjectId(testUser.id),
        active: true,
      };

      await mongoConnection.collection('appointments').insertMany([
        { ...appointment, _id: new Types.ObjectId() },
        { ...appointment, _id: new Types.ObjectId() },
        { ...appointment, _id: new Types.ObjectId() },
        { ...appointment, _id: new Types.ObjectId() },
      ]);
      testAppointments.shift();
      const appointments = await mongoConnection
        .collection('appointments')
        .find()
        .toArray();
      appointments.forEach((v: any) =>
        testAppointments.push(new Appointment(v)),
      );

      const res = await request(app.getHttpServer())
        .patch('/appointments/accept')
        .send({ id: testAppointments[1].id })
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${doctorToken}`,
        });

      expect(res.status).toEqual(400);
      expect(res.body.message).toEqual(
        `Ви вже прийняли максимальну кількість пацієнтів на ${moment(
          testAppointments[1].date,
        ).format('DD.MM.YY')}`,
      );
    });

    it('Should throw error creating the record due to a restriction', async () => {
      const payload = {
        doctor: testDoctor.id,
        date: moment().add(4, 'hours').toDate(),
      };
      const res = await request(app.getHttpServer())
        .post('/appointments')
        .send(payload)
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        });

      expect(res.status).toEqual(400);
      expect(res.body.message).toEqual(
        `${moment(payload.date).format(
          'DD.MM.YY',
        )} лікар вже зайнятий. Спробуйте іншу дату`,
      );
    });
  });

  describe('Testing appointments list', () => {
    it('Should return empty users appointments', async () => {
      const userPayload = {
        name: 'Test user2',
        email: 'test_user2@test.com',
        password: 'password',
        confirmPassword: 'password',
        role: 'user',
        phone: '380593996377',
        avatar: null,
      };
      const userRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userPayload);
      const testUser2 = { ...userPayload, id: userRes.body.id };

      testUsers.push(testUser2);
      const resAuth = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser2.email,
          password: testUser2.password,
        });
      const userToken2 = resAuth.body.token;

      const res = await request(app.getHttpServer())
        .get('/appointments')
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${userToken2}`,
        });

      expect(res.status).toEqual(200);
      expect(res.body.count).toEqual(0);
      expect(res.body.models).toEqual([]);
    });

    it('Should return empty doctor appointments', async () => {
      const docPayload = {
        name: 'Test doc2',
        email: 'test_doc2@test.com',
        password: 'password',
        confirmPassword: 'password',
        role: 'doc',
        phone: '380593996377',
        avatar: null,
        spec: 'dentist',
      };
      const docRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(docPayload);
      const testDoctor2 = { ...docPayload, id: docRes.body.id };
      testUsers.push(testDoctor2);
      const resAuth = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testDoctor2.email,
          password: testDoctor2.password,
        });
      const doctorToken2 = resAuth.body.token;

      const res = await request(app.getHttpServer())
        .get('/appointments')
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${doctorToken2}`,
        });

      expect(res.status).toEqual(200);
      expect(res.body.count).toEqual(0);
      expect(res.body.models).toEqual([]);
    });

    it('Should return user appointments', async () => {
      const res = await request(app.getHttpServer())
        .get('/appointments?page=1&limit=3&sort=-createdAt')
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        });

      expect(res.status).toEqual(200);
      expect(res.body.count).toEqual(5);
      expect(res.body.models.length).toEqual(3);
    });

    it('Should return doctor appointments', async () => {
      const res = await request(app.getHttpServer())
        .get('/appointments?page=1&limit=3&sort=-createdAt')
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${doctorToken}`,
        });

      expect(res.status).toEqual(200);
      expect(res.body.count).toEqual(5);
      expect(res.body.models.length).toEqual(3);
    });
  });
});
