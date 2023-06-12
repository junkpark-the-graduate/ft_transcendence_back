// import { DataSource, Repository } from 'typeorm';
// import { User } from './user.entity';
// import { Injectable } from '@nestjs/common';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UserStatus } from './users-status.enum';
// import { User } from 'src/auth/user.entity';
// import { Get } from '@nestjs/common';

// @Injectable()
// export class UserRepository extends Repository<User> {
//   constructor(private readonly dataSource: DataSource) {
//     const baseRepository = dataSource.getRepository(User);
//     super(
//       baseRepository.target,
//       baseRepository.manager,
//       baseRepository.queryRunner,
//     );
//   }

//   async createUser(
//     createUserDto: CreateUserDto,
//     user: User,
//   ): Promise<User> {
//     const { title, description } = createUserDto;

//     const user = this.create({
//       title,
//       description,
//       status: UserStatus.PUBLIC,
//       user,
//     });

//     await this.save(user);
//     return user;
//   }

//   async getAllUsers(user: User): Promise<User[]> {
//     const query = this.createQueryBuilder('user');

//     query.where('user.userId = :userId', { userId: user.id });

//     const users = await query.getMany();
//     return users;
//   }
// }
