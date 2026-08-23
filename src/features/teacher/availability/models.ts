export interface TeacherAvailabilitySlot {
  id: number;
  name: string;
}

export interface TeacherAvailabilityResponse {
  examDate: string;
  availableSlots: TeacherAvailabilitySlot[];
  selectedSlotIds: number[];
}

export interface SaveTeacherAvailabilityRequest {
  examDate: string;
  slotIds: number[];
}

export interface SaveTeacherAvailabilityResponse {
  message: string;
}
