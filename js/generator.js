/* ============================================
   GENERATOR — Password Generator
   Uses crypto.getRandomValues for security
   ============================================ */

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

const AMBIGUOUS_CHARS = 'Il1O0o';

/**
 * Default generator options
 */
export function getDefaultGeneratorOptions() {
  return {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    avoidAmbiguous: false
  };
}

/**
 * Generate a secure random password
 */
export function generatePassword(options = {}) {
  const opts = { ...getDefaultGeneratorOptions(), ...options };

  let chars = '';
  const required = [];

  if (opts.uppercase) {
    let set = CHAR_SETS.uppercase;
    if (opts.avoidAmbiguous) set = removeChars(set, AMBIGUOUS_CHARS);
    chars += set;
    required.push(getRandomChar(set));
  }

  if (opts.lowercase) {
    let set = CHAR_SETS.lowercase;
    if (opts.avoidAmbiguous) set = removeChars(set, AMBIGUOUS_CHARS);
    chars += set;
    required.push(getRandomChar(set));
  }

  if (opts.numbers) {
    let set = CHAR_SETS.numbers;
    if (opts.avoidAmbiguous) set = removeChars(set, AMBIGUOUS_CHARS);
    chars += set;
    required.push(getRandomChar(set));
  }

  if (opts.symbols) {
    chars += CHAR_SETS.symbols;
    required.push(getRandomChar(CHAR_SETS.symbols));
  }

  if (chars.length === 0) {
    // Fallback to lowercase if nothing selected
    chars = CHAR_SETS.lowercase;
    required.push(getRandomChar(chars));
  }

  // Generate the rest of the password
  const length = Math.max(opts.length, required.length);
  const remaining = length - required.length;
  const result = [...required];

  for (let i = 0; i < remaining; i++) {
    result.push(getRandomChar(chars));
  }

  // Shuffle the result (Fisher-Yates)
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

/**
 * Get a cryptographically random character from a string
 */
function getRandomChar(str) {
  return str[getRandomInt(str.length)];
}

/**
 * Get a cryptographically random integer [0, max)
 */
function getRandomInt(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

/**
 * Remove specific characters from a string
 */
function removeChars(str, chars) {
  return str.split('').filter(c => !chars.includes(c)).join('');
}
