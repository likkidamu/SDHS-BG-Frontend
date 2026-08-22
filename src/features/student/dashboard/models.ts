export interface StudentDashboardBooking {
  id: number;
  date: string | null;
  formattedDate: string | null;
  cancelled: boolean;
  slotId?: number;
  slotName?: string;
  chapterId?: number;
  chapterNumber?: number;
  chapterName?: string;
  slokaCount: number | null;
  memorizationGrade: string | null;
  pronunciationGrade: string | null;
  teacherComment: string | null;
  assignedTeacherName?: string;
}

export interface LearningProgressExam {
  bookingId: number;
  date: string | null;
  chapterNumber: number | null;
  chapterName: string | null;
  slokaCount: number | null;
  memorizationGrade: string | null;
  pronunciationGrade: string | null;
}

export interface LearningProgressSyllabusChapter {
  chapterId: number;
  chapterNumber: number;
  chapterName: string;
  allowedSlokas: string;
}

export interface LearningProgress {
  overallProgressPercent: number;
  completedChapters: number;
  totalChapters: number;
  completedSlokas: number;
  totalSlokas: number;
  remainingSlokas: number;
  latestGradedExam: LearningProgressExam | null;
  latestBooking: LearningProgressExam | null;
  currentSyllabus: LearningProgressSyllabusChapter[];
  attendance: { present: number; total: number; percent: string };
  gradeSummary: {
    completedExams: number;
    awaitingFinalGrade: number;
    retests: number;
  };
}

export interface StudentDashboardResponse {
  volunteerId: string;
  studentName: string;
  groupId: string | null;
  totalBookings: number;
  gradedCount: number;
  pendingCount: number;
  avgMem: string;
  avgPro: string;
  totalSlokas: number;
  chapterCounts: Record<string, number>;
  gradeDist: Record<string, number>;
  bookings: StudentDashboardBooking[];
  learningProgress: LearningProgress;
}
