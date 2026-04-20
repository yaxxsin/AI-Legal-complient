import { IsString, IsOptional, IsIn } from 'class-validator';

/** DTO for updating a compliance item status */
export class UpdateItemStatusDto {
  @IsString()
  @IsIn(['pending', 'in_progress', 'completed', 'not_applicable'])
  status!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  evidenceUrl?: string;
}
