import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { ClientKafka, ClientsModule, Transport } from '@nestjs/microservices';
import { DcController } from './dc.controller';
import { DcService } from './dc.service';

@Module({
  controllers: [DcController],
  providers: [DcService],
  imports: [ClientsModule.register([
    {
      name: 'DC_SERVICE',
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'dc-service',
          brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
        },
        producer: {
          allowAutoTopicCreation: true,
        },
        consumer: {
          groupId: 'dc-consumer',
        },
      },
    },
  ])],
})
export class DcModule implements OnModuleInit {
  constructor(@Inject('DC_SERVICE') private readonly dcClient: ClientKafka) { }

  onModuleInit() {
    this.dcClient.subscribeToResponseOf('transaction.create');
    this.dcClient.subscribeToResponseOf('vehicle.create');
    this.dcClient.subscribeToResponseOf('vehicle.entry');
  }
}
