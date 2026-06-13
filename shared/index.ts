export interface MatrixData {
  rows: number;
  cols: number;
  data: number[][];
}

export interface DecomposeRequest {
  rank: number;
}

export interface DecomposeResponse {
  matrixW: MatrixData;
  matrixA: MatrixData;
  matrixB: MatrixData;
  matrixReconstructed: MatrixData;
  stats: {
    originalParams: number;
    loraParams: number;
    savingRatio: number;
    mse: number;
  };
}

export interface GenerateRequest {
  rows?: number;
  cols?: number;
  seed?: number;
}

export interface GenerateResponse {
  matrixW: MatrixData;
  seed: number;
}

export interface MatrixRecord {
  id: string;
  timestamp: number;
  seed: number;
  rank: number;
  alpha: number;
  rows: number;
  cols: number;
  matrixW: MatrixData;
  matrixA: MatrixData;
  matrixB: MatrixData;
  matrixDelta: MatrixData;
  matrixUpdated: MatrixData;
  stats: {
    originalParams: number;
    loraParams: number;
    savingRatio: number;
    mse: number;
    deltaNorm: number;
    updatedNorm: number;
  };
}

export interface SaveRecordRequest {
  seed: number;
  rank: number;
  alpha: number;
  matrixW: MatrixData;
  matrixA: MatrixData;
  matrixB: MatrixData;
  matrixDelta: MatrixData;
  matrixUpdated: MatrixData;
  stats: MatrixRecord['stats'];
}

export interface SaveRecordResponse {
  success: boolean;
  record: MatrixRecord;
}

export interface ListRecordsResponse {
  success: boolean;
  records: MatrixRecord[];
}

export interface GetRecordResponse {
  success: boolean;
  record: MatrixRecord;
}

export interface DeleteRecordResponse {
  success: boolean;
  message: string;
}

export interface FinetuneStep {
  step: number;
  loss: number;
  matrixA: MatrixData;
  matrixB: MatrixData;
  matrixDelta: MatrixData;
  matrixUpdated: MatrixData;
  gradNormA: number;
  gradNormB: number;
}

export interface SimulateFinetuneRequest {
  rank: number;
  alpha: number;
  steps: number;
  learningRate: number;
  seed?: number;
}

export interface SimulateFinetuneResponse {
  success: boolean;
  steps: FinetuneStep[];
  finalLoss: number;
  initialLoss: number;
}

export interface CalculateDeltaRequest {
  rank: number;
  alpha: number;
}

export interface CalculateDeltaResponse {
  matrixDelta: MatrixData;
  matrixUpdated: MatrixData;
  matrixDeltaScaled: MatrixData;
  stats: {
    deltaNorm: number;
    deltaScaledNorm: number;
    updatedNorm: number;
    originalNorm: number;
    scaleRatio: number;
  };
}
