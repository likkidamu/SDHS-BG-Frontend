import api from '../../../services/api';
import type {
  AdminTeacherDashboardMessageResponse,
  AdminTeacherDashboardQuery,
  AdminTeacherDashboardResponse,
  SaveAdminTeacherDashboardRowRequest,
} from './models';

export async function getAdminTeacherDashboard(
  query: AdminTeacherDashboardQuery = {},
): Promise<AdminTeacherDashboardResponse> {
  const response = await api.get<AdminTeacherDashboardResponse>('/admin/teachers-dashboard', {
    params: query,
  });
  return response.data;
}

export async function saveAdminTeacherDashboardRow(
  request: SaveAdminTeacherDashboardRowRequest,
): Promise<AdminTeacherDashboardMessageResponse> {
  const response = await api.post<AdminTeacherDashboardMessageResponse>(
    '/admin/teachers-dashboard/save-one',
    request,
  );
  return response.data;
}

export async function deleteAdminTeacherDashboardRow(
  bookingId: number,
): Promise<AdminTeacherDashboardMessageResponse> {
  const response = await api.post<AdminTeacherDashboardMessageResponse>(
    '/admin/teachers-dashboard/delete',
    { bookingId },
  );
  return response.data;
}
