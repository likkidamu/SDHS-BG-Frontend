export interface StudentSlot {
  id: number;
  name: string;
  duration: number;
  availableCount: number;
}

export interface StudentChapter {
  id: number;
  chapterNumber: number;
  chapterName: string;
  totalSlokas: number;
  allowedSlokas?: string;
}

export interface StudentExistingBooking {
  id: number;
  date: string | null;
  cancelled: boolean;
  slotId?: number;
  slotName?: string;
  chapterId?: number;
  chapterNumber?: number;
  chapterName?: string;
  slokaCount: number | null;
}

export interface StudentSlotsResponse {
  volunteerId: string;
  studentName: string;
  slotEligible: boolean;
  bookingAllowed: boolean;
  date: string;
  formattedDate: string;
  slots: StudentSlot[];
  chapters: StudentChapter[];
  existingBookings: StudentExistingBooking[];
  existingBookingsCount: number;
}

export interface BookStudentSlotRequest {
  slotId: number;
  chapterId: number;
  slokaCount: number;
  date?: string;
  chapterId2?: number;
  slokaCount2?: number;
}

export interface CancelStudentBookingRequest {
  bookingId: number;
}

export interface StudentBookingMutationResponse {
  message: string;
}
