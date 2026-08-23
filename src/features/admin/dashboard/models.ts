export interface AdminDashboardVolunteer {
  volunteerId: string;
  name: string;
  groupId: string | null;
  groupName: string | null;
  enrollmentType: string | null;
  trackType: string | null;
  status: string;
  statusReason: string | null;
  slotEligible: boolean | null;
  email: string | null;
  phoneNumber: string | null;
  createdAt: string | null;
}

export interface AdminDashboardVolunteerResponse {
  volunteers: AdminDashboardVolunteer[];
  total: number;
}

export type AdminDashboardProgramType = 'MEMORIZATION' | 'REVISION' | 'FLUENT';

export interface AdminDashboardEnrollment {
  enrollmentId: number;
  volunteerId: string;
  volunteerName: string;
  programType: AdminDashboardProgramType;
  requestedDate: string;
  currentActivePrograms: AdminDashboardProgramType[];
  currentPendingPrograms: AdminDashboardProgramType[];
  defaultEnrollment: boolean;
}

export interface AdminDashboardActiveEnrollment {
  enrollmentId: number;
  volunteerId: string;
  volunteerName: string;
  programType: AdminDashboardProgramType;
  groupId: string | null;
  slotEligible: boolean;
  defaultEnrollment: boolean;
}

export interface AdminDashboardEnrollmentResponse {
  enrollments: AdminDashboardEnrollment[];
  total: number;
  activeEnrollments: AdminDashboardActiveEnrollment[];
}

export interface AdminDashboardAvailabilitySummary {
  teachers: number;
  submitted: number;
  pending: number;
  availabilityWindows: number;
}

export interface AdminDashboardTeacherAvailability {
  volunteerId: string;
  name: string;
  phoneNumber: string | null;
  status: 'SUBMITTED' | 'PENDING';
  selectedSlotIds: number[];
}

export interface AdminDashboardSlot {
  id: number;
  name: string;
}

export interface AdminDashboardAvailabilityResponse {
  date: string;
  summary: AdminDashboardAvailabilitySummary;
  teachers: AdminDashboardTeacherAvailability[];
  slots: AdminDashboardSlot[];
}

export interface AdminDashboardData {
  volunteers: AdminDashboardVolunteerResponse;
  enrollments: AdminDashboardEnrollmentResponse;
  availability: AdminDashboardAvailabilityResponse;
}
