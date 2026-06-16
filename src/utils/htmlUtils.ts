import DOMPurify from 'dompurify';

/**
 * Decode HTML entities (e.g., &lt; to <, &gt; to >)
 */
export const cleanEscapedHTML = (html: string): string => {
  if (!html || typeof html !== 'string') return html;
  
  return html
    // Remove escaped backslashes from quotes: \\\" → "
    .replace(/\\\\\"/g, '"')
    .replace(/\\"/g, '"')
    // Remove escaped forward slashes: \/ → /
    .replace(/\\\//g, '/')
    // Clean up escaped newlines: \\n → (actual newline or remove)
    .replace(/\\n/g, '\n')
    // Remove markdown code fences that wrap HTML
    .replace(/^```html?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    // Remove <p>``` artifacts
    .replace(/<p>\s*```\s*<\/p>/gi, '')
    .replace(/```/g, '');
};
export const decodeHTMLEntities = (html: string): string => {
  if (!html || typeof html !== 'string') return html;
  const textArea = document.createElement('textarea');
  textArea.innerHTML = html;
  return textArea.value;
};

/**
 * Detect if content contains HTML tags
 */
export const isHTMLContent = (content: string): boolean => {
  if (!content || typeof content !== 'string') return false;
  const htmlRegex = /<[a-z][\s\S]*>/i;
  return htmlRegex.test(content.trim());
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
   ALLOWED_TAGS: ['div', 'span', 'p', 'img', 'strong', 'em', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'a', 'b', 'i', 'body', 'html'],
    ALLOWED_ATTR: ['class', 'id', 'src', 'alt', 'href', 'width', 'height', 'target', 'style'],
  });
};
