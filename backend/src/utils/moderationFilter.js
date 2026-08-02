// Moderation Filter for Comments
// Detects abusive words, spam links, and repeated special characters

const PROFANITY_LIST = [
  'abuse', 'abusive', 'bitch', 'bastard', 'fuck', 'fucking', 'motherfucker', 'motherfuck', 
  'shit', 'asshole', 'cunt', 'dick', 'slut', 'whore', 'idiot', 'stupid', 'dumb', 'scam', 
  'spam', 'hate', 'nude', 'sex', 'chutiya', 'gandu', 'bhenchod', 'madarchod', 'harami',
  'kutta', 'kamina', 'saala', 'randi', 'bhosdike', 'mc', 'bc', 'bsdk'
];

/**
 * Validates text for profanity, spam, and special character abuse
 * @param {string} text 
 * @returns {{ isClean: boolean, error?: string }}
 */
function validateCommentContent(text) {
  if (!text || typeof text !== 'string') {
    return { isClean: false, error: 'Comment content cannot be empty.' };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { isClean: false, error: 'Comment cannot contain only whitespace.' };
  }

  if (trimmed.length > 1000) {
    return { isClean: false, error: 'Comment exceeds maximum limit of 1000 characters.' };
  }

  // 1. Check for excessive repeated special characters (e.g. "!!!!!!", "?????", "*****", "$$$$$")
  const repeatedSpecialCharRegex = /([!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|~`-]{5,})/;
  if (repeatedSpecialCharRegex.test(trimmed)) {
    return { isClean: false, error: 'Comment contains excessive repeated special characters.' };
  }

  // 2. Check for spam links / domain spam patterns (e.g. http://, https://, www., .com links repeated)
  const urlMatches = trimmed.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi);
  if (urlMatches && urlMatches.length > 2) {
    return { isClean: false, error: 'Spam detected: Comments cannot contain multiple external links.' };
  }

  // 3. Check for abusive / profane words (Exact word match + substring match)
  const lowerText = trimmed.toLowerCase();
  const cleanText = lowerText.replace(/[^a-z0-9\s]/gi, '');
  const words = cleanText.split(/\s+/);

  for (const profanity of PROFANITY_LIST) {
    // Check full text substring match or exact word match
    if (words.includes(profanity) || (profanity.length >= 4 && cleanText.includes(profanity))) {
      return { isClean: false, error: 'Comment contains inappropriate or abusive language.' };
    }
  }

  return { isClean: true };
}

module.exports = { validateCommentContent };
