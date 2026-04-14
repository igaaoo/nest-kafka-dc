import { IsNotEmpty, IsString } from 'class-validator';

export class VehicleEntryDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  chassi: string;

  @IsString()
  @IsNotEmpty()
  destination: string;
}
