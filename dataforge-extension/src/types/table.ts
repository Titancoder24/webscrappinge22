export interface ColumnDef {
  id: string;
  name: string;
  dataType: 'text' | 'number' | 'price' | 'url' | 'image' | 'email' | 'date' | 'rating' | 'phone' | 'location';
  width: number;
  visible: boolean;
  sortable: boolean;
  filterable: boolean;
}

export interface FilterConfig {
  columnId: string;
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex' | 'gt' | 'lt' | 'between' | 'empty' | 'not_empty';
  value: string;
  value2?: string;
}

export interface SortConfig {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface TableMeta {
  id: string;
  name: string;
  sourceUrl: string;
  createdAt: number;
  updatedAt: number;
  rowCount: number;
  columns: ColumnDef[];
  tool: string;
}
