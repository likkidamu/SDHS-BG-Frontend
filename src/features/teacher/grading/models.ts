export interface TeacherGradingBooking {
  id: number;
  date: string | null;
  formattedDate: string | null;
  cancelled: boolean;
  slotName?: string;
  chapterNumber?: number;
  chapterName?: string;
  slokaCount: number | null;
  memorizationGrade: string | null;
  pronunciationGrade: string | null;
  teacherComment: string | null;
  studentName: string;
  studentPhone: string | null;
  studentVolunteerId: string;
}

export interface TeacherGradingDashboardResponse {
  volunteerId: string;
  bookings: TeacherGradingBooking[];
  gradesList: string[];
}

export interface UpdateTeacherGradeRequest {
  bookingId: number;
  memorizationGrade?: string;
  pronunciationGrade?: string;
  comment?: string;
}

export interface UpdateTeacherGradeResponse {
  ok: boolean;
  message: string;
}
