import api from '../../../services/api';
import type { AttendanceConfigurationResponse } from '../enrollments/models';
import { getAdminVolunteers } from '../volunteers/service';
import type { AdminReportsData } from './models';

export async function getAdminReports(): Promise<AdminReportsData> {
  const [config, volunteers] = await Promise.all([
    api.get<AttendanceConfigurationResponse>('/admin/attendance-config'),
    getAdminVolunteers({ enrollmentType: 'S' }),
  ]);

  return {
    config: config.data,
    volunteers,
  };
}

export function getAdminReportsError(error: any, fallback: string): string {
  return error.response?.data?.error
    ?? error.response?.data?.message
    ?? fallback;
}
