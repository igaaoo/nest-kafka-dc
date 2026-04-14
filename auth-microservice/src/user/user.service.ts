import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  private users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'a@gmail.com',
      password: 'password',
    },
    {
      id: '2',
      name: 'Jane Doe',
      email: 'b@gmail.com',
      password: 'password',
    },
  ];


  async register(data: CreateUserDto) {
    try {
      const user = await this.prisma.users.create({
        data: {
          username: data.username,
          status: 'ATIVO',
        },
      });
      return { success: true, message: `User ${user.username} registered successfully` };
    } catch (err) {
      return { success: false, message: `Failed to register user: ${err.message}` };
    }
  }

  findByUsername(username: string) {
    return this.prisma.users.findUnique({
      where: { username },
    });
  }
}
