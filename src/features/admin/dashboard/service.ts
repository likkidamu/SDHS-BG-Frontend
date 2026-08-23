import api from '../../../services/api';
import type {
  AdminDashboardAvailabilityResponse,
  AdminDashboardData,
  AdminDashboardEnrollmentResponse,
  AdminDashboardVolunteerResponse,
} from './models';

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const [volunteers, enrollments, availability] = await Promise.all([
    api.get<AdminDashboardVolunteerResponse>('/admin/volunteers'),
    api.get<AdminDashboardEnrollmentResponse>('/admin/enrollments'),
    api.get<AdminDashboardAvailabilityResponse>('/admin/teacher-availability'),
  ]);

  return {
    volunteers: volunteers.data,
    enrollments: enrollments.data,
    availability: availability.data,
  };
}
