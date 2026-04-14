import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka, MessagePattern } from '@nestjs/microservices';
import { DcService } from './dc.service';
import { CreateTransactionDto } from './dto/transaction.dto';
import { CreateVehicleDto } from './dto/vehicle.dto';

@Controller('dc')
export class DcController implements OnModuleInit {
  constructor(
    private readonly dcService: DcService,
    @Inject('AUTH_SERVICE') private readonly authService: ClientKafka,
  ) { }

  @MessagePattern('transaction.create')
  handleTransactionCreated(transaction: CreateTransactionDto) {
    return this.dcService.handleTransactionCreated(transaction);
  }

  @MessagePattern('vehicle.create')
  handleVehicleCreated(vehicle: CreateVehicleDto) {
    return this.dcService.handleVehicleCreated(vehicle);
  }

  @MessagePattern('vehicle.entry')
  handleVehicleEntry(data: { username: string; chassi: string; destination: string }) {
    return this.dcService.handleVehicleEntry(data);
  }

  onModuleInit() {
    this.authService.subscribeToResponseOf('get_user');
  }
}
