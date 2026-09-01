// Small curated list of very common / breached passwords, checked client-side
// as a basic guardrail before we ever send a password to Supabase. This is a
// convenience check, not a security boundary — nothing in the project already
// provided a list like this, so this is a minimal addition rather than pulling
// in an external breach-checking service.
const COMMON_PASSWORDS = new Set(
  [
    'password', 'password1', 'password123', '123456', '123456789', '12345678',
    '1234567890', 'qwerty', 'qwerty123', 'qwertyuiop', 'letmein', 'welcome',
    'welcome123', 'admin', 'administrator', 'iloveyou', 'monkey', 'dragon',
    'football', 'baseball', 'basketball', 'soccer', 'superman', 'batman',
    'trustno1', 'sunshine', 'princess', 'flower', 'starwars', 'shadow',
    'master', 'passw0rd', 'abc123', 'abcd1234', 'a1b2c3d4', '1q2w3e4r',
    'zaq12wsx', 'freedom', 'whatever', 'changeme', 'letmein123', 'access123',
    'charlie', 'donald', 'michael', 'jennifer', 'jordan23', 'hunter2',
    'ninja123', 'secret123', 'summer2024', 'summer2025', 'winter2024',
    'winter2025', 'password!', 'password@123', 'Password1', 'Password123',
    'Password1!', 'Qwerty123!', 'Welcome123!', 'iloveyou1', 'iloveyou123',
    '00000000', '11111111', '87654321', '12341234', '1234512345',
    'thisisapassword', 'correcthorsebatterystaple', 'chang3me', 'changeme123',
  ].map((p) => p.toLowerCase())
)

export function isCommonPassword(password) {
  return COMMON_PASSWORDS.has(password.trim().toLowerCase())
}
