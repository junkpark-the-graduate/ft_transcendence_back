// import { Test, TestingModule } from '@nestjs/testing';
// import { UserController } from './user.controller';
// import { UserService } from './user.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
//
// describe('UserController', () => {
//   let userController: UserController;
//   let userService: UserService;
//
//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [UserController],
//       providers: [
//         {
//           provide: UserService,
//           useValue: {
//             create: jest.fn().mockResolvedValue({
//               id: 1,
//               email: 'test@example.com',
//               name: 'user1',
//               image: 'https://example.com/image.jpg',
//             }),
//             findOne: jest.fn().mockResolvedValue({
//               id: 1,
//               email: 'test@example.com',
//               name: 'user1',
//               image: 'https://example.com/image.jpg',
//             }),
//             update: jest.fn().mockResolvedValue({
//               id: 1,
//               email: 'test@example.com',
//               name: 'user1_updated',
//               image: 'https://example.com/image.jpg',
//               twoFactor: true,
//             }),
//           },
//         },
//       ],
//     }).compile();
//
//     userController = module.get<UserController>(UserController);
//     userService = module.get<UserService>(UserService);
//   });
//
//   it('should be defined', () => {
//     expect(userController).toBeDefined();
//   });
//
//   it('should create a user and return it', async () => {
//     const createUserDto: CreateUserDto = {
//       id: 1,
//       email: 'test@example.com',
//       name: 'user1',
//       image: 'https://example.com/image.jpg',
//     };
//     expect(await userController.create(createUserDto)).toEqual({
//       id: 1,
//       email: 'test@example.com',
//       name: 'user1',
//       image: 'https://example.com/image.jpg',
//     });
//     expect(userService.create).toHaveBeenCalledWith(createUserDto);
//   });
//
//   it('should find one user by id', async () => {
//     const req = { user: { id: 1 } };
//     expect(await userController.findOne(req)).toEqual({
//       id: 1,
//       email: 'test@example.com',
//       name: 'user1',
//       image: 'https://example.com/image.jpg',
//     });
//     expect(userService.findOne).toHaveBeenCalledWith(1);
//   });
//
//   it('should update user and return it', async () => {
//     const req = { user: { id: 1 } };
//     const updateUserDto: UpdateUserDto = {
//       name: 'user1_updated',
//       twoFactorEnabled: true,
//     };
//     expect(await userController.update(req, updateUserDto)).toEqual({
//       id: 1,
//       email: 'test@example.com',
//       name: 'user1_updated',
//       image: 'https://example.com/image.jpg',
//       twoFactor: true,
//     });
//     expect(userService.update).toHaveBeenCalledWith(1, updateUserDto);
//   });
// });
//
