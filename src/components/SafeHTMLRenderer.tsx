import { isHTMLContent, sanitizeHTML, decodeHTMLEntities, cleanEscapedHTML } from '@/utils/htmlUtils';
import { cn } from '@/lib/utils';

interface SafeHTMLRendererProps {
  content: string;
  className?: string;
  as?: 'div' | 'span' | 'p';
  forceHTML?: boolean;
}

/**
 * Safely renders content that may be HTML or plain text.
 * HTML content is sanitized before rendering to prevent XSS attacks.
 * Plain text with \n newlines is converted to <br> tags for proper display.
 */
export const SafeHTMLRenderer = ({ 
  content, 
  className, 
  as: Tag = 'div',
  forceHTML = false
}: SafeHTMLRendererProps) => {
  if (!content) return null;
  
  // If forceHTML is true, always render as HTML; otherwise detect
  if (forceHTML || isHTMLContent(content)) {
    // Decode HTML entities first (e.g., &lt;p&gt; to <p>), then sanitize
      const cleanedContent = cleanEscapedHTML(content);
    const decodedContent = decodeHTMLEntities(cleanedContent);
    return (
      <Tag 
        className={cn("ai-interpretation-content", className)}
        dangerouslySetInnerHTML={{ __html: sanitizeHTML(decodedContent) }}
      />
    );
  }
  
  // For plain text, convert \n to <br> tags for proper line breaks
  const htmlWithLineBreaks = content
    .replace(/\\n/g, '<br />') // Handle escaped \n
    .replace(/\n/g, '<br />'); // Handle actual newlines
  
  return (
    <Tag 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHTML(htmlWithLineBreaks) }}
    />
  );
};
