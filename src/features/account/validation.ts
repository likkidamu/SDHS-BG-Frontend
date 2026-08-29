export function validateAccountContact(email: string, phoneNumber: string): string {
  const trimmedEmail = email.trim();
  const trimmedPhone = phoneNumber.trim();
  if (!trimmedEmail) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return 'Please enter a valid email address';
  }
  if (!trimmedPhone) return 'Phone number is required';
  if (!/^[0-9]+$/.test(trimmedPhone)) return 'Phone number must contain digits only';
  if (trimmedPhone.length < 7) return 'Phone number must be at least 7 digits';
  if (trimmedPhone.length > 15) return 'Phone number must not exceed 15 digits';
  return '';
}
