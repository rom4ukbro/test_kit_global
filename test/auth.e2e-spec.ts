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
import { hasErrorMessages } from './help';
import { LangEnum } from '../src/common/enums/lang.enum';
import { I18nTsLoader } from '../src/common/i18n/i18n.loader';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { ExceptionFilterTranslate } from '../src/common/i18n/i18n.exception-filter';

describe('Auth controller(e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

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

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();

    await app.close();
  });

  describe('Testing register user', () => {
    it('Should throw validation errors(part 1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({});

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
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
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

    it('Should register user', async () => {
      const payload = {
        name: 'Test user',
        email: 'test_user@test.com',
        password: 'password',
        confirmPassword: 'password',
        role: 'user',
        phone: '380593996377',
        avatar: null,
      };
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload);

      expect(res.status).toEqual(201);

      const { name, email, role, lang, phone, avatar, spec } = res.body;

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
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
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

  describe('Testing register doctor', () => {
    it('Should throw validation errors', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
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

    it('Should register doctor', async () => {
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
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload);

      expect(res.status).toEqual(201);

      const { name, email, role, lang, phone, avatar, spec } = res.body;

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

  describe('Testing login', () => {
    it('Should throw login errors', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'test@test.com',
        password: 'wrong_pass',
      });

      expect(res.status).toEqual(400);
      expect(res.body.message).toEqual('Неправильний логін або пароль');
    });

    it('Should login user', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'test_user@test.com',
        password: 'password',
      });

      expect(res.status).toEqual(200);

      const { token } = res.body;

      expect(token).not.toBe(null);

      const testRes = await request(app.getHttpServer())
        .get('/users?page=1&limit=3&sort=-createdAt')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(testRes.status).toEqual(200);
    });
  });
});
