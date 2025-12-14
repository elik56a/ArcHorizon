
import { SketchData } from '../../types';
import { Chat } from '@google/genai';

export interface ImageAttachment {
  mimeType: string;
  data: string;
}

export interface LayerAgent {
    generate(prompt: string, contextData: SketchData | null, images: ImageAttachment[]): Promise<SketchData>;
    createChat(): Chat;
    getSystemInstruction(): string;
}
