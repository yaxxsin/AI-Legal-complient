import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';

/** DTO for updating an existing document template */
export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsString()
  @IsOptional()
  templateHtml?: string;

  @IsObject()
  @IsOptional()
  formSchema?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
