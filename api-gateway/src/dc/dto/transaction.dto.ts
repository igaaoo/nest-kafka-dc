import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  chassi: string;

  @IsNotEmpty()
  @IsString()
  destination: string;
}
