// Profiles are not persisted anywhere — a "profile" is just the wallet address.
// Kept as functions (not a plain object) so callers don't need to change.

export interface Profile {
  wallet: string;
}

export async function getOrCreateProfile(wallet: string): Promise<Profile> {
  return { wallet: wallet.toLowerCase() };
}

export async function getProfile(wallet: string): Promise<Profile | null> {
  return { wallet: wallet.toLowerCase() };
}
