import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserService', () => {
  let service: UserService;
  let repo: Repository<UserEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user and return it', async () => {
      const dto: CreateUserDto = {
        ftId: 1,
        email: 'test@example.com',
        name: 'testuser',
        image: 'https://example.com/image.jpg',
      };

      const user: UserEntity = { ...dto, twoFactor: false };

      jest.spyOn(repo, 'create').mockReturnValue(user);
      jest.spyOn(repo, 'save').mockResolvedValue(user);

      expect(await service.create(dto)).toEqual(user);
    });
  });

  describe('findOne', () => {
    it('should find one user by id', async () => {
      const user: UserEntity = {
        ftId: 1,
        email: 'test@example.com',
        name: 'testuser',
        image: 'https://example.com/image.jpg',
        twoFactor: false,
      };

      jest.spyOn(repo, 'findOne').mockResolvedValue(user);

      expect(await service.findOne(1)).toEqual(user);
    });
  });

  describe('update', () => {
    it('should update user and return it', async () => {
      const dto: UpdateUserDto = { name: 'newuser', twoFactor: true };

      const user: UserEntity = {
        ftId: 1,
        email: 'test@example.com',
        name: 'testuser',
        image: 'https://example.com/image.jpg',
        twoFactor: false,
      };

      const updatedUser: UserEntity = {
        ...user,
        ...dto,
      };

      jest.spyOn(repo, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(repo, 'findOne').mockResolvedValue(updatedUser);

      await service.update(1, dto);
      const result = await service.findOne(1);

      expect(result).toEqual(updatedUser);
    });
  });
});
