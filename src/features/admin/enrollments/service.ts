import api from '../../../services/api';
import type {
  AdminEnrollmentManagementData,
  ApprovalRequest,
  AttendanceConfigurationResponse,
  EnrollmentListResponse,
  RejectionRequest,
} from './models';

export async function getAdminEnrollmentManagement(): Promise<AdminEnrollmentManagementData> {
  const [enrollments, attendanceConfiguration] = await Promise.all([
    api.get<EnrollmentListResponse>('/admin/enrollments'),
    api.get<AttendanceConfigurationResponse>('/admin/attendance-config'),
  ]);

  return {
    enrollments: enrollments.data,
    groups: attendanceConfiguration.data.groups,
  };
}

export async function approveAdminEnrollment(
  enrollmentId: number,
  request: ApprovalRequest,
): Promise<void> {
  await api.post(`/admin/enrollments/${enrollmentId}/approve`, request);
}

export async function rejectAdminEnrollment(
  enrollmentId: number,
  request: RejectionRequest = {},
): Promise<void> {
  await api.post(`/admin/enrollments/${enrollmentId}/reject`, request);
}
