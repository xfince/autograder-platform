import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@autograder/database';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
