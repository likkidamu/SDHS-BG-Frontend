import type { LearningEnrollment, ProgramType } from '../../enrollment/models';

export interface CreateEnrollmentRequest {
  programType: ProgramType;
}

export type CreateEnrollmentResponse = LearningEnrollment;

export interface EnrollmentProgramOption {
  value: ProgramType;
  label: string;
}
