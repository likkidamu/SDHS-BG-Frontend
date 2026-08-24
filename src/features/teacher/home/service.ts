import api from '../../../services/api';
import type { TeacherAvailabilityResponse } from '../availability/models';
import { getTeacherGradingDashboard } from '../grading/service';
import type { TeacherHomeData, TeacherHomeResponse } from './models';

export async function getTeacherHome(): Promise<TeacherHomeData> {
  const [home, availability, grading] = await Promise.all([
    api.get<TeacherHomeResponse>('/teacher/home'),
    api.get<TeacherAvailabilityResponse>('/teacher/my-availability'),
    getTeacherGradingDashboard(),
  ]);

  return {
    home: home.data,
    availability: availability.data,
    grading,
  };
}
