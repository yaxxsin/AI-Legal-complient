import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBusinessProfileDto {
  @ApiProperty({ description: 'Jenis badan usaha', example: 'PT' })
  @IsString()
  @IsNotEmpty({ message: 'Jenis usaha wajib diisi' })
  @MaxLength(50)
  entityType!: string;
}
