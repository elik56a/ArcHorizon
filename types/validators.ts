
import { Layer, SketchData } from './index';

export type ValidationSeverity = 'info' | 'warning' | 'error';

export interface ValidationResult {
  id: string;
  layerId: string;
  elementId?: string; // The specific item causing the issue
  message: string;
  severity: ValidationSeverity;
}

export type ValidatorFn = (layer: Layer, sketch: SketchData) => ValidationResult[];
