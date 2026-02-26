export interface Settings {
  general: {
    theme: 'dark';
    animationsEnabled: boolean;
    notificationsEnabled: boolean;
    autoSaveHistory: boolean;
  };
  extraction: {
    defaultMaxItems: number;
    defaultMaxPages: number;
    defaultDelay: number;
    respectRobotsTxt: boolean;
    autoCleanData: boolean;
    autoDeduplicate: boolean;
    concurrentTabs: number;
  };
  export: {
    defaultFormat: 'csv' | 'xlsx' | 'json';
    csvDelimiter: ',' | ';' | '\t' | '|';
    csvEncoding: 'utf-8' | 'utf-16' | 'ascii';
    jsonFormat: 'array' | 'nested';
    includeHeaders: boolean;
    includeTimestamp: boolean;
  };
  advanced: {
    selectorStrategy: 'auto' | 'data-attributes' | 'semantic' | 'structural';
    scrollSpeed: 'slow' | 'medium' | 'fast';
    mutationWaitMs: number;
    maxRetries: number;
    debugMode: boolean;
  };
}

export const defaultSettings: Settings = {
  general: {
    theme: 'dark',
    animationsEnabled: true,
    notificationsEnabled: true,
    autoSaveHistory: true,
  },
  extraction: {
    defaultMaxItems: 1000,
    defaultMaxPages: 50,
    defaultDelay: 1000,
    respectRobotsTxt: true,
    autoCleanData: true,
    autoDeduplicate: true,
    concurrentTabs: 2,
  },
  export: {
    defaultFormat: 'csv',
    csvDelimiter: ',',
    csvEncoding: 'utf-8',
    jsonFormat: 'array',
    includeHeaders: true,
    includeTimestamp: true,
  },
  advanced: {
    selectorStrategy: 'auto',
    scrollSpeed: 'medium',
    mutationWaitMs: 2000,
    maxRetries: 3,
    debugMode: false,
  },
};
