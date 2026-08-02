// Moderation Filter for Comments
// Detects abusive words, spam links, and repeated special characters

const PROFANITY_LIST = [
  'abuse', 'abusive', 'bitch', 'bastard', 'fuck', 'shit', 'asshole', 'cunt', 'dick',
  'slut', 'whore', 'idiot', 'stupid', 'dumb', 'scam', 'spam', 'hate', 'nude', 'sex'
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

  // 3. Check for abusive / profane words
  const lowerText = trimmed.toLowerCase();
  const words = lowerText.split(/\s+/);

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z0-9]/gi, '');
    if (PROFANITY_LIST.includes(cleanWord)) {
      return { isClean: false, error: 'Comment contains inappropriate or abusive language.' };
    }
  }

  return { isClean: true };
}

module.exports = { validateCommentContent };
