import api from '../../../services/api';
import type { CreateEnrollmentRequest, CreateEnrollmentResponse } from './models';

export async function createStudentEnrollment(
  request: CreateEnrollmentRequest,
): Promise<CreateEnrollmentResponse> {
  const response = await api.post<CreateEnrollmentResponse>('/student/enrollments', request);
  return response.data;
}

export function getEnrollmentRequestError(error: any, fallback: string): string {
  return error.response?.data?.error
    ?? error.response?.data?.message
    ?? fallback;
}
