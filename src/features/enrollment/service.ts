import api from '../../services/api';
import type { LearningEnrollmentsResponse } from './models';

export async function getLearningEnrollments() {
  const response = await api.get<LearningEnrollmentsResponse>('/student/enrollments');
  return response.data.enrollments;
}
