
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Selection {
  id: string;
  type: 'room' | 'element';
}

export type DesignStyle = 'Modern' | 'Rustic' | 'Creative';

export type UnitSystem = 'metric' | 'imperial';
