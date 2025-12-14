
import { Layer, SketchData, ValidationResult, ValidatorFn } from '../../types';
import { arcValidators } from './arcValidators';

const registry: Record<string, ValidatorFn> = {
  ...arcValidators,
  // Future plumbing/elec validators will be spread here
};

export const getValidator = (id: string): ValidatorFn | undefined => {
  return registry[id];
};

export const runLayerValidators = (layer: Layer, sketch: SketchData, validatorIds: string[]): ValidationResult[] => {
  let results: ValidationResult[] = [];
  
  validatorIds.forEach(id => {
    const validator = registry[id];
    if (validator) {
      try {
        const res = validator(layer, sketch);
        results = [...results, ...res];
      } catch (e) {
        console.error(`Validator ${id} failed:`, e);
      }
    }
  });

  return results;
};
