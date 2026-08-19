/** Generate a new RFC 4122 UUID using the Web Crypto API (available in Workers). */
export const newId = (): string => crypto.randomUUID();
