import type { ExtractionConfig } from './extraction';

export interface Template {
  id: string;
  name: string;
  description: string;
  domain: string;
  urlPattern: string;
  config: ExtractionConfig;
  createdAt: number;
  updatedAt: number;
  lastUsed: number;
  useCount: number;
  successRate: number;
}
