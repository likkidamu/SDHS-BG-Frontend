export type ProgramType = 'FLUENT' | 'MEMORIZATION' | 'REVISION';

export type EnrollmentStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'DROPPED'
  | 'REJECTED';

export interface LearningEnrollment {
  id: number;
  batchType: ProgramType;
  status: EnrollmentStatus;
  groupId: string | null;
  slotEligible: boolean;
  defaultEnrollment: boolean;
  enrollmentId?: number;
  programType?: ProgramType;
  enrollmentStatus?: EnrollmentStatus;
  isDefault?: boolean;
  groupName?: string | null;
  centerId?: string | null;
  centerName?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  enrollmentDate?: string | null;
  completionDate?: string | null;
  decisionDate?: string | null;
}

export interface LearningEnrollmentsResponse {
  enrollments: LearningEnrollment[];
  total: number;
}

export function enrollmentProgram(enrollment: LearningEnrollment): ProgramType {
  return enrollment.programType ?? enrollment.batchType;
}

export function enrollmentStatus(enrollment: LearningEnrollment): EnrollmentStatus {
  return enrollment.enrollmentStatus ?? enrollment.status;
}
