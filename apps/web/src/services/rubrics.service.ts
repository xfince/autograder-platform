import apiClient from '@/lib/api-client';

export interface Criterion {
  id: string;
  name: string;
  description?: string;
  maxPoints: number;
  weight: number;
  evaluationMethod: 'MANUAL' | 'UNIT_TEST' | 'GPT_SEMANTIC' | 'HYBRID';
  excellentDescription?: string;
  goodDescription?: string;
  fairDescription?: string;
  poorDescription?: string;
}

export interface Rubric {
  id: string;
  name: string;
  description?: string;
  totalPoints: number;
  passingGrade: number;
  createdAt: string;
  updatedAt: string;
  criteria?: Criterion[];
  assignment?: {
    id: string;
    title: string;
  };
}

export interface CreateRubricDto {
  name: string;
  description?: string;
  totalPoints: number;
  passingGrade: number;
  criteria: Array<{
    name: string;
    description?: string;
    maxPoints: number;
    weight: number;
    evaluationMethod: 'MANUAL' | 'UNIT_TEST' | 'GPT_SEMANTIC' | 'HYBRID';
    excellentDescription?: string;
    goodDescription?: string;
    fairDescription?: string;
    poorDescription?: string;
  }>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateRubricDto extends Partial<CreateRubricDto> {}

export const rubricsService = {
  async getAll(): Promise<Rubric[]> {
    const response = await apiClient.get<Rubric[]>('/rubrics');
    return response.data;
  },

  async getById(id: string): Promise<Rubric> {
    const response = await apiClient.get<Rubric>(`/rubrics/${id}`);
    return response.data;
  },

  async create(data: CreateRubricDto): Promise<Rubric> {
    const response = await apiClient.post<Rubric>('/rubrics', data);
    return response.data;
  },

  async uploadJson(file: File): Promise<Rubric> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<Rubric>('/rubrics/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async update(id: string, data: UpdateRubricDto): Promise<Rubric> {
    const response = await apiClient.patch<Rubric>(`/rubrics/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/rubrics/${id}`);
    return response.data;
  },
};
