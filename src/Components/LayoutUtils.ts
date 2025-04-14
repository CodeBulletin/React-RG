import { ExtendedLayout, Layout, Vec2 } from "./types";

export const areVec2Equal = (v1: Vec2 | undefined | null, v2: Vec2 | undefined | null): boolean => {
  if (!v1 || !v2) return v1 === v2;
  return v1.x === v2.x && v1.y === v2.y;
};

function doRectanglesOverlap(rectA: Layout, rectB: Layout): boolean {
  if (rectA.id === rectB.id || rectA.isStatic) return false;

  const isSeparate =
    rectA.x + rectA.w <= rectB.x ||
    rectA.x >= rectB.x + rectB.w ||
    rectA.y + rectA.h <= rectB.y ||
    rectA.y >= rectB.y + rectB.h;

  return !isSeparate;
}

export function sortLayout(layout: Layout[]): Layout[] {
  return [...layout].sort((a, b) => {
    if (a.y > b.y) return 1;

    if (a.y < b.y) return -1;

    if (a.x > b.x) return 1;

    if (a.x < b.x) return -1;

    return 0;
  });
}

function horizontalCollision(item1: Layout, item2: Layout): boolean {
  if (item1.id === item2.id || item1.isStatic) return false;
  return item1.x + item1.w > item2.x && item1.x < item2.x + item2.w;
}

export function getOverlaps(layout: Layout[], item: Layout): Layout[] {
  const overlapping = layout.filter((l) => doRectanglesOverlap(item, l));
  return sortLayout(overlapping);
}

function fixAllCollision(layout: Layout[] | ExtendedLayout[], id: number | string) {
  let changed = true;
  while (changed) {
    changed = false;
    const sorted = sortLayout(layout);
    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      if (item.id === id || item.isStatic) continue;

      const collisions = getOverlaps(layout, item);
      if (collisions.length > 0) {
        const lowestCollisionY = Math.max(...collisions.map((l) => l.y + l.h));
        if (item.y < lowestCollisionY) {
          const newY = lowestCollisionY;
          item.y = newY;
          changed = true;
        }
      }
    }
  }
}

function compact(layout: Layout[] | ExtendedLayout[], id: number | string) {
  let changed = true;


  while (changed) {
    changed = false;
    let sorted = sortLayout(layout);

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      if (item.isStatic) continue;
      let newY = 0; 
      for (let j = 0; j < sorted.length; j++) {
        const other = sorted[j];
        if (other.id === item.id) continue; 
        if (horizontalCollision(item, other)) {
            if(other.y + other.h <= item.y) {
                 newY = Math.max(newY, other.y + other.h);
            }
        }
      }

      if (item.y > newY) {
        const originalItem = layout.find(l => l.id === item.id);
        if (originalItem && originalItem.y !== newY) {
            originalItem.y = newY;
            changed = true; 
        }
      }
    } 
  }
}

export function resolveCollisionAndCompact(
  layout: Layout[] | ExtendedLayout[],
  item: Layout | ExtendedLayout
): Layout[] {
  fixAllCollision(layout, item.id);
  compact(layout, item.id)

  layout.filter(l => l.isStatic).forEach(l => fixAllCollision(layout, l.id))
  return layout;
}
