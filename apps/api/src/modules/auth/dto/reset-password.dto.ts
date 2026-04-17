import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'NewSecure1' })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password harus mengandung minimal 1 huruf besar dan 1 angka',
  })
  password!: string;
}
