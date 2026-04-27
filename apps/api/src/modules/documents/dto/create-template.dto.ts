import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';

/** DTO for creating a new document template */
export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category!: string;

  @IsString()
  @IsNotEmpty()
  templateHtml!: string;

  @IsObject()
  formSchema!: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
