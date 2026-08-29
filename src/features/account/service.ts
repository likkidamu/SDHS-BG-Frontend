import api from '../../services/api';
import type { AccountProfile, UpdateAccountContactRequest } from './models';

export async function getAccountProfile(): Promise<AccountProfile> {
  const response = await api.get<AccountProfile>('/profile');
  return response.data;
}

export async function updateAccountContact(
  request: UpdateAccountContactRequest,
): Promise<AccountProfile> {
  const response = await api.put<AccountProfile>('/profile/contact', request);
  return response.data;
}

export function getAccountError(error: any, fallback: string): string {
  return error.response?.data?.error
    ?? error.response?.data?.message
    ?? fallback;
}
