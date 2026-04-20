import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConversationDto {
  @ApiPropertyOptional({ example: 'Pertanyaan PKWT & Ketenagakerjaan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;
}
