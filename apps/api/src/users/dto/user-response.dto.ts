import { UserRole } from '@autograder/database';

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  githubUsername: string | null;
  createdAt: Date;
  updatedAt: Date;
}
