export interface MathSegment {
  type: 'text' | 'inline-math' | 'display-math';
  content: string;
}

export function parseMathContent(text: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let currentIndex = 0;

  // Regular expressions for math delimiters
  const displayMathRegex = /\$\$([\s\S]*?)\$\$/g;
  const inlineMathRegex = /\$((?!\$)[\s\S]*?)\$/g;

  // Combined pattern to match both display and inline math
  const combinedRegex = /(\$\$[\s\S]*?\$\$|\$(?!\$)[\s\S]*?\$)/g;

  let match;
  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before the math
    if (match.index > currentIndex) {
      segments.push({
        type: 'text',
        content: text.slice(currentIndex, match.index)
      });
    }

    const mathContent = match[0];
    if (mathContent.startsWith('$$')) {
      // Display math
      segments.push({
        type: 'display-math',
        content: mathContent.slice(2, -2).trim()
      });
    } else {
      // Inline math
      segments.push({
        type: 'inline-math',
        content: mathContent.slice(1, -1).trim()
      });
    }

    currentIndex = match.index + mathContent.length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(currentIndex)
    });
  }

  return segments;
}

export function isValidLatex(text: string): boolean {
  try {
    // Basic validation - check for matching delimiters
    const dollars = text.match(/\$/g)?.length || 0;
    if (dollars % 2 !== 0) return false;

    const doubleDollars = text.match(/\$\$/g)?.length || 0;
    if (doubleDollars % 2 !== 0) return false;

    return true;
  } catch (e) {
    return false;
  }
} 