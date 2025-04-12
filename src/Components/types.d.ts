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

// -- Widget Types --
export type WidgetProps = {
  children: React.ReactNode;
  id: number | string;
  x: number;
  y: number;
  w: number;
  h: number;

  static?: boolean;
  isResizable?: boolean;
  isMovable?: boolean;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;

  className?: string;
  style?: React.CSSProperties;
};

export type WidgetRef = {
  getSize: () => Vec2;
  getPosition: () => Vec2;
  setPosition: (pos: Vec2) => void;
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

  interactionJustEnded: boolean;
  changeOccurred: boolean;
};

export type WidgetAction =
  | {
      type: "PROPS_UPDATE";
      payload: {
        x: number;
        y: number;
        w: number;
        h: number;
        minW?: number;
        maxW?: number;
        minH?: number;
        maxH?: number;
      };
    }
  | { type: "SET_POSITION"; payload: Vec2 }
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
        minW?: number;
        maxW?: number;
        minH?: number;
        maxH?: number;
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
  rowHeight?: number;
  gap?: number;
  showSlots?: boolean;
  showPlaceholder?: boolean;
};

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
  changed: number | string;
  setChanged: (val : number | string) => void;
  changing: number | string;
  setChanging: (val : number | string) => void;
  rect: Rect;
  setRect: ( rect: Rect ) => void;
};
