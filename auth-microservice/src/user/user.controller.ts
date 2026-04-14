import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @MessagePattern('auth.register')
  register(data: CreateUserDto) {
    return this.userService.register(data);
  }

  @MessagePattern('get_user')
  getUser(data: { username: string; }) {
    return this.userService.findByUsername(data.username);
  }
}
