import api from '../../../services/api';
import type { StudentGradesResponse } from './models';

export async function getStudentExamHistory(enrollmentId: number) {
  const response = await api.get<StudentGradesResponse>('/student/grades', {
    headers: { 'X-Enrollment-Id': String(enrollmentId) },
  });
  return response.data;
}
