import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection } from 'mongoose';
import { useContainer } from 'class-validator';
import { ConfigModule } from '@nestjs/config';
import {
  i18nValidationErrorFactory,
  I18nMiddleware,
  I18nValidationExceptionFilter,
  AcceptLanguageResolver,
  I18nModule,
} from 'nestjs-i18n';
import { UsersModule } from './../src/users/users.module';
import { hasErrorMessages } from './help';
import { LangEnum } from '../src/common/enums/lang.enum';
import { I18nTsLoader } from '../src/common/i18n/i18n.loader';
import { ExceptionFilterTranslate } from '../src/common/i18n/i18n.exception-filter';
import { AuthModule } from '../src/auth/auth.module';

describe('Users controller (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let testUser: any;
  let testDoctor: any;
  let userToken: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    mongoConnection = (await connect(uri)).connection;

    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRoot(uri),
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
        UsersModule,
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
  });

  beforeEach(async () => {
    if (testUser) {
      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      userToken = res.body.token;
    }
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();

    await app.close();
  });

  describe('Testing create user', () => {
    it('Should throw validation errors(part 1)', async () => {
      const res = await request(app.getHttpServer()).post('/users').send({});

      expect(res.status).toEqual(400);
      expect(
        hasErrorMessages({
          errors: res.body.errors,
          propertiesMessages: {
            name: [
              "Введіть ім'я користувача",
              'Довжина повинна становити від 4 до 128 символів',
            ],
            email: [
              'Введіть електронну пошту',
              'Довжина повинна становити від 4 до 128 символів',
            ],
            password: [
              'Введіть пароль',
              'Довжина повинна становити від 8 до 128 символів',
            ],
            confirmPassword: [
              'Введіть підтвердження пароля',
              'Довжина повинна становити від 8 до 128 символів',
            ],
            phone: [
              'Введіть номер телефону',
              'Не правильний формат номера телефону',
            ],
            role: ["Це поле є обов'язковим", 'Виберіть роль зі списку'],
          },
        }),
      ).toEqual(true);
    });

    it('Should throw validation errors(part 2)', async () => {
      const res = await request(app.getHttpServer()).post('/users').send({
        name: 'Test user',
        email: 'test_user',
        password: 'password',
        confirmPassword: 'another_password',
        role: 'user',
        lang: 'pl',
        phone: '380593996377',
        avatar: null,
      });

      expect(res.status).toEqual(400);
      expect(
        hasErrorMessages({
          errors: res.body.errors,
          propertiesMessages: {
            email: ['Введіть дійсний e-mail'],
            lang: ['Виберіть мову зі списку'],
            confirmPassword: ['Паролі не збігаються'],
          },
        }),
      ).toEqual(true);
    });

    it('Should created user', async () => {
      const payload = {
        name: 'Test user',
        email: 'test_user@test.com',
        password: 'password',
        confirmPassword: 'password',
        role: 'user',
        phone: '380593996377',
        avatar: null,
      };
      testUser = payload;

      const res = await request(app.getHttpServer())
        .post('/users')
        .send(payload);

      expect(res.status).toEqual(201);

      const { name, email, role, lang, phone, avatar, spec, id } = res.body;

      testUser.id = id;

      expect(name).toEqual(payload.name);
      expect(email).toEqual(payload.email);
      expect(role).toEqual(payload.role);
      expect(lang).toEqual('uk');
      expect(phone).toEqual(payload.phone);
      expect(avatar).toEqual(
        `https://eu.ui-avatars.com/api/?background=random&name=Test+user`,
      );
      expect(spec).toBe(undefined);
    });

    it('Should throw validation errors(part 3)', async () => {
      const res = await request(app.getHttpServer()).post('/users').send({
        name: 'Test user',
        email: 'test_user@test.com',
        password: 'password',
        confirmPassword: 'password',
        role: 'user',
        phone: '380593996377',
        avatar: null,
      });

      expect(res.status).toEqual(400);
      expect(
        hasErrorMessages({
          errors: res.body.errors,
          propertiesMessages: {
            name: ["Ім'я користувача вже використовується"],
            email: ['E-mail вже використовується'],
          },
        }),
      ).toEqual(true);
    });
  });

  describe('Testing create doctor', () => {
    it('Should throw validation errors', async () => {
      const res = await request(app.getHttpServer()).post('/users').send({
        name: 'Test doc',
        email: 'test_doc@test.com',
        password: 'password',
        confirmPassword: 'password',
        role: 'doc',
        phone: '380593996377',
        avatar: null,
      });

      expect(res.status).toEqual(400);
      expect(
        hasErrorMessages({
          errors: res.body.errors,
          propertiesMessages: {
            spec: ['Виберіть спеціальність зі списку'],
          },
        }),
      ).toEqual(true);
    });

    it('Should created doctor', async () => {
      const payload = {
        name: 'Test doc',
        email: 'test_doc@test.com',
        password: 'password',
        confirmPassword: 'password',
        role: 'doc',
        phone: '380593996377',
        avatar: null,
        spec: 'dentist',
      };
      testDoctor = payload;
      const res = await request(app.getHttpServer())
        .post('/users')
        .send(payload);

      expect(res.status).toEqual(201);

      const { name, email, role, lang, phone, avatar, spec, id } = res.body;

      testDoctor.id = id;

      expect(name).toEqual(payload.name);
      expect(email).toEqual(payload.email);
      expect(role).toEqual(payload.role);
      expect(lang).toEqual('uk');
      expect(phone).toEqual(payload.phone);
      expect(avatar).toEqual(
        `https://eu.ui-avatars.com/api/?background=random&name=Test+doc`,
      );
      expect(spec).toBe(payload.spec);
    });
  });

  describe('Testing get user', () => {
    it('Should throw not found error', async () => {
      const resGet = await request(app.getHttpServer())
        .get(`/users/637e8d7278c8a9e954d34d0e`)
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        });

      expect(resGet.status).toEqual(404);
      expect(resGet.body.message).toEqual('Користувача не знайдено');
    });

    it('Should get user', async () => {
      const resGet = await request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        });

      expect(resGet.status).toEqual(200);

      const { name, email, role, phone, avatar } = resGet.body;

      expect(name).toEqual(testUser.name);
      expect(email).toEqual(testUser.email);
      expect(role).toEqual(testUser.role);
      expect(phone).toEqual(testUser.phone);
      expect(avatar).toEqual(
        `https://eu.ui-avatars.com/api/?background=random&name=Test+user`,
      );
    });
  });

  describe('Testing update user', () => {
    it('Should throw validation errors', async () => {
      const payload = {
        ...testUser,
        name: 'Use',
        email: 'ema',
        password: 'pass',
        confirmPassword: 'passw',
      };

      const resUpdate = await request(app.getHttpServer())
        .put('/users')
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        })
        .send(payload);

      expect(resUpdate.status).toEqual(400);

      expect(
        hasErrorMessages({
          errors: resUpdate.body.errors,
          propertiesMessages: {
            name: ['Довжина повинна становити від 4 до 128 символів'],
            email: [
              'Довжина повинна становити від 4 до 128 символів',
              'Введіть дійсний e-mail',
            ],
            password: ['Довжина повинна становити від 8 до 128 символів'],
            confirmPassword: [
              'Довжина повинна становити від 8 до 128 символів',
              'Паролі не збігаються',
            ],
          },
        }),
      ).toEqual(true);
    });

    it('Should update user', async () => {
      const payload = {
        ...testUser,
        name: 'User',
        email: 'user.update@test.com',
        phone: '+380965643288',
      };

      const resUpdate = await request(app.getHttpServer())
        .put('/users')
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        })
        .send(payload);

      expect(resUpdate.status).toEqual(204);
      testUser = payload;

      const resGet = await request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        });

      const { name, email, phone, avatar } = resGet.body;

      expect(name).toEqual(testUser.name);
      expect(email).toEqual(testUser.email);
      expect(phone).toEqual(testUser.phone);
      expect(avatar).toEqual(
        `https://eu.ui-avatars.com/api/?background=random&name=User`,
      );
    });
  });

  describe('Testing delete user', () => {
    it('Should delete user', async () => {
      const payload = {
        name: 'Delete user',
        email: 'delete_user@test.com',
        password: 'password',
        confirmPassword: 'password',
        role: 'user',
        phone: '380593996377',
        avatar: null,
      };

      const res = await request(app.getHttpServer())
        .post('/users')
        .send(payload);

      expect(res.status).toEqual(201);

      const resAuth = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: payload.email,
          password: payload.password,
        });

      const { id } = res.body;

      const resDelete = await request(app.getHttpServer())
        .delete('/users')
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${resAuth.body.token}`,
        });

      expect(resDelete.status).toEqual(204);

      const resGet = await request(app.getHttpServer())
        .get(`/users/${id}`)
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        });

      expect(resGet.status).toEqual(404);
      expect(resGet.body.message).toEqual('Користувача не знайдено');
    });
  });
});
