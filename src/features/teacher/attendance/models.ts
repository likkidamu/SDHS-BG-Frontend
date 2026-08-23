export interface TeacherAttendanceQuery {
  groupId?: string;
  weekStart?: string;
}

export interface AttendanceVolunteer {
  id: number;
  volunteerId: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  groupId: string | null;
  enrollmentType: string | null;
  createdAt: string;
  updatedAt: string | null;
  slotEligible: boolean;
  status: string;
  statusReason: string | null;
  statusUpdatedAt: string | null;
  statusUpdatedBy: string | null;
  reactivatedAt: string | null;
  passwordHash: string | null;
  role: string;
  trackType: string | null;
}

export interface TeacherAttendanceResponse {
  teacherVid: string;
  groupId: string | null;
  groups: string[];
  weekStart: string;
  weekEnd: string;
  weekDates: string[];
  dateLabels: Record<string, string>;
  students: AttendanceVolunteer[];
  presentMap: Record<string, boolean>;
  noClassMap: Record<string, boolean>;
  groupStartDate: string | null;
  groupEndDate: string | null;
  today: string;
}

export interface SaveTeacherAttendanceRequest {
  groupId: string;
  weekStart?: string;
  [parameter: string]: string | string[] | undefined;
}

export interface SaveTeacherAttendanceResponse {
  message: string;
}
