// import { Test, TestingModule } from '@nestjs/testing';
// import { UserService } from './user.service';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { UserEntity, EUserStatus } from './user.entity';
// import { Repository } from 'typeorm';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
//
// describe('UserService', () => {
//   let service: UserService;
//   let repo: Repository<UserEntity>;
//
//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         UserService,
//         {
//           provide: getRepositoryToken(UserEntity),
//           useClass: Repository,
//         },
//       ],
//     }).compile();
//
//     service = module.get<UserService>(UserService);
//     repo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
//   });
//
//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });
//
//   describe('create', () => {
//     it('should create a user and return it', async () => {
//       const dto: CreateUserDto = {
//         id: 1,
//         email: 'test@example.com',
//         name: 'testuser',
//         image: 'https://example.com/image.jpg',
//       };
//
//       const user: CreateUserDto = { ...dto, twoFactorEnabled: false, status: 0, mmr: 1000};
//
//       jest.spyOn(repo, 'create').mockReturnValue(user);
//       jest.spyOn(repo, 'save').mockResolvedValue(user);
//
//       expect(await service.create(dto)).toEqual(user);
//     });
//   });
//
//   describe('findOne', () => {
//     it('should find one user by id', async () => {
//       const user: CreateUserDto = {
//         id: 1,
//         email: 'test@example.com',
//         name: 'testuser',
//         image: 'https://example.com/image.jpg',
//         twoFactorEnabled: false,
//         status: EUserStatus.online,
//         mmr: 1000,
//       };
//
//       jest.spyOn(repo, 'findOne').mockResolvedValue(user);
//
//       expect(await service.findOne(1)).toEqual(user);
//     });
//   });
//
//   describe('update', () => {
//     it('should update user and return it', async () => {
//       const dto: UpdateUserDto = { name: 'newuser', twoFactorEnabled: true };
//
//       const user: UserEntity = {
//         id: 1,
//         email: 'test@example.com',
//         name: 'testuser',
//         image: 'https://example.com/image.jpg',
//         twoFactorEnabled: false,
//         status: 0,
//         mmr: 1000,
//       };
//
//       const updatedUser: UserEntity = {
//         ...user,
//         ...dto,
//       };
//
//       jest.spyOn(repo, 'update').mockResolvedValue({ affected: 1 } as any);
//       jest.spyOn(repo, 'findOne').mockResolvedValue(updatedUser);
//
//       await service.update(1, dto);
//       const result = await service.findOne(1);
//
//       expect(result).toEqual(updatedUser);
//     });
//   });
// });
//
