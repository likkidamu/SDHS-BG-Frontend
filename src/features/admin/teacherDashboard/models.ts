export interface AdminTeacherDashboardQuery {
  date?: string;
  teacherId?: string;
}

export interface AdminTeacherDashboardBooking {
  id: number;
  volunteerId: string;
  studentName: string;
  studentPhone: string | null;
  slotName?: string;
  chapterId?: number;
  chapterNumber?: number;
  chapterName?: string;
  slokaCount: number | null;
  memorizationGrade: string | null;
  pronunciationGrade: string | null;
  teacherComment: string | null;
  assignedTeacherId?: string;
  assignedTeacherName?: string;
}

export interface AdminTeacherOption {
  volunteerId: string;
  name: string;
}

export interface AdminTeacherDashboardChapter {
  id: number;
  chapterNumber: number;
  chapterName: string;
  allowedSlokas: string;
}

export interface AdminTeacherDashboardResponse {
  date: string;
  selectedTeacherId: string;
  bookings: AdminTeacherDashboardBooking[];
  teachers: AdminTeacherOption[];
  chapters: AdminTeacherDashboardChapter[];
  grades: string[];
}

export interface SaveAdminTeacherDashboardRowRequest {
  bookingId: number;
  memorizationGrade?: string;
  pronunciationGrade?: string;
  comment?: string;
  assignedTeacherId?: string;
}

export interface AdminTeacherDashboardMessageResponse {
  message: string;
}
