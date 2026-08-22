import api from '../../../services/api';
import type { StudentDashboardResponse } from './models';

export async function getStudentDashboard(enrollmentId: number) {
  const response = await api.get<StudentDashboardResponse>('/student/home', {
    headers: { 'X-Enrollment-Id': String(enrollmentId) },
  });
  return response.data;
}
