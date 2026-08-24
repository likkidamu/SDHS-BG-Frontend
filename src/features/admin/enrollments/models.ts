export type EnrollmentProgramType = 'MEMORIZATION' | 'REVISION' | 'FLUENT';

export interface PendingEnrollment {
  enrollmentId: number;
  volunteerId: string;
  volunteerName: string;
  programType: EnrollmentProgramType;
  requestedDate: string;
  currentActivePrograms: EnrollmentProgramType[];
  currentPendingPrograms: EnrollmentProgramType[];
  defaultEnrollment: boolean;
}

export interface ActiveEnrollment {
  enrollmentId: number;
  volunteerId: string;
  volunteerName: string;
  programType: EnrollmentProgramType;
  groupId: string | null;
  slotEligible: boolean;
  defaultEnrollment: boolean;
}

export interface EnrollmentListResponse {
  enrollments: PendingEnrollment[];
  total: number;
  activeEnrollments: ActiveEnrollment[];
}

export interface AttendanceConfigurationGroup {
  groupId: string;
  groupName: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

export interface AttendanceConfigurationResponse {
  groups: AttendanceConfigurationGroup[];
}

export interface ApprovalRequest {
  groupId: string;
  slotEligible: boolean;
}

export interface RejectionRequest {
  reason?: string;
}

export interface AdminEnrollmentManagementData {
  enrollments: EnrollmentListResponse;
  groups: AttendanceConfigurationGroup[];
}
