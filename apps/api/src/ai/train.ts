import { predict, trainOneVsRest } from './logistic.js';
import { TfIdfVectorizer } from './tfidf.js';

const FIXTURE_PATH = `${import.meta.dir}/../../../../packages/shared/fixtures/training.json`;
const MODEL_PATH = `${import.meta.dir}/../../../../packages/shared/model/model.json`;

type Example = {
  title: string;
  description: string;
  category: string;
  priority: string;
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function oneHot(labels: string[], value: string): number[] {
  return labels.map((l) => (l === value ? 1 : 0));
}

function confusionMatrix(trueLabels: string[], predLabels: string[], labels: string[]): number[][] {
  const matrix = labels.map(() => labels.map(() => 0));
  for (let i = 0; i < trueLabels.length; i++) {
    const r = labels.indexOf(trueLabels[i]);
    const c = labels.indexOf(predLabels[i]);
    if (r >= 0 && c >= 0) matrix[r][c]++;
  }
  return matrix;
}

function accuracy(trueLabels: string[], predLabels: string[]): number {
  let correct = 0;
  for (let i = 0; i < trueLabels.length; i++) if (trueLabels[i] === predLabels[i]) correct++;
  return correct / trueLabels.length;
}

const examples = (await Bun.file(FIXTURE_PATH).json()) as Example[];
const rng = mulberry32(42);
const shuffled = shuffle(examples, rng);
const split = Math.floor(shuffled.length * 0.8);
const train = shuffled.slice(0, split);
const test = shuffled.slice(split);

const documents = train.map((e) => `${e.title} ${e.description}`);
const vectorizer = new TfIdfVectorizer();
vectorizer.fit(documents);

const XTrain = documents.map((d) => vectorizer.transform(d));
const XTest = test.map((e) => vectorizer.transform(`${e.title} ${e.description}`));

const categoryLabels = ['Billing', 'Technical', 'Account', 'General'];
const priorityLabels = ['low', 'medium', 'high'];

const YCat = train.map((e) => oneHot(categoryLabels, e.category));
const YPri = train.map((e) => oneHot(priorityLabels, e.priority));

const categoryModel = trainOneVsRest(XTrain, YCat, categoryLabels, 250, 1.0);
const priorityModel = trainOneVsRest(XTrain, YPri, priorityLabels, 250, 1.0);

const catPreds = XTest.map((x) => predict(categoryModel, x).label);
const priPreds = XTest.map((x) => predict(priorityModel, x).label);

const catAcc = accuracy(
  test.map((e) => e.category),
  catPreds,
);
const priAcc = accuracy(
  test.map((e) => e.priority),
  priPreds,
);

console.log(`Category accuracy: ${(catAcc * 100).toFixed(1)}%`);
console.log(`Priority accuracy: ${(priAcc * 100).toFixed(1)}%`);

console.log('\nCategory confusion matrix:');
console.log('        ' + categoryLabels.map((l) => l.padEnd(10)).join(''));
confusionMatrix(
  test.map((e) => e.category),
  catPreds,
  categoryLabels,
).forEach((row, i) => {
  console.log(categoryLabels[i].padEnd(8) + row.map((n) => String(n).padStart(10)).join(''));
});

console.log('\nPriority confusion matrix:');
console.log('      ' + priorityLabels.map((l) => l.padEnd(8)).join(''));
confusionMatrix(
  test.map((e) => e.priority),
  priPreds,
  priorityLabels,
).forEach((row, i) => {
  console.log(priorityLabels[i].padEnd(6) + row.map((n) => String(n).padStart(8)).join(''));
});

const model = {
  vocab: Object.fromEntries(vectorizer.vocab),
  idf: vectorizer.idf,
  category: categoryModel,
  priority: priorityModel,
};

await Bun.write(MODEL_PATH, JSON.stringify(model, null, 2));
console.log(`\nModel written to ${MODEL_PATH}`);
