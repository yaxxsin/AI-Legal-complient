import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageFeedbackDto {
  @ApiProperty({ enum: ['up', 'down'] })
  @IsString()
  @IsIn(['up', 'down'])
  feedback!: string;

  @ApiPropertyOptional({ example: 'Jawaban kurang lengkap' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
