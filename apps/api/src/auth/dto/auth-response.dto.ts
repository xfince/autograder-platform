import { UserRole } from '@autograder/database';

export class AuthUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
  user: AuthUserDto;
}

export class RefreshResponseDto {
  accessToken: string;
  expiresIn: number;
}
