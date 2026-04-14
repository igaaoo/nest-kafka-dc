import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(@Inject('AUTH_SERVICE') private readonly authService: ClientKafka) { }

  async register(createUserDto: CreateUserDto) {
    const result = await firstValueFrom(
      this.authService.send('auth.register', createUserDto),
    ) as { success: boolean; message: string };

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return result;
  }
}
