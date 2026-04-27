import { IsString, IsNotEmpty, IsObject, IsUUID } from 'class-validator';

/** DTO for generating a document from a template */
export class GenerateDocumentDto {
  @IsUUID()
  @IsNotEmpty()
  templateId!: string;

  @IsUUID()
  @IsNotEmpty()
  businessProfileId!: string;

  @IsObject()
  formData!: Record<string, string>;
}
