import { langToExt, padNumber, slugify } from '../utils/helpers';
import type { SolutionToSync } from '../types/sync.types';

export type FolderConvention = 'number' | 'difficulty' | 'topic';

// The folder a problem lives in, per the repo's chosen convention. Default: zero-padded number.
export function problemFolder(item: SolutionToSync, convention: FolderConvention = 'number'): string {
  switch (convention) {
    case 'difficulty':
      return `${item.difficulty ?? 'unknown'}/${padNumber(item.number)}`;
    case 'topic':
      return `${slugify(item.topics[0] ?? 'misc')}/${padNumber(item.number)}`;
    case 'number':
    default:
      return padNumber(item.number);
  }
}

export function questionPath(item: SolutionToSync, convention: FolderConvention = 'number'): string {
  return `${problemFolder(item, convention)}/question.md`;
}

export function solutionPath(item: SolutionToSync, convention: FolderConvention = 'number'): string {
  return `${problemFolder(item, convention)}/solution.${langToExt(item.language)}`;
}
