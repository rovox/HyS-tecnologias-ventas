import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

const emailOpts = { require_tld: false as const };

export class LoginDto {
  @ApiProperty({ example: 'dennis.ventas@demo.hs.local' })
  @IsEmail(emailOpts)
  email: string;

  @ApiProperty({ example: 'Demo1234!', minLength: 4 })
  @IsString()
  @MinLength(4)
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'dennis.ventas@demo.hs.local' })
  @IsEmail(emailOpts)
  email: string;
}
