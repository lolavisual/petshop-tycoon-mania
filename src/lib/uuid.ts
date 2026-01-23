/**
 * Check if a string is a valid UUID format
 * Demo mode uses "demo-user" string which is not a valid UUID
 */
export const isValidUUID = (id: string | undefined | null): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Check if the userId is a demo user (not a valid UUID)
 */
export const isDemoUserId = (id: string | undefined | null): boolean => {
  return !isValidUUID(id);
};
