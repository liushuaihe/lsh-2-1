import { Matrix } from 'ml-matrix';
import type { MatrixData, FinetuneStep, CalculateDeltaResponse } from '../types';
import { generateRandomMatrix, performSVD } from './matrixService.js';

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextGaussian(): number {
    let u = 0, v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

function matrixToData(matrix: Matrix): MatrixData {
  return {
    rows: matrix.rows,
    cols: matrix.columns,
    data: matrix.to2DArray()
  };
}

function frobeniusNorm(matrix: Matrix): number {
  let sum = 0;
  for (let i = 0; i < matrix.rows; i++) {
    for (let j = 0; j < matrix.columns; j++) {
      const val = matrix.get(i, j);
      sum += val * val;
    }
  }
  return Math.sqrt(sum);
}

function calculateLoss(W0: Matrix, W_updated: Matrix, targetMatrix: Matrix): number {
  const prediction = W_updated;
  let error = 0;
  for (let i = 0; i < prediction.rows; i++) {
    for (let j = 0; j < prediction.columns; j++) {
      const diff = prediction.get(i, j) - targetMatrix.get(i, j);
      error += diff * diff;
    }
  }
  return error / (prediction.rows * prediction.columns);
}

export function calculateDeltaWithAlpha(rank: number, alpha: number): CalculateDeltaResponse {
  const svdResult = performSVD(rank);
  
  const W0 = new Matrix(svdResult.matrixW.data);
  const B = new Matrix(svdResult.matrixB.data);
  const A = new Matrix(svdResult.matrixA.data);
  
  const deltaW = B.mmul(A);
  const deltaWScaled = deltaW.clone().mul(alpha);
  const W_updated = W0.clone().add(deltaWScaled);
  
  const originalNorm = frobeniusNorm(W0);
  const deltaNorm = frobeniusNorm(deltaW);
  const deltaScaledNorm = frobeniusNorm(deltaWScaled);
  const updatedNorm = frobeniusNorm(W_updated);
  const scaleRatio = alpha;
  
  return {
    matrixDelta: matrixToData(deltaW),
    matrixUpdated: matrixToData(W_updated),
    matrixDeltaScaled: matrixToData(deltaWScaled),
    stats: {
      deltaNorm,
      deltaScaledNorm,
      updatedNorm,
      originalNorm,
      scaleRatio
    }
  };
}

export function simulateFinetune(
  rank: number,
  alpha: number,
  steps: number,
  learningRate: number,
  seed?: number
): { steps: FinetuneStep[]; initialLoss: number; finalLoss: number } {
  const actualSeed = seed ?? Math.floor(Math.random() * 10000);
  const rng = new SeededRandom(actualSeed);
  
  const { matrix: W0 } = generateRandomMatrix(64, 64, actualSeed);
  
  const targetData: number[][] = [];
  for (let i = 0; i < 64; i++) {
    const row: number[] = [];
    for (let j = 0; j < 64; j++) {
      row.push(rng.nextGaussian() * 0.5);
    }
    targetData.push(row);
  }
  const targetMatrix = new Matrix(targetData);
  
  const m = W0.rows;
  const n = W0.columns;
  
  const B = new Matrix(m, rank);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < rank; j++) {
      B.set(i, j, rng.nextGaussian() * 0.01);
    }
  }
  
  const A = new Matrix(rank, n);
  for (let i = 0; i < rank; i++) {
    for (let j = 0; j < n; j++) {
      A.set(i, j, rng.nextGaussian() * 0.01);
    }
  }
  
  const finetuneSteps: FinetuneStep[] = [];
  
  const initialDelta = B.mmul(A);
  const initialDeltaScaled = initialDelta.clone().mul(alpha);
  const initialWUpdated = W0.clone().add(initialDeltaScaled);
  const initialLoss = calculateLoss(W0, initialWUpdated, targetMatrix);
  
  finetuneSteps.push({
    step: 0,
    loss: initialLoss,
    matrixA: matrixToData(A),
    matrixB: matrixToData(B),
    matrixDelta: matrixToData(initialDelta),
    matrixUpdated: matrixToData(initialWUpdated),
    gradNormA: 0,
    gradNormB: 0
  });
  
  let currentLoss = initialLoss;
  
  for (let step = 1; step <= steps; step++) {
    const deltaW = B.mmul(A);
    const deltaWScaled = deltaW.clone().mul(alpha);
    const W_updated = W0.clone().add(deltaWScaled);
    
    currentLoss = calculateLoss(W0, W_updated, targetMatrix);
    
    const errorMatrix = W_updated.clone().sub(targetMatrix).mul(2 / (m * n));
    
    const gradB = errorMatrix.mmul(A.transpose()).mul(alpha);
    const gradA = B.transpose().mmul(errorMatrix).mul(alpha);
    
    const gradNormA = frobeniusNorm(gradA);
    const gradNormB = frobeniusNorm(gradB);
    
    const maxGrad = 1.0;
    const gradNorm = Math.sqrt(gradNormA * gradNormA + gradNormB * gradNormB);
    if (gradNorm > maxGrad) {
      const scale = maxGrad / gradNorm;
      gradA.mul(scale);
      gradB.mul(scale);
    }
    
    B.sub(gradB.mul(learningRate));
    A.sub(gradA.mul(learningRate));
    
    const newDelta = B.mmul(A);
    const newDeltaScaled = newDelta.clone().mul(alpha);
    const newWUpdated = W0.clone().add(newDeltaScaled);
    
    if (step % Math.ceil(steps / 20) === 0 || step === steps) {
      finetuneSteps.push({
        step,
        loss: currentLoss,
        matrixA: matrixToData(A.clone()),
        matrixB: matrixToData(B.clone()),
        matrixDelta: matrixToData(newDelta),
        matrixUpdated: matrixToData(newWUpdated),
        gradNormA: frobeniusNorm(gradA),
        gradNormB: frobeniusNorm(gradB)
      });
    }
  }
  
  return {
    steps: finetuneSteps,
    initialLoss,
    finalLoss: currentLoss
  };
}
