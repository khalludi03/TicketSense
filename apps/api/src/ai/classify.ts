import { predict, type ClassifierModel } from './logistic.js';
import { TfIdfVectorizer } from './tfidf.js';

const MODEL_PATH = `${import.meta.dir}/../../../../packages/shared/model/model.json`;

type ModelData = {
  vocab: Record<string, number>;
  idf: number[];
  category: ClassifierModel;
  priority: ClassifierModel;
};

let vectorizer: TfIdfVectorizer | null = null;
let categoryModel: ClassifierModel | null = null;
let priorityModel: ClassifierModel | null = null;

export async function initClassifier(): Promise<void> {
  if (vectorizer) return;

  const data = (await Bun.file(MODEL_PATH).json()) as ModelData;
  vectorizer = new TfIdfVectorizer();
  vectorizer.vocab = new Map(Object.entries(data.vocab));
  vectorizer.idf = data.idf;
  categoryModel = data.category;
  priorityModel = data.priority;
}

export function classifyTicket(text: string): { category: string; priority: string; confidence: number } {
  if (!vectorizer || !categoryModel || !priorityModel) {
    throw new Error('Classifier not initialized. Call initClassifier() first.');
  }

  const x = vectorizer.transform(text);
  const cat = predict(categoryModel, x);
  const pri = predict(priorityModel, x);

  return {
    category: cat.label,
    priority: pri.label,
    confidence: Math.round(cat.confidence * 100) / 100,
  };
}
