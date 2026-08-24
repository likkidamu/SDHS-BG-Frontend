export interface StudentSearchResult {
  volunteerId: string;
  name: string;
  groupId: string | null;
}

export interface Slot {
  id: number;
  name: string;
}

export interface Chapter {
  id: number;
  chapterNumber: number;
  chapterName: string;
  allowedSlokas: string;
}

export interface ExistingBooking {
  id: number;
  volunteerId: string;
  studentName: string;
  slotId?: number;
  slotName?: string;
  chapterId?: number;
  chapterNumber?: number;
  chapterName?: string;
  slokaCount: number | null;
  assignedTeacherName?: string;
}

export interface BulkBookingResponse {
  date: string;
  students: StudentSearchResult[];
  slots: Slot[];
  chapters: Chapter[];
  bookings: ExistingBooking[];
}

export interface AllowedSlokasResponse {
  allowed: number[];
  minNext?: number;
}

export type TrackType = 'MEMORIZATION' | 'REVISION';

export interface BulkBookingEntry {
  volunteerId: string;
  date: string;
  slotId: number;
  chapterId: number;
  slokaCount: number;
  chapterId2?: number;
  slokaCount2?: number;
}

export interface BulkBookingSaveRequest {
  trackType: TrackType;
  entries: BulkBookingEntry[];
}

export interface BulkBookingSaveResponse {
  saved: number;
  failed: number;
  messages: string[];
}

export interface DeleteBookingRequest {
  bookingId: number;
}

export interface DeleteBookingResponse {
  message: string;
}
