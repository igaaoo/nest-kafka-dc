import { BadRequestException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateUserDto } from './dto/create-user.dto';
import { withKafkaRetry } from 'src/common/kafka-retry.util';

@Injectable()
export class AuthService {
  constructor(@Inject('AUTH_SERVICE') private readonly authService: ClientKafka) { }

  async register(createUserDto: CreateUserDto) {
    let result: { success: boolean; message: string };

    try {
      result = await firstValueFrom(
        this.authService
          .send('auth.register', createUserDto)
          .pipe(withKafkaRetry({ timeoutMs: 5000, maxRetries: 3, baseDelayMs: 500 })),
      ) as { success: boolean; message: string };
    } catch {
      throw new ServiceUnavailableException(
        'Auth service is unavailable. Please try again later.',
      );
    }

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return result;
  }
}
