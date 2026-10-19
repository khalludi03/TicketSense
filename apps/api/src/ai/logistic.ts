export type ClassifierModel = {
  labels: string[];
  weights: number[][];
  biases: number[];
};

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((z) => Math.exp(z - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function trainOneVsRest(
  X: number[][],
  y: number[][],
  labels: string[],
  epochs = 200,
  lr = 0.8,
): ClassifierModel {
  const nSamples = X.length;
  const nFeatures = X[0].length;
  const weights: number[][] = [];
  const biases: number[] = [];

  for (let c = 0; c < labels.length; c++) {
    const w = new Array(nFeatures).fill(0);
    let b = 0;
    const yc = y.map((row) => row[c]);

    for (let e = 0; e < epochs; e++) {
      const dw = new Array(nFeatures).fill(0);
      let db = 0;

      for (let i = 0; i < nSamples; i++) {
        const z = X[i].reduce((sum, xi, j) => sum + xi * w[j], 0) + b;
        const p = sigmoid(z);
        const err = p - yc[i];

        for (let j = 0; j < nFeatures; j++) {
          dw[j] += err * X[i][j];
        }
        db += err;
      }

      for (let j = 0; j < nFeatures; j++) {
        w[j] -= (lr * dw[j]) / nSamples;
      }
      b -= (lr * db) / nSamples;
    }

    weights.push(w);
    biases.push(b);
  }

  return { labels, weights, biases };
}

export function predict(model: ClassifierModel, x: number[]): { label: string; confidence: number; probs: number[] } {
  const logits = model.weights.map((w, i) => w.reduce((sum, wi, j) => sum + wi * x[j], 0) + model.biases[i]);
  const probs = softmax(logits);
  let bestIdx = 0;
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[bestIdx]) bestIdx = i;
  }
  return { label: model.labels[bestIdx], confidence: probs[bestIdx], probs };
}
