export interface MathSegment {
  type: "text" | "inline-math" | "display-math";
  content: string;
}

export function parseMathContent(text: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let currentIndex = 0;

  // Function to check if a single dollar sign is actually a closing one
  const isClosingDollar = (pos: number): boolean => {
    return text[pos] === "$" && text[pos - 1] !== "\\";
  };

  while (currentIndex < text.length) {
    const nextDoubleSign = text.indexOf("$$", currentIndex);
    const nextSingleSign = text.indexOf("$", currentIndex);

    // No more math delimiters found
    if (nextDoubleSign === -1 && nextSingleSign === -1) {
      // Add remaining text
      segments.push({
        type: "text",
        content: text.slice(currentIndex),
      });
      break;
    }

    // Handle double dollar signs first
    if (
      nextDoubleSign !== -1 &&
      (nextSingleSign === -1 || nextDoubleSign < nextSingleSign)
    ) {
      // Add text before the math
      if (nextDoubleSign > currentIndex) {
        segments.push({
          type: "text",
          content: text.slice(currentIndex, nextDoubleSign),
        });
      }

      const endDoubleSign = text.indexOf("$$", nextDoubleSign + 2);
      if (endDoubleSign === -1) {
        // No closing $$, treat rest as text
        segments.push({
          type: "text",
          content: text.slice(currentIndex),
        });
        break;
      }

      segments.push({
        type: "display-math",
        content: text.slice(nextDoubleSign + 2, endDoubleSign).trim(),
      });
      currentIndex = endDoubleSign + 2;
    }
    // Handle single dollar signs
    else if (nextSingleSign !== -1) {
      // Add text before the math
      if (nextSingleSign > currentIndex) {
        segments.push({
          type: "text",
          content: text.slice(currentIndex, nextSingleSign),
        });
      }

      // Find closing $, but not \$
      let endSingleSign = nextSingleSign + 1;
      while (endSingleSign < text.length) {
        endSingleSign = text.indexOf("$", endSingleSign);
        if (endSingleSign === -1) {
          // No closing $, treat the rest as text
          segments.push({
            type: "text",
            content: text.slice(currentIndex),
          });
          currentIndex = text.length;
          break;
        }
        if (isClosingDollar(endSingleSign)) {
          segments.push({
            type: "inline-math",
            content: text.slice(nextSingleSign + 1, endSingleSign).trim(),
          });
          currentIndex = endSingleSign + 1;
          break;
        }
        endSingleSign++;
      }
      if (endSingleSign === -1) break;
    }
  }

  // Merge adjacent text segments
  const mergedSegments: MathSegment[] = [];
  let currentText = "";

  for (const segment of segments) {
    if (segment.type === "text") {
      currentText += segment.content;
    } else {
      if (currentText) {
        mergedSegments.push({ type: "text", content: currentText });
        currentText = "";
      }
      mergedSegments.push(segment);
    }
  }

  if (currentText) {
    mergedSegments.push({ type: "text", content: currentText });
  }

  return mergedSegments;
}
