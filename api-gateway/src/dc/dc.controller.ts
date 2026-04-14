import { Body, Controller, Patch, Post } from '@nestjs/common';
import { DcService } from './dc.service';
import { VehicleEntryDto } from './dto/change-patio.dto';
import { CreateTransactionDto } from './dto/transaction.dto';
import { CreateVehicleDto } from './dto/vehicle.dto';

@Controller('dc')
export class DcController {
  constructor(private readonly dcService: DcService) { }

  @Post('transaction')
  createTransaction(@Body() transactionDto: CreateTransactionDto) {
    return this.dcService.createTransaction(transactionDto);
  }

  @Post('vehicle')
  createVehicle(@Body() vehicleDto: CreateVehicleDto) {
    return this.dcService.createVehicle(vehicleDto);
  }

  @Patch('entry')
  vehicleEntry(@Body() vehicleEntryDto: VehicleEntryDto) {
    return this.dcService.vehicleEntry(vehicleEntryDto);
  }
}
