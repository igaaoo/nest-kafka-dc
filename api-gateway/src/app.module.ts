import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DcModule } from './dc/dc.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [DcModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
