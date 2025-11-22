export interface Point {
  x: number;
  y: number;
}

// Affine matrix [a, b, c, d, e, f] representing:
// | a c e |
// | b d f |
// | 0 0 1 |
export type Matrix = [number, number, number, number, number, number];

export type Color = [number, number, number];

export interface ColorScheme {
  [key: string]: Color;
}

export interface Renderable {
  draw: (ctx: CanvasRenderingContext2D, transform: Matrix, colors: ColorScheme) => void;
  getSVG: (transform: Matrix, colors: ColorScheme) => string;
  quad: Point[]; // Control points for substitution
}

export interface TileSystem {
  [key: string]: Renderable;
}

export type TileType = 'Spectres' | 'Hexagons' | 'Turtles in Hats' | 'Hats in Turtles' | 'Tile(1,1)';
export type ColorTheme = 'Pride' | 'Mystics' | 'Figure 5.3' | 'Bright';
