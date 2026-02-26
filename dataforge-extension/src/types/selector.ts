export interface SelectorResult {
  selector: string;
  specificity: number;
  stability: number;
  readability: number;
  totalScore: number;
  strategy: 'data-attribute' | 'semantic-class' | 'aria-role' | 'structural-path' | 'nth-child';
  matchCount: number;
}

export interface SelectorPath {
  segments: SelectorSegment[];
  fullSelector: string;
}

export interface SelectorSegment {
  tag: string;
  classes: string[];
  id?: string;
  index: number;
  selector: string;
}
