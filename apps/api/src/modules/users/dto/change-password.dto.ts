import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  @IsNotEmpty({ message: 'Password lama wajib diisi' })
  oldPassword!: string;

  @ApiProperty({ description: 'New password (min 8 chars, 1 uppercase, 1 number)' })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password harus mengandung minimal 1 huruf besar dan 1 angka',
  })
  newPassword!: string;
}
