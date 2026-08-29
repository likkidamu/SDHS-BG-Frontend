import api from '../../../services/api';
import type { CreateEnrollmentRequest, CreateEnrollmentResponse } from './models';

export async function createStudentEnrollment(
  request: CreateEnrollmentRequest,
): Promise<CreateEnrollmentResponse> {
  const response = await api.post<CreateEnrollmentResponse>('/student/enrollments', request);
  return response.data;
}
