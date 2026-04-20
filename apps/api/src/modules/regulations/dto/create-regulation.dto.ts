import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegulationDto {
  @ApiProperty({ example: 'UU No. 13 Tahun 2003 tentang Ketenagakerjaan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @ApiProperty({ example: 'UU 13/2003' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  regulationNumber!: string;

  @ApiProperty({ example: 'UU', enum: ['UU', 'PP', 'Perpres', 'Permen', 'Perda'] })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({ example: 'DPR RI' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  issuedBy!: string;

  @ApiProperty({ example: '2003-03-25' })
  @IsDateString()
  issuedDate!: string;

  @ApiProperty({ example: '2003-03-25' })
  @IsDateString()
  effectiveDate!: string;

  @ApiProperty({ example: 'active', enum: ['active', 'amended', 'revoked'] })
  @IsString()
  @IsNotEmpty()
  status!: string;

  @ApiPropertyOptional({ type: [String], example: ['all'] })
  @IsOptional()
  sectorTags?: string[];

  @ApiProperty({ example: 'https://jdih.kemnaker.go.id/...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  sourceUrl!: string;

  @ApiProperty({ description: 'Regulation full text content' })
  @IsString()
  @IsNotEmpty()
  contentRaw!: string;
}
