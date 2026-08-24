import type { TeacherAvailabilityResponse } from '../availability/models';
import type { TeacherGradingDashboardResponse } from '../grading/models';

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

export interface TeacherHomeData {
  home: TeacherHomeResponse;
  availability: TeacherAvailabilityResponse;
  grading: TeacherGradingDashboardResponse;
}
