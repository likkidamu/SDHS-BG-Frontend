export interface StudentAttendanceRecord {
  id: number;
  present: boolean;
  classDate?: string;
  groupId?: string;
  noClass?: boolean;
}

export interface StudentAttendanceResponse {
  volunteerId: string;
  studentName: string;
  groupId: string | null;
  present: number;
  total: number;
  percent: string;
  groupStartDate: string | null;
  groupEndDate: string | null;
  groupStatus: string | null;
  history: StudentAttendanceRecord[];
}
