// src/types/index.ts
export interface Tool {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
}

export interface AppState {
  currentTool: string;
  theme: 'light' | 'dark';
  isLoading: boolean;
}

export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export type AppAction =
  | { type: 'SET_CURRENT_TOOL'; payload: string }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_LOADING'; payload: boolean };

// Enhanced JSON Generator Types with Nested Support
export interface JSONField {
  id: string;
  key: string;
  value: string | number | boolean | null | JSONField[] | Record<string, unknown>;
  type: 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';
  isEditing?: boolean;
  // New properties for nested support
  children?: JSONField[];
  isCollapsed?: boolean;
  depth?: number;
  parentId?: string;
}

export interface JSONGeneratorState {
  fields: JSONField[];
  generatedJSON: object;
  isValid: boolean;
}

// New types for drag and drop support
export interface DragItem {
  id: string;
  index: number;
  type: string;
}

// Enhanced field operations
export type FieldOperation = 
  | { type: 'ADD_FIELD'; payload: { parentId?: string; index?: number } }
  | { type: 'REMOVE_FIELD'; payload: { id: string } }
  | { type: 'UPDATE_FIELD'; payload: { id: string; updates: Partial<JSONField> } }
  | { type: 'MOVE_FIELD'; payload: { dragIndex: number; hoverIndex: number; parentId?: string } }
  | { type: 'TOGGLE_COLLAPSE'; payload: { id: string } }
  | { type: 'ADD_CHILD'; payload: { parentId: string } };