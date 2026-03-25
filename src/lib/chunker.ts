export interface Chunk {
  text: string;
  index: number;
  charStart: number;
  charEnd: number;
}

const CHUNK_SIZE = 500;      // tokens approx — we use words as proxy
const CHUNK_OVERLAP = 50;    // words overlap between chunks

const wordCount = (text: string): number => text.split(/\s+/).length;

const splitIntoWords = (text: string): string[] =>
  text.split(/\s+/).filter(Boolean);

export const chunkText = (text: string): Chunk[] => {
  const words = splitIntoWords(text);
  const chunks: Chunk[] = [];

  let i = 0;
  let chunkIndex = 0;

  while (i < words.length) {
    const chunkWords = words.slice(i, i + CHUNK_SIZE);
    const chunkText = chunkWords.join(" ");

    // Calculate approximate char positions
    const charStart = text.indexOf(chunkWords[0]!,
      chunkIndex === 0 ? 0 : chunks[chunkIndex - 1]!.charStart
    );
    const charEnd = charStart + chunkText.length;

    chunks.push({
      text: chunkText,
      index: chunkIndex,
      charStart: Math.max(0, charStart),
      charEnd,
    });

    i += CHUNK_SIZE - CHUNK_OVERLAP;
    chunkIndex++;
  }

  return chunks;
};