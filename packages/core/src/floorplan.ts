import type { Room } from "./types";

export interface PlacedRoom extends Room {
  x: number;
  y: number;
  w: number;
  h: number;
  areaSqft: number;
}

export const roomArea = (r: Room) => r.widthFt * r.lengthFt;

/** RERA carpet area: rooms excluding balconies. */
export const carpetFromRooms = (rooms: Room[]) => rooms.filter((r) => !r.balcony).reduce((s, r) => s + roomArea(r), 0);

/**
 * Schematic plan: rooms packed into rows so that each rectangle keeps the
 * room's real area. Used as the 2D fallback and as the input for the
 * extruded Tier 1 model; the real plan PDF replaces it once read.
 */
export function layoutPlan(rooms: Room[]): { rooms: PlacedRoom[]; width: number; height: number } {
  const total = rooms.reduce((s, r) => s + roomArea(r), 0);
  if (total === 0) return { rooms: [], width: 0, height: 0 };
  const width = Math.sqrt(total * 1.5);
  const rows: Room[][] = [[]];
  let rowArea = 0;
  const targetRow = total / Math.max(2, Math.round(rooms.length / 3));
  for (const r of rooms) {
    if (rowArea >= targetRow * 0.85 && rows[rows.length - 1]!.length > 0) {
      rows.push([]);
      rowArea = 0;
    }
    rows[rows.length - 1]!.push(r);
    rowArea += roomArea(r);
  }
  // A small leftover row would be stretched into a thin strip; fold it into the row above.
  if (rows.length > 1 && rowArea < targetRow * 0.45) rows[rows.length - 2]!.push(...rows.pop()!);
  const placed: PlacedRoom[] = [];
  let y = 0;
  for (const row of rows) {
    const area = row.reduce((s, r) => s + roomArea(r), 0);
    const h = area / width;
    let x = 0;
    for (const r of row) {
      const a = roomArea(r);
      const w = a / h;
      placed.push({ ...r, x, y, w, h, areaSqft: a });
      x += w;
    }
    y += h;
  }
  return { rooms: placed, width, height: y };
}

export interface FitResult {
  fits: boolean;
  /** Spare feet along the room's length and width once placed the best way round. */
  spareLength: number;
  spareWidth: number;
  rotated: boolean;
}

/**
 * Will a piece of furniture fit the room's floor? Checks both orientations and
 * keeps a walking gap; door swings and windows are not modelled yet.
 */
export function furnitureFit(room: Room, itemLengthFt: number, itemWidthFt: number, walkwayFt = 2): FitResult {
  const long = Math.max(room.widthFt, room.lengthFt);
  const short = Math.min(room.widthFt, room.lengthFt);
  const options = [
    { l: itemLengthFt, w: itemWidthFt, rotated: false },
    { l: itemWidthFt, w: itemLengthFt, rotated: true },
  ].map((o) => ({ ...o, spareLength: long - o.l, spareWidth: short - o.w - walkwayFt }));
  const best = options.find((o) => o.spareLength >= 0 && o.spareWidth >= 0) ?? options.sort((a, b) => Math.min(b.spareLength, b.spareWidth) - Math.min(a.spareLength, a.spareWidth))[0]!;
  return { fits: best.spareLength >= 0 && best.spareWidth >= 0, spareLength: best.spareLength, spareWidth: best.spareWidth, rotated: best.rotated };
}
