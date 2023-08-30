import { Module } from '@nestjs/common';
import { DummyController } from './dummy.controller';
import { DummyService } from './dummy.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [DummyController],
  providers: [DummyService],
})
export class DummyModule {}
