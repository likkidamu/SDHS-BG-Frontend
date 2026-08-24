import api from '../../../services/api';
import type {
  TeacherGradingDashboardResponse,
  UpdateTeacherGradeRequest,
  UpdateTeacherGradeResponse,
} from './models';

export async function getTeacherGradingDashboard(): Promise<TeacherGradingDashboardResponse> {
  const response = await api.get<TeacherGradingDashboardResponse>('/teacher/dashboard');
  return response.data;
}

export async function updateTeacherGrade(
  request: UpdateTeacherGradeRequest,
): Promise<UpdateTeacherGradeResponse> {
  const response = await api.post<UpdateTeacherGradeResponse>('/teacher/grade', request);
  return response.data;
}

export function getTeacherGradingError(error: any, fallback: string): string {
  return error.response?.data?.error
    ?? error.response?.data?.message
    ?? fallback;
}
