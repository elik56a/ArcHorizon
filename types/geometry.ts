
export interface Point {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Transform extends Point, Dimensions {
  rotation?: number;
}
