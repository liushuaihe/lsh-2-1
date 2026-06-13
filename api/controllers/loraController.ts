import type { Request, Response } from 'express';
import { calculateDeltaWithAlpha, simulateFinetune } from '../services/loraFinetuneService';
import type { CalculateDeltaRequest, SimulateFinetuneRequest } from '../types';

export function calculateDelta(req: Request<object, object, CalculateDeltaRequest>, res: Response) {
  try {
    const { rank, alpha } = req.body;

    if (rank === undefined || rank === null) {
      return res.status(400).json({
        success: false,
        error: 'Rank parameter is required',
      });
    }

    if (alpha === undefined || alpha === null) {
      return res.status(400).json({
        success: false,
        error: 'Alpha parameter is required',
      });
    }

    if (rank < 1 || rank > 128) {
      return res.status(400).json({
        success: false,
        error: 'Rank must be between 1 and 128',
      });
    }

    if (alpha < 0 || alpha > 100) {
      return res.status(400).json({
        success: false,
        error: 'Alpha must be between 0 and 100',
      });
    }

    const result = calculateDeltaWithAlpha(rank, alpha);
    res.json(result);
  } catch (error) {
    console.error('Error in calculateDelta:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate delta',
    });
  }
}

export function startFinetune(req: Request<object, object, SimulateFinetuneRequest>, res: Response) {
  try {
    const { rank, alpha, steps, learningRate, seed } = req.body;

    if (rank === undefined || rank === null) {
      return res.status(400).json({
        success: false,
        error: 'Rank parameter is required',
      });
    }

    if (alpha === undefined || alpha === null) {
      return res.status(400).json({
        success: false,
        error: 'Alpha parameter is required',
      });
    }

    if (steps === undefined || steps === null) {
      return res.status(400).json({
        success: false,
        error: 'Steps parameter is required',
      });
    }

    if (learningRate === undefined || learningRate === null) {
      return res.status(400).json({
        success: false,
        error: 'Learning rate parameter is required',
      });
    }

    if (rank < 1 || rank > 128) {
      return res.status(400).json({
        success: false,
        error: 'Rank must be between 1 and 128',
      });
    }

    if (alpha < 0 || alpha > 100) {
      return res.status(400).json({
        success: false,
        error: 'Alpha must be between 0 and 100',
      });
    }

    if (steps < 1 || steps > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Steps must be between 1 and 10000',
      });
    }

    if (learningRate <= 0 || learningRate > 1) {
      return res.status(400).json({
        success: false,
        error: 'Learning rate must be between 0 and 1',
      });
    }

    const result = simulateFinetune(rank, alpha, steps, learningRate, seed);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in startFinetune:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate finetune',
    });
  }
}
