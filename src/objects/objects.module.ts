import { Module } from '@nestjs/common';
import { ObjectsService } from './objects.service';
import { ObjectsController } from './objects.controller';
import { ObjectsGateway } from './objects.gateway';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [ObjectsController],
  providers: [ObjectsService, ObjectsGateway],
  exports: [ObjectsService],
})
export class ObjectsModule {}