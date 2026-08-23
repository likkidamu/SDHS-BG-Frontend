export interface TeacherHomeResponse {
  volunteerId: string;
  teacherName: string;
  totalExams: number;
  gradedCount: number;
  pendingCount: number;
  uniqueStudents: number;
  totalSessions: number;
  avgMem: string;
  avgPro: string;
  gradeDist: Record<string, number>;
  chapterCounts: Record<string, number>;
}

export interface TeacherAvailabilitySlot {
  id: number;
  name: string;
}

export interface TeacherAvailabilityResponse {
  examDate: string;
  availableSlots: TeacherAvailabilitySlot[];
  selectedSlotIds: number[];
}

export interface TeacherDashboardBooking {
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

export interface TeacherDashboardResponse {
  volunteerId: string;
  bookings: TeacherDashboardBooking[];
  gradesList: string[];
}

export interface TeacherHomeData {
  home: TeacherHomeResponse;
  availability: TeacherAvailabilityResponse;
  grading: TeacherDashboardResponse;
}
