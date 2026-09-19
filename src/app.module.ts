import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ObjectsModule } from './objects/objects.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ObjectsModule,
    ConfigModule,
  ],
})
export class AppModule {}