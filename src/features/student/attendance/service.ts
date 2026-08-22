import api from '../../../services/api';
import type { StudentAttendanceResponse } from './models';

export async function getStudentAttendance(enrollmentId: number) {
  const response = await api.get<StudentAttendanceResponse>('/student/attendance', {
    headers: { 'X-Enrollment-Id': String(enrollmentId) },
  });
  return response.data;
}
