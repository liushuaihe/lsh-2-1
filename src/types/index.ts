import type { 
  MatrixData, 
  DecomposeResponse, 
  GenerateResponse,
  MatrixRecord,
  FinetuneStep,
  CalculateDeltaResponse,
} from '../../shared';

export type { MatrixData, DecomposeResponse, GenerateResponse, MatrixRecord, FinetuneStep, CalculateDeltaResponse };

export interface HeatmapProps {
  data: MatrixData;
  title: string;
  colorScheme?: 'warm' | 'cool' | 'viridis';
  minValue?: number;
  maxValue?: number;
  showMagnifier?: boolean;
  magnifierScale?: number;
}

export interface MatrixCardProps {
  data: MatrixData;
  title: string;
  subtitle?: string;
  colorScheme?: 'warm' | 'cool' | 'viridis';
  showMagnifier?: boolean;
  magnifierScale?: number;
}

export interface RankSliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  disabled?: boolean;
}

export interface AlphaSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  disabled?: boolean;
}

export interface StatsPanelProps {
  originalParams: number;
  loraParams: number;
  savingRatio: number;
  mse: number;
  rank: number;
  alpha?: number;
  deltaNorm?: number;
  deltaScaledNorm?: number;
  updatedNorm?: number;
  originalNorm?: number;
  scaleRatio?: number;
}

export interface DeltaStats {
  deltaNorm: number;
  deltaScaledNorm: number;
  updatedNorm: number;
  originalNorm: number;
  scaleRatio: number;
}

export interface LoraState {
  rank: number;
  alpha: number;
  isLoading: boolean;
  isFinetuning: boolean;
  error: string | null;
  matrixW: MatrixData | null;
  matrixA: MatrixData | null;
  matrixB: MatrixData | null;
  matrixReconstructed: MatrixData | null;
  matrixDelta: MatrixData | null;
  matrixDeltaScaled: MatrixData | null;
  matrixUpdated: MatrixData | null;
  stats: DecomposeResponse['stats'] | null;
  deltaStats: DeltaStats | null;
  finetuneSteps: FinetuneStep[];
  currentStepIndex: number;
  records: MatrixRecord[];
  setRank: (rank: number) => void;
  setAlpha: (alpha: number) => void;
  decompose: (rank: number) => Promise<void>;
  generateMatrix: (rows?: number, cols?: number, seed?: number) => Promise<void>;
  calculateDelta: (rank: number, alpha: number) => Promise<void>;
  startFinetune: (rank: number, alpha: number, steps: number, learningRate: number) => Promise<void>;
  setCurrentStepIndex: (index: number) => void;
  saveCurrentRecord: (seed: number) => Promise<void>;
  loadRecords: () => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  loadRecord: (record: MatrixRecord) => void;
}
