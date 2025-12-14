
import React from 'react';
import { ElementType, Room, ArchitecturalElement, DrawingPath, RoomType } from './blueprint';
import { ValidationResult } from './validators';

export type Discipline = 'arc' | 'plumbing' | 'elec' | 'hvac' | 'fire';

export interface Layer {
  id: string;
  discipline: Discipline;
  name: string;
  isVisible: boolean;
  isLocked: boolean;
  rooms: Room[];
  elements: ArchitecturalElement[];
  drawings: DrawingPath[];
  validations: ValidationResult[];
}

export type PaletteCategory = 'Zones' | 'Openings' | 'Furniture' | 'Wet Areas' | 'Appliances' | 'Pipes' | 'Electrical' | 'HVAC' | 'Safety';

export interface PaletteItem {
  type: ElementType | RoomType;
  label: string;
  category: PaletteCategory;
  defaultWidth: number; // cm
  defaultHeight: number; // cm
  icon: React.ComponentType<any>;
  isRoom: boolean;
}

export interface LayerConfig {
  discipline: Discipline;
  label: string;
  palette: PaletteItem[]; 
  editableScopes: {
    rooms: boolean;
    openings: boolean; // doors/windows that cut walls
    elements: boolean; // furniture/fixtures
    drawings: boolean;
  };
  validators: string[]; // List of validator IDs to run
  promptSystemInstruction?: string;
}
