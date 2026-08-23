import api from '../../../services/api';
import type {
  SaveTeacherAvailabilityRequest,
  SaveTeacherAvailabilityResponse,
  TeacherAvailabilityResponse,
} from './models';

const AVAILABILITY_ENDPOINT = '/teacher/my-availability';

export async function getTeacherAvailability(): Promise<TeacherAvailabilityResponse> {
  const response = await api.get<TeacherAvailabilityResponse>(AVAILABILITY_ENDPOINT);
  return response.data;
}

export async function saveTeacherAvailability(
  request: SaveTeacherAvailabilityRequest,
): Promise<SaveTeacherAvailabilityResponse> {
  const response = await api.post<SaveTeacherAvailabilityResponse>(AVAILABILITY_ENDPOINT, request);
  return response.data;
}
