import { IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStepDto {
  @ApiProperty({ description: 'Current wizard step (1-5)', example: 2 })
  @IsInt()
  @Min(1)
  @Max(5)
  step!: number;

  @ApiPropertyOptional({ description: 'Step-specific field data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
