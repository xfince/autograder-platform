import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ForgotPasswordResponseDto {
  message: string;
  // In development, we include the token for testing
  // In production, this would be sent via email only
  resetToken?: string;
}
