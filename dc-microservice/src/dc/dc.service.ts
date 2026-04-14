import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from 'src/database/prisma.service';
import { CreateTransactionDto } from './dto/transaction.dto';
import { CreateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class DcService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
    private readonly prisma: PrismaService,
  ) { }

  async handleTransactionCreated(transaction: CreateTransactionDto) {
    const user = await firstValueFrom(
      this.authClient.send('get_user', { username: transaction.username }),
    );

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const vehicle = await this.prisma.vehicles.findUnique({
      where: { chassi: transaction.chassi },
    });

    if (!vehicle) {
      return { success: false, message: `Vehicle ${transaction.chassi} not found` };
    }

    if (vehicle.patio === transaction.destination) {
      return { success: false, message: `Vehicle ${transaction.chassi} is already at patio ${transaction.destination}` };
    }

    const existingOpenTransaction = await this.prisma.transactions.findFirst({
      where: { chassi: transaction.chassi, status: 'ABERTA' },
    });

    if (existingOpenTransaction) {
      return { success: false, message: `Vehicle ${transaction.chassi} already has an open transaction` };
    }

    await this.prisma.transactions.create({
      data: {
        chassi: transaction.chassi,
        user_id: user.user_id,
        destination: transaction.destination,
        status: 'ABERTA',
      },
    });

    return { success: true, message: `Transaction for chassi: ${transaction.chassi} created by user: ${user.username}` };
  }

  async handleVehicleCreated(vehicle: CreateVehicleDto) {
    const user = await firstValueFrom(
      this.authClient.send('get_user', { username: vehicle.username }),
    );

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const existing = await this.prisma.vehicles.findUnique({
      where: { chassi: vehicle.chassi },
    });

    if (existing) {
      return { success: false, message: `Vehicle ${vehicle.chassi} already exists` };
    }

    await this.prisma.vehicles.create({
      data: {
        chassi: vehicle.chassi,
        modelo: vehicle.model,
        patio: vehicle.patio,
      },
    });

    return { success: true, message: `Vehicle ${vehicle.chassi} created` };
  }

  async handleVehicleEntry(data: { username: string; chassi: string; destination: string; }) {
    const user = await firstValueFrom(
      this.authClient.send('get_user', { username: data.username }),
    );

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const vehicle = await this.prisma.vehicles.findUnique({
      where: { chassi: data.chassi },
    });

    if (!vehicle) {
      return { success: false, message: `Vehicle ${data.chassi} not found` };
    }

    const transaction = await this.prisma.transactions.findFirst({
      where: {
        chassi: data.chassi,
        user_id: user.user_id,
        destination: data.destination,
        status: 'ABERTA',
      },
    });

    if (!transaction) {
      return { success: false, message: `No matching transaction for chassi ${data.chassi} with destination ${data.destination}` };
    }

    await this.prisma.transactions.update({
      where: { id: transaction.id },
      data: { status: 'EXECUTADA' },
    });

    await this.prisma.vehicles.update({
      where: { chassi: data.chassi },
      data: { patio: data.destination },
    });

    return { success: true, message: `Vehicle ${data.chassi} entered patio ${data.destination}` };
  }
}
