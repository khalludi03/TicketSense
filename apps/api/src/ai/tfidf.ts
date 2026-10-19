export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

export class TfIdfVectorizer {
  vocab: Map<string, number> = new Map();
  idf: number[] = [];

  fit(documents: string[]): void {
    const tokenized = documents.map(tokenize);
    const df = new Map<string, number>();

    for (const tokens of tokenized) {
      const seen = new Set(tokens);
      for (const t of seen) {
        df.set(t, (df.get(t) ?? 0) + 1);
      }
    }

    const N = documents.length;
    const entries = Array.from(df.entries())
      .filter(([, count]) => count >= 1)
      .sort((a, b) => a[0].localeCompare(b[0]));

    this.vocab = new Map(entries.map(([term], i) => [term, i]));
    this.idf = entries.map(([, count]) => Math.log((N + 1) / (count + 1)) + 1);
  }

  transform(document: string): number[] {
    const tokens = tokenize(document);
    const tf = new Array(this.vocab.size).fill(0);

    for (const t of tokens) {
      const idx = this.vocab.get(t);
      if (idx !== undefined) tf[idx]++;
    }

    const vec = tf.map((count, i) => count * this.idf[i]);
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return norm === 0 ? vec : vec.map((v) => v / norm);
  }
}
