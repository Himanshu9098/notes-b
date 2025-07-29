
/**
 * Generates a 6-digit OTP
 * @returns A random 6-digit OTP as a string
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
