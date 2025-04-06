type LayoutItem = {
  w: number;
  h: number;
  x: number;
  y: number;
  i: string;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  moved?: boolean;
  static?: boolean;
};

type Layout = LayoutItem[];

// Deep copy of a layout item
function cloneLayoutItem(item: LayoutItem): LayoutItem {
  return { ...item };
}

// Deep copy of a layout
function cloneLayout(layout: Layout): Layout {
  return layout.map(cloneLayoutItem);
}

// Get the bottom coordinate of the layout
function bottom(layout: Layout): number {
  return layout.reduce((acc, item) => Math.max(acc, item.y + item.h), 0);
}

// Get a layout item by ID
function getLayoutItem(layout: Layout, id: string): LayoutItem | undefined {
  return layout.find((item) => item.i === id);
}

// Check if two layout items collide
function collides(item1: LayoutItem, item2: LayoutItem): boolean {
  if (item1.i === item2.i) return false;

  const noXOverlap =
    item1.x + item1.w <= item2.x || item1.x >= item2.x + item2.w;
  const noYOverlap =
    item1.y + item1.h <= item2.y || item1.y >= item2.y + item2.h;

  return !(noXOverlap || noYOverlap);
}

// Find all items that collide with a given item
function getAllCollisions(layout: Layout, item: LayoutItem): LayoutItem[] {
  return layout.filter((other) => collides(item, other));
}

// Compact a layout vertically or horizontally (currently vertical)
function compact(
  layout: Layout,
  compactType: "vertical" | "horizontal" | null,
  cols: number
): Layout {
  const sorted = [...layout].sort((a, b) => a.y - b.y || a.x - b.x);
  const out: Layout = [];

  for (const itemOrig of sorted) {
    const item = cloneLayoutItem(itemOrig);

    if (!item.static) {
      while (item.y > 0 && getAllCollisions(out, item).length === 0) {
        item.y -= 1;
      }
    }

    out.push(item);
  }

  return out;
}

// Move an item and handle collisions
function moveElement(
  layout: Layout,
  item: LayoutItem,
  x: number | null,
  y: number | null,
  cols: number
): Layout {
  if (item.static) return layout;

  const newLayout = cloneLayout(layout);
  const targetItem = getLayoutItem(newLayout, item.i);

  if (targetItem) {
    if (x !== null) {
      targetItem.x = Math.max(0, Math.min(cols - targetItem.w, x));
    }
    if (y !== null) {
      targetItem.y = Math.max(0, y);
    }
    targetItem.moved = true;

    const collisions = getAllCollisions(newLayout, targetItem);
    for (const collision of collisions) {
      if (collision.static) continue;
      collision.y += targetItem.h;
    }
  }

  return newLayout;
}

// Ensure items are within bounds
function correctBounds(layout: Layout, cols: number): Layout {
  return layout.map((item) => {
    const newItem = { ...item };
    if (newItem.x + newItem.w > cols) {
      newItem.x = cols - newItem.w;
    }
    if (newItem.x < 0) {
      newItem.x = 0;
    }
    return newItem;
  });
}
