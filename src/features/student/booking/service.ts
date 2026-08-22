import api from '../../../services/api';
import type {
  BookStudentSlotRequest,
  CancelStudentBookingRequest,
  StudentBookingMutationResponse,
  StudentSlotsResponse,
} from './models';

function enrollmentHeaders(enrollmentId: number) {
  return { headers: { 'X-Enrollment-Id': String(enrollmentId) } };
}

export async function getStudentSlots(enrollmentId: number) {
  const response = await api.get<StudentSlotsResponse>(
    '/student/slots',
    enrollmentHeaders(enrollmentId),
  );
  return response.data;
}

export async function bookStudentSlot(request: BookStudentSlotRequest, enrollmentId: number) {
  const response = await api.post<StudentBookingMutationResponse>(
    '/student/book',
    request,
    enrollmentHeaders(enrollmentId),
  );
  return response.data;
}

export async function cancelStudentBooking(
  request: CancelStudentBookingRequest,
  enrollmentId: number,
) {
  const response = await api.post<StudentBookingMutationResponse>(
    '/student/cancel',
    request,
    enrollmentHeaders(enrollmentId),
  );
  return response.data;
}
