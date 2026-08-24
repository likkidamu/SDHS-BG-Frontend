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

export async function makeAdminEnrollmentDefault(enrollmentId: number): Promise<void> {
  await api.post(`/admin/enrollments/${enrollmentId}/default`);
}

export async function completeAdminEnrollment(enrollmentId: number): Promise<void> {
  await api.post(`/admin/enrollments/${enrollmentId}/complete`);
}

export async function dropActiveAdminEnrollment(enrollmentId: number): Promise<void> {
  await api.post(`/admin/enrollments/${enrollmentId}/drop`);
}
