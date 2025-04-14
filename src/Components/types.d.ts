// -- Common Types --
export type Vec2 = {
  x: number;
  y: number;
};

export type Rect = {
  pos: Vec2;
  size: Vec2;
};

export type Layout = {
  w: number;
  h: number;
  x: number;
  y: number;
  id: number | string;
  isStatic: boolean;
};

export type ExtendedLayout = Layout & {
  minW: number | null;
  minH: number | null;
  maxW: number | null;
  maxH: number | null;
  isDraggable: boolean | null;
  isResizeable: boolean | null;
};

// -- Widget Types --
export type WidgetProps = {
  children: React.ReactNode;
  id: number | string;
  className?: string;
  style?: React.CSSProperties;
  layout?: ExtendedLayout
};

export type WidgetRef = {
  getSize: () => Vec2;
  getPosition: () => Vec2;
  setPosition: (pos: Vec2) => void;
  setState: (layout: ExtendedLayout) => void;
  getStatic: () => boolean;
};

export type WidgetState = {
  gridPos: Vec2;
  gridSize: Vec2;
  status: "idle" | "moving" | "resizing";

  interactionPixelPos: Vec2 | null;
  interactionPixelSize: Vec2 | null;
  dragStartOffset: Vec2 | null;
  potentialGridPos: Vec2 | null;
  potentialGridSize: Vec2 | null;
  prevValue: Vec2 | null;

  interactionJustEnded: boolean;
  changeOccurred: boolean;

  minSize: Vec2;
  maxSize: Vec2;
  isResizeable: boolean,
  isDraggable: boolean,
  isStatic: boolean
};

export type WidgetAction =
  | { type: "SET_POSITION"; payload: Vec2 }
  | { type: "SET_STATE"; payload: ExtendedLayout }
  | {
      type: "MOVE_START";
      payload: {
        clientX: number;
        clientY: number;
        elementRect: DOMRect;
        gridContext: GridContextType;
      };
    }
  | {
      type: "MOVE";
      payload: {
        clientX: number;
        clientY: number;
        gridContext: GridContextType;
      };
    }
  | {
      type: "MOVE_END";
    }
  | {
      type: "RESIZE_START";
      payload: {
        clientX: number;
        clientY: number;
        elementRect: DOMRect;
        gridContext: GridContextType;
      };
    }
  | {
      type: "RESIZE";
      payload: {
        clientX: number;
        clientY: number;
        gridContext: GridContextType;
      };
    }
  | {
      type: "RESIZE_END";
    }
  | {
      type: "INTERACTION_END";
    };

// -- Grid Types --
export type GridState = {
  width: number;
  rows: number;
  rowsHeight: number;
  top: number;
  left: number;
  scrollTop: number;
  scrollLeft: number;
};

export type GridRef = {
  getLayout: () => Layout[];
};

export type GridProps = {
  children: React.ReactElement[];
  cols?: number;
  rows?: number;
  padding?: number;
  gap?: number;
  showSlots?: boolean;
  showPlaceholder?: boolean;
  layout: ExtendedLayout[];
  setLayout: (layout: ExtendedLayout[]) => void;
};

type RenderFunction = (prev: boolean) => boolean

export type GridContextType = {
  cols: number;
  colWidth: number;
  rows: number;
  rowHeight: number;
  gap: number;
  top: number;
  left: number;
  scrollTop: number;
  scrollLeft: number;
  width: number;
  changing: number | string;
  setChanging: (val: number | string) => void;
  rect: Rect;
  setRect: (rect: Rect) => void;
  setRender: (fn: RenderFunction) => void
};
