import api from '../../../services/api';
import type {
  SaveTeacherAttendanceRequest,
  SaveTeacherAttendanceResponse,
  TeacherAttendanceQuery,
  TeacherAttendanceResponse,
} from './models';

const ATTENDANCE_ENDPOINT = '/teacher/attendance';

export async function getTeacherAttendance(
  query: TeacherAttendanceQuery = {},
): Promise<TeacherAttendanceResponse> {
  const response = await api.get<TeacherAttendanceResponse>(ATTENDANCE_ENDPOINT, {
    params: query,
  });
  return response.data;
}

export function buildTeacherAttendanceRequest(
  groupId: string,
  weekStart: string,
  present: Record<string, boolean>,
  noClass: Record<string, boolean>,
): SaveTeacherAttendanceRequest {
  const request: SaveTeacherAttendanceRequest = { groupId, weekStart };

  Object.entries(noClass).forEach(([date, marked]) => {
    if (marked) request[`nc_${date}`] = '1';
  });
  Object.entries(present).forEach(([key, marked]) => {
    if (!marked) return;
    const [date, volunteerId] = key.split('|');
    if (date && volunteerId) request[`p_${date}_${volunteerId}`] = '1';
  });

  return request;
}

export async function saveTeacherAttendance(
  request: SaveTeacherAttendanceRequest,
): Promise<SaveTeacherAttendanceResponse> {
  const response = await api.post<SaveTeacherAttendanceResponse>(ATTENDANCE_ENDPOINT, request);
  return response.data;
}
