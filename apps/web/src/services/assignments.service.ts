import apiClient from '@/lib/api-client';

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: string;
  maxAttempts: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    code: string;
    name: string;
  };
  rubric?: {
    id: string;
    name: string;
    totalPoints: number;
  };
  testSuiteCount?: number;
  submissionCount?: number;
}

export interface CreateAssignmentDto {
  title: string;
  description?: string;
  instructions?: string;
  courseId: string;
  dueDate: string;
  maxAttempts?: number;
  rubricId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateAssignmentDto extends Partial<CreateAssignmentDto> {}

export const assignmentsService = {
  async getAll(): Promise<Assignment[]> {
    const response = await apiClient.get<Assignment[]>('/assignments');
    return response.data;
  },

  async getByCourse(courseId: string): Promise<Assignment[]> {
    const response = await apiClient.get<Assignment[]>(`/assignments/course/${courseId}`);
    return response.data;
  },

  async getById(id: string): Promise<Assignment> {
    const response = await apiClient.get<Assignment>(`/assignments/${id}`);
    return response.data;
  },

  async create(data: CreateAssignmentDto): Promise<Assignment> {
    const response = await apiClient.post<Assignment>('/assignments', data);
    return response.data;
  },

  async update(id: string, data: UpdateAssignmentDto): Promise<Assignment> {
    const response = await apiClient.patch<Assignment>(`/assignments/${id}`, data);
    return response.data;
  },

  async publish(id: string): Promise<Assignment> {
    const response = await apiClient.post<Assignment>(`/assignments/${id}/publish`);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/assignments/${id}`);
    return response.data;
  },
};
