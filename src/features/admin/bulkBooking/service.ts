import api from '../../../services/api';
import type {
  AllowedSlokasResponse,
  BulkBookingResponse,
  BulkBookingSaveRequest,
  BulkBookingSaveResponse,
  DeleteBookingRequest,
  DeleteBookingResponse,
  StudentSearchResult,
} from './models';

export async function getAdminBulkBooking(date: string): Promise<BulkBookingResponse> {
  const response = await api.get<BulkBookingResponse>('/admin/bulk-booking', {
    params: { date },
  });
  return response.data;
}

export async function searchAdminBookingStudents(query: string): Promise<StudentSearchResult[]> {
  const response = await api.get<StudentSearchResult[]>('/admin/students/search', {
    params: { q: query },
  });
  return response.data;
}

export async function getAdminAllowedSlokas(
  volunteerId: string,
  date: string,
  chapterId: number,
): Promise<AllowedSlokasResponse> {
  const response = await api.get<AllowedSlokasResponse>('/admin/allowed-slokas', {
    params: { volunteerId, date, chapterId },
  });
  return response.data;
}

export async function saveAdminBulkBookings(
  request: BulkBookingSaveRequest,
): Promise<BulkBookingSaveResponse> {
  const response = await api.post<BulkBookingSaveResponse>('/admin/bulk-booking/save', request);
  return response.data;
}

export async function deleteAdminBulkBooking(
  request: DeleteBookingRequest,
): Promise<DeleteBookingResponse> {
  const response = await api.post<DeleteBookingResponse>('/admin/bulk-booking/delete', request);
  return response.data;
}
