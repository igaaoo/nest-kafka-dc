import { BadRequestException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { VehicleEntryDto } from './dto/change-patio.dto';
import { CreateTransactionDto } from './dto/transaction.dto';
import { CreateVehicleDto } from './dto/vehicle.dto';
import { withKafkaRetry } from 'src/common/kafka-retry.util';

@Injectable()
export class DcService {
  constructor(
    @Inject('DC_SERVICE') private readonly dcClient: ClientKafka,
  ) { }

  async createTransaction({ username, chassi, destination }: CreateTransactionDto) {
    let result: { success: boolean; message: string };

    try {
      result = await firstValueFrom(
        this.dcClient
          .send('transaction.create', JSON.stringify({ username, chassi, destination }))
          .pipe(withKafkaRetry({ timeoutMs: 5000, maxRetries: 3, baseDelayMs: 500 })),
      ) as { success: boolean; message: string };
    } catch {
      throw new ServiceUnavailableException(
        'DC service is unavailable. Please try again later.',
      );
    }

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return result;
  }

  async createVehicle({ username, chassi, model, patio }: CreateVehicleDto) {
    let result: { success: boolean; message: string };

    try {
      result = await firstValueFrom(
        this.dcClient
          .send('vehicle.create', JSON.stringify({ username, chassi, model, patio }))
          .pipe(withKafkaRetry({ timeoutMs: 5000, maxRetries: 3, baseDelayMs: 500 })),
      ) as { success: boolean; message: string };
    } catch {
      throw new ServiceUnavailableException(
        'DC service is unavailable. Please try again later.',
      );
    }

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return result;
  }

  async vehicleEntry({ username, chassi, destination }: VehicleEntryDto) {
    let result: { success: boolean; message: string };

    try {
      result = await firstValueFrom(
        this.dcClient
          .send('vehicle.entry', JSON.stringify({ username, chassi, destination }))
          .pipe(withKafkaRetry({ timeoutMs: 5000, maxRetries: 3, baseDelayMs: 500 })),
      ) as { success: boolean; message: string };
    } catch {
      throw new ServiceUnavailableException(
        'DC service is unavailable. Please try again later.',
      );
    }

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return result;
  }
}
