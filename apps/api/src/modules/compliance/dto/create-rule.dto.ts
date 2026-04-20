import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  IsIn,
  IsDateString,
} from 'class-validator';

/** DTO for creating a compliance rule (admin) */
export class CreateRuleDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  categoryId!: string;

  @IsString()
  @IsIn(['critical', 'high', 'medium', 'low'])
  priority!: string;

  @IsObject()
  conditions!: Record<string, unknown>;

  @IsArray()
  legalReferences!: Record<string, unknown>[];

  @IsOptional()
  @IsObject()
  dueDateLogic?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  guidanceText?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}
