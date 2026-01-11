export class CourseResponseDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  semester: string;
  year: number;
  isActive: boolean;
  professorId: string;
  professor?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  enrollmentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
