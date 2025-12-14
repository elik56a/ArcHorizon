
import { StateCreator } from 'zustand';
import { ProjectState } from '../useProjectStore';

export type SliceCreator<T> = StateCreator<ProjectState, [], [], T>;
