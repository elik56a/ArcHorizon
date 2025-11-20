
export interface Attachment {
  type: 'image';
  url: string;
  file?: File;
}

export interface ActionPayload {
  type: 'propose_design';
  summary: string;
  title: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  action?: ActionPayload; 
  isStreaming?: boolean;
}

export interface Selection {
  id: string;
  type: 'room' | 'element';
}

export type DesignStyle = 'Modern' | 'Rustic' | 'Creative';

export type UnitSystem = 'metric' | 'imperial';
