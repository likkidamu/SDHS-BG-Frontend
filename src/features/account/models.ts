export interface AccountProfile {
  volunteerId: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  trackType: string | null;
  groupId: string | null;
  profileCompletionRequired: boolean;
}

export interface UpdateAccountContactRequest {
  email: string;
  phoneNumber: string;
}
