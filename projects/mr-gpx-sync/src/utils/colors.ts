
export const COLORS: number[][] = [
  [255, 0, 0, 1],
  [0, 255, 0, 1],
  [0, 0, 255, 1],
  [255, 255, 0, 1],
  [255, 0, 255, 1],
  [0, 255, 255, 1],
  [255, 255, 255, 1],
  [0, 0, 0, 1]
];

export class Colors {

  static getColor(i: number, j: number, J: number): number[] {
    const f: number = 1.0 - 0.75 * (j / J);
    const color: number[] = [...COLORS[i % 8]];
    color[0] = f * color[0];
    color[1] = f * color[1];
    color[2] = f * color[2];
    return color;
  }
}
