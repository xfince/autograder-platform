import apiClient from '@/lib/api-client';

export interface TestFile {
  id: string;
  fileName: string;
  filePath: string;
  content: string;
  isGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  criterionId?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  isTemplate: boolean;
  templateType?: 'JEST' | 'MOCHA' | 'PYTEST' | 'JUNIT';
  parameters?: any;
  createdAt: string;
  updatedAt: string;
  assignment?: {
    id: string;
    title: string;
  };
  testFiles?: TestFile[];
  testFileCount?: number;
}

export interface CreateTestSuiteDto {
  name: string;
  description?: string;
  assignmentId: string;
  isTemplate?: boolean;
  templateType?: 'JEST' | 'MOCHA' | 'PYTEST' | 'JUNIT';
  parameters?: any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateTestSuiteDto extends Partial<CreateTestSuiteDto> {}

export interface UpdateTestFileDto {
  fileName?: string;
  filePath?: string;
  content?: string;
}

export const testSuitesService = {
  async getAll(): Promise<TestSuite[]> {
    const response = await apiClient.get<TestSuite[]>('/test-suites');
    return response.data;
  },

  async getByAssignment(assignmentId: string): Promise<TestSuite[]> {
    const response = await apiClient.get<TestSuite[]>(`/test-suites/assignment/${assignmentId}`);
    return response.data;
  },

  async getById(id: string): Promise<TestSuite> {
    const response = await apiClient.get<TestSuite>(`/test-suites/${id}`);
    return response.data;
  },

  async create(data: CreateTestSuiteDto): Promise<TestSuite> {
    const response = await apiClient.post<TestSuite>('/test-suites', data);
    return response.data;
  },

  async update(id: string, data: UpdateTestSuiteDto): Promise<TestSuite> {
    const response = await apiClient.patch<TestSuite>(`/test-suites/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/test-suites/${id}`);
    return response.data;
  },

  async uploadTestFile(testSuiteId: string, file: File, criterionId?: string): Promise<TestFile> {
    const formData = new FormData();
    formData.append('file', file);

    if (criterionId) {
      formData.append('criterionId', criterionId);
    }

    const response = await apiClient.post<TestFile>(`/test-suites/${testSuiteId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateTestFile(
    testSuiteId: string,
    fileId: string,
    data: UpdateTestFileDto,
  ): Promise<TestFile> {
    const response = await apiClient.patch<TestFile>(
      `/test-suites/${testSuiteId}/files/${fileId}`,
      data,
    );
    return response.data;
  },

  async deleteTestFile(testSuiteId: string, fileId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/test-suites/${testSuiteId}/files/${fileId}`,
    );
    return response.data;
  },
};
