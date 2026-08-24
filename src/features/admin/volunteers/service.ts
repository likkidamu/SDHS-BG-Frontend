import api from '../../../services/api';
import type {
  AdminVolunteerListResponse,
  AdminVolunteerMessageResponse,
  AdminVolunteerQuery,
  DropAdminVolunteerRequest,
  EditAdminVolunteerRequest,
} from './models';

export async function getAdminVolunteers(
  query: AdminVolunteerQuery = {},
): Promise<AdminVolunteerListResponse> {
  const response = await api.get<AdminVolunteerListResponse>('/admin/volunteers', { params: query });
  return response.data;
}

export async function editAdminVolunteer(
  volunteerId: string,
  request: EditAdminVolunteerRequest,
): Promise<AdminVolunteerMessageResponse> {
  const response = await api.post<AdminVolunteerMessageResponse>(
    `/admin/volunteers/${encodeURIComponent(volunteerId)}/edit`,
    request,
  );
  return response.data;
}

export async function dropAdminVolunteer(
  volunteerId: string,
  request: DropAdminVolunteerRequest,
): Promise<AdminVolunteerMessageResponse> {
  const response = await api.post<AdminVolunteerMessageResponse>(
    `/admin/volunteers/${encodeURIComponent(volunteerId)}/drop`,
    request,
  );
  return response.data;
}

export async function reactivateAdminVolunteer(
  volunteerId: string,
): Promise<AdminVolunteerMessageResponse> {
  const response = await api.post<AdminVolunteerMessageResponse>(
    `/admin/volunteers/${encodeURIComponent(volunteerId)}/reactivate`,
  );
  return response.data;
}
