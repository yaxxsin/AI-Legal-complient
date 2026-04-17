import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'budi@example.com' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiProperty({ example: 'SecurePass1' })
  @IsString()
  @MinLength(1, { message: 'Password wajib diisi' })
  password!: string;
}
