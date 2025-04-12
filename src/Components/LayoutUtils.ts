import { Layout } from "./types";

export function layoutsOverlap(l1: Layout, l2: Layout): boolean {
  if (l1.id === l2.id) return false; // Don't collide with self
  return (
    l1.x < l2.x + l2.w &&
    l1.x + l1.w > l2.x &&
    l1.y < l2.y + l2.h &&
    l1.y + l1.h > l2.y
  );
}

export function getCollisions(layout: Layout[], item: Layout): Layout[] {
  return layout.filter((l) => layoutsOverlap(item, l));
}

export function sortLayout(layout: Layout[]): Layout[] {
  return [...layout].sort((a, b) => {
    if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
      return 1;
    } else if (a.y === b.y && a.x === b.x) {
      return 0; // Keep original order if same position (shouldn't happen?)
    }
    return -1;
  });
}

export function resolveCollisionsAndCompact(
  currentLayout: Layout[],
  movingItem: Layout,
  cols: number,
  preventCollision = false // If true, don't move others, just find valid spot
): Layout[] {
  let layout = [...currentLayout];
  const movingId = movingItem.id;

  // --- STAGE 1: Place Moving Item & Detect Initial Collisions ---
  // Update the position of the moving item in the layout copy
  layout = layout.map(l => l.id === movingId ? movingItem : l);

  if (preventCollision) {
      // Find the first non-colliding spot (simplified)
      while (getCollisions(layout, movingItem).length > 0) {
          movingItem.y++; // Move down simply
          // Add boundary checks
          layout = layout.map(l => l.id === movingId ? movingItem : l);
      }
      return layout;
  }


  // --- STAGE 2: Resolve Collisions by Pushing (Recursive/Iterative) ---
  // This is the really complex part. Needs iteration or recursion.
  // For each collision, push the colliding item down (or right).
  // The pushed item might cause new collisions, so repeat.
  // A common strategy is to push items vertically.
  let changed = true;
  while(changed) {
      changed = false;
      const sorted = sortLayout(layout); // Process top-down
      for (let i = 0; i < sorted.length; i++) {
          const item = sorted[i];
          if (item.id === movingId || item.isStatic) continue; // Don't push the item being dragged or static items

          const collisions = getCollisions(layout, item);
          if (collisions.length > 0) {
              // Find the lowest point of the colliding items
              const lowestCollisionY = Math.max(...collisions.map(l => l.y + l.h));
              if(item.y < lowestCollisionY) {
                    const newY = lowestCollisionY;
                    // Update item position in the main layout array
                    layout = layout.map(l => l.id === item.id ? { ...l, y: newY } : l);
                    changed = true; // Layout modified, need to re-check
              }
          }
      }
  }


  // --- STAGE 3: Compaction (Vertical) ---
  // Move items up into empty space
  changed = true;
   while(changed) {
      changed = false;
      const sorted = sortLayout(layout);
      for (let i = 0; i < sorted.length; i++) {
          const item = sorted[i];
          if (item.id === movingId || item.isStatic) continue; // Don't compact the item being dragged

          let newY = 0; // Try placing from the top
          while(true) {
              const potentialItem = { ...item, y: newY };
              const collisions = getCollisions(layout, potentialItem);
              if (collisions.length === 0) {
                  // Found a free spot higher up or at the same position
                  if (newY < item.y) {
                      layout = layout.map(l => l.id === item.id ? potentialItem : l);
                      changed = true; // Layout modified, need re-sort and re-check
                  }
                  break; // Stop checking lower positions for this item
              }
              newY++; // Try next row down
              if (newY >= item.y) break; // No improvement possible
          }
      }
   }

  return layout;
}
