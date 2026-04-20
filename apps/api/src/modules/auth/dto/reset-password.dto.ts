import { IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-from-email' })
  @IsString()
  @IsNotEmpty({ message: 'Token wajib diisi' })
  token!: string;

  @ApiProperty({ example: 'NewSecure1' })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password harus mengandung minimal 1 huruf besar dan 1 angka',
  })
  password!: string;
}
