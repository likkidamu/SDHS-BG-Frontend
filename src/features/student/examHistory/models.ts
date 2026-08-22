export interface StudentGrade {
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
  assignedTeacherName?: string;
}

export interface StudentGradesResponse {
  volunteerId: string;
  studentName: string;
  groupId?: string | null;
  grades: StudentGrade[];
}
