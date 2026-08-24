export interface AdminVolunteerQuery {
  q?: string;
  status?: string;
  enrollmentType?: string;
  trackType?: string;
  groupId?: string;
}

export interface AdminVolunteer {
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

export interface AdminVolunteerListResponse {
  volunteers: AdminVolunteer[];
  total: number;
}

export interface EditAdminVolunteerRequest {
  name?: string;
  phoneNumber?: string;
  email?: string | null;
  groupId?: string;
  trackType?: string;
  enrollmentType?: string;
  slotEligible?: boolean;
}

export interface DropAdminVolunteerRequest {
  reason?: string;
}

export interface AdminVolunteerMessageResponse {
  message: string;
}
