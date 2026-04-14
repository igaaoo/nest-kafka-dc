import { IsNotEmpty, IsString } from "class-validator";

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  chassi: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  patio: string;
}