import { IsEmail, IsString, MinLength, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @MinLength(2, { message: 'Nama minimal 2 karakter' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  fullName!: string;

  @ApiProperty({ example: 'budi@example.com' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiProperty({ example: 'SecurePass1', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password harus mengandung minimal 1 huruf besar dan 1 angka',
  })
  password!: string;
}
