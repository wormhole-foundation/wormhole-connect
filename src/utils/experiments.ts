import config from 'config';
import { Experiments } from 'config/ui';

// Returns an experimental feature value or the default value if the experiment is not set
export function getExperiment(key: Experiments, defaultValue = false): boolean {
  if (!config.ui?.experimental || config.ui.experimental[key] === undefined) {
    return defaultValue;
  }
  return config.ui.experimental[key];
}
