import api from '../../../services/api';
import type { TeacherAvailabilityResponse } from '../availability/models';
import type {
  TeacherDashboardResponse,
  TeacherHomeData,
  TeacherHomeResponse,
} from './models';

export async function getTeacherHome(): Promise<TeacherHomeData> {
  const [home, availability, grading] = await Promise.all([
    api.get<TeacherHomeResponse>('/teacher/home'),
    api.get<TeacherAvailabilityResponse>('/teacher/my-availability'),
    api.get<TeacherDashboardResponse>('/teacher/dashboard'),
  ]);

  return {
    home: home.data,
    availability: availability.data,
    grading: grading.data,
  };
}
