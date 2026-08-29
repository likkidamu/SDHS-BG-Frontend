import type { AttendanceConfigurationResponse } from '../enrollments/models';
import type { AdminVolunteerListResponse } from '../volunteers/models';

export interface AdminReportsData {
  config: AttendanceConfigurationResponse;
  volunteers: AdminVolunteerListResponse;
}
