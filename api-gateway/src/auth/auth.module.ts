import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientKafka, ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'auth-service',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          consumer: {
            groupId: 'auth-consumer',
          },
        },
      },
    ]),
  ]
})
export class AuthModule implements OnModuleInit {
  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientKafka) { }

  onModuleInit() {
    this.authClient.subscribeToResponseOf('auth.register');
  }
}
