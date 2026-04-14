import { Module } from '@nestjs/common';
import { DcService } from './dc.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  providers: [DcService],
  imports: [
    DatabaseModule,
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'auth-service',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          producer: {
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ]
})
export class DcModule { }
