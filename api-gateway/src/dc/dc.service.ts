import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { VehicleEntryDto } from './dto/change-patio.dto';
import { CreateTransactionDto } from './dto/transaction.dto';
import { CreateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class DcService {
  constructor(
    @Inject('DC_SERVICE') private readonly dcClient: ClientKafka,
  ) { }

  async createTransaction({ username, chassi, destination }: CreateTransactionDto) {
    const result = await firstValueFrom(
      this.dcClient.send('transaction.create', JSON.stringify({ username, chassi, destination })),
    ) as { success: boolean; message: string };

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return result;
  }

  async createVehicle({ username, chassi, model, patio }: CreateVehicleDto) {
    const result = await firstValueFrom(
      this.dcClient.send('vehicle.create', JSON.stringify({ username, chassi, model, patio })),
    ) as { success: boolean; message: string };

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return result;
  }

  async vehicleEntry({ username, chassi, destination }: VehicleEntryDto) {
    const result = await firstValueFrom(
      this.dcClient.send('vehicle.entry', JSON.stringify({ username, chassi, destination })),
    ) as { success: boolean; message: string };

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return result;
  }
}
