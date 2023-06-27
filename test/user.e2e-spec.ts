import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { UserEntity } from 'src/user/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('userController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let moduleFixture: TestingModule;

  // print env
  console.log('env!!!!!!!!!!!!!!!!!', process.env);

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const payload = { sub: 1 };
    const secretKey = process.env.JWT_SECRET;
    accessToken = jwt.sign(payload, secretKey);
  });

  afterAll(async () => {
    const userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
    await userRepository.clear();
    await app.close();
  });

  it('/user (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/user')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: 1,
        name: 'user1',
        email: 'test@example.com',
        image: 'https://example.com/image.jpg',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 1,
      name: 'user1',
      email: 'test@example.com',
      image: 'https://example.com/image.jpg',
      twoFactor: false,
    });
  });

  it('/user (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/user')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      name: 'user1',
      email: 'test@example.com',
      image: 'https://example.com/image.jpg',
      twoFactor: false,
    });
  });

  it('/user (PATCH)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/user')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'user1_updated',
        twoFactor: true,
      });

    console.log('res.body: ', res.body);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      name: 'user1_updated',
      email: 'test@example.com',
      image: 'https://example.com/image.jpg',
      twoFactor: true,
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
