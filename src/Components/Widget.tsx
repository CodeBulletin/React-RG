import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
} from "react";
import { useGridContext } from "./Grid";

export type WidgetContext = {
  resizeRef: React.RefObject<HTMLDivElement | null>;
  moveRef: React.RefObject<HTMLDivElement | null>;
};

export type WidgetProps = {
  children: React.ReactNode;
  id: number;
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
};

export type WidgetRef = {
  getSize: () => vec2;
  getPosition: () => vec2;
  setPosition: (pos: vec2) => void;
};

export type vec2 = {
  x: number;
  y: number;
};

export type positionState = {
  pos: vec2;
  newPos: vec2 | null;
  isMoving: boolean;
};

export type sizeState = {
  size: vec2;
  newSize: vec2 | null;
  isResizing: boolean;
};

const WidgetContext = React.createContext<WidgetContext | null>(null);

export const useWidgetContext = () => {
  const context = React.useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidgetContext must be used within a WidgetProvider");
  }
  return context;
};

export const Widget = forwardRef(
  (props: WidgetProps, ref: React.Ref<WidgetRef>) => {
    const { children } = props;
    const gridContext = useGridContext();

    const [pos, setPos] = React.useState<positionState>({
      pos: { x: props.x, y: props.y },
      newPos: null,
      isMoving: false,
    });
    const [actualPos, setActualPos] = React.useState<vec2>({ x: 0, y: 0 });

    const [size, setSize] = React.useState<sizeState>({
      size: {
        x: Math.min(Math.max(props.w, props.minW ?? 1), props.maxW ?? Infinity),
        y: Math.min(Math.max(props.h, props.minH ?? 1), props.maxH ?? Infinity),
      },
      newSize: null,
      isResizing: false,
    });
    const [actualSize, setActualSize] = React.useState<vec2>({ x: 0, y: 0 });

    const [offset, setOffset] = React.useState<vec2>({ x: 0, y: 0 });
    const [movHandelDown, setMovHandelDown] = React.useState<vec2 | null>(null);
    const [movHandelDrag, setMovHandelDrag] = React.useState<vec2 | null>(null);
    const [resizeHandelDown, setResizeHandelDown] = React.useState<vec2 | null>(
      null
    );
    const [resizeHandelDrag, setResizeHandelDrag] = React.useState<vec2 | null>(
      null
    );

    const divref = React.useRef<HTMLDivElement>(null);
    const moveRef = React.useRef<HTMLDivElement>(null);
    const resizeRef = React.useRef<HTMLDivElement>(null);

    // Imparative Handel
    useImperativeHandle(
      ref,
      () => ({
        getPosition: () => pos.pos,
        getSize: () => size.size,
        setPosition: (pos: vec2) =>
          setPos((prev) => ({
            ...prev,
            pos: pos,
          })),
      }),
      [size, pos]
    );

    // Move Logic
    const handelMoving = (e: MouseEvent) => {
      if (props.isMovable === false) return;
      if (!divref.current) return;
      if (movHandelDrag) return;
      setMovHandelDrag({
        x: e.clientX - gridContext.top,
        y: e.clientY - gridContext.left,
      });
    };

    const handleMovingDown = (e: MouseEvent) => {
      if (props.isMovable === false) return;
      if (!divref.current) return;
      setMovHandelDrag(null);
      setMovHandelDown((_) => ({
        x: e.clientX - gridContext.top,
        y: e.clientY - gridContext.left,
      }));
    };

    const handleMovingUp = () => {
      setPos((prev) => ({
        ...prev,
        isMoving: false,
      }));
      gridContext.setChanging((_) => -1);
    };

    useLayoutEffect(() => {
      if (!movHandelDown) return;
      setPos((prev) => ({
        ...prev,
        isMoving: true,
      }));

      setOffset((_) => ({
        x: movHandelDown.x - (pos.pos.x * gridContext.width) / gridContext.cols, // does ot require the addition of gap becz included in width
        y:
          movHandelDown.y -
          pos.pos.y * (gridContext.rowHeight + gridContext.gap),
      }));

      setActualPos({
        x: movHandelDown.x,
        y: movHandelDown.y,
      });

      setActualSize({
        x: divref.current?.getBoundingClientRect().width ?? 0,
        y: divref.current?.getBoundingClientRect().height ?? 0,
      });
      gridContext.setChanging((_) => props.id);
      gridContext.setRect({
        pos: pos.pos,
        size: size.size,
      });
      setMovHandelDown((_) => null);
    }, [movHandelDown]);

    useLayoutEffect(() => {
      if (!movHandelDrag) return;
      let rect = divref.current?.getBoundingClientRect();
      let x: number = movHandelDrag.x - offset.x;
      let y: number = movHandelDrag.y - offset.y;

      setActualPos((_) => ({
        x: Math.max(Math.min(x, gridContext.width - (rect?.width ?? 0)), 0),
        y: Math.max(y, 0),
      }));

      let topCenter: vec2 = {
        x: (rect?.left ?? 0) - gridContext.left + (rect?.width ?? 0) / 2,
        y: (rect?.top ?? 0) - gridContext.top,
      };

      let newX = Math.max(
        Math.min(
          Math.ceil(
            Math.floor(topCenter.x / (gridContext.width / gridContext.cols)) -
              size.size.x / 2
          ),
          gridContext.cols - size.size.x
        ),
        0
      );
      let newY = Math.max(
        Math.floor(topCenter.y / (gridContext.rowHeight + gridContext.gap)),
        0
      );

      setPos((prev) => ({
        ...prev,
        newPos: { x: newX, y: newY },
      }));
      setMovHandelDrag(null);
    }, [movHandelDrag]);

    useEffect(() => {
      if (pos.isMoving) {
        window.addEventListener("mousemove", handelMoving);
        window.addEventListener("mouseup", handleMovingUp);
      } else {
        window.removeEventListener("mousemove", handelMoving);
        window.removeEventListener("mouseup", handleMovingUp);
      }
      return () => {
        window.removeEventListener("mousemove", handelMoving);
        window.removeEventListener("mouseup", handleMovingUp);
      };
    }, [pos.isMoving]);

    useEffect(() => {
      if (pos.newPos) {
        if (pos.newPos.x !== pos.pos.x || pos.newPos.y !== pos.pos.y) {
          setPos((prev) => ({
            ...prev,
            pos: {
              x: pos.newPos?.x || 0,
              y: pos.newPos?.y || 0,
            },
          }));
          gridContext.setRect({
            pos: pos.newPos,
            size: size.size,
          });
          gridContext.setChanged((_) => props.id);
        }
      }
    }, [pos.newPos]);

    useLayoutEffect(() => {
      if (divref.current) {
        if (pos.isMoving) {
          divref.current.style.position = "absolute";
          divref.current.style.top = `${actualPos.y}px`;
          divref.current.style.left = `${actualPos.x}px`;
          divref.current.style.width = `${actualSize.x}px`;
          divref.current.style.height = `${actualSize.y}px`;
        } else {
          divref.current.style.position = "relative";
          divref.current.style.top = `0px`;
          divref.current.style.left = `0px`;
          divref.current.style.width = `100%`;
          divref.current.style.height = `100%`;
          divref.current.style.gridArea = `${pos.pos.y + 1} / ${
            pos.pos.x + 1
          } / span ${size.size.y} / span ${size.size.x}`;
        }
      }
    }, [pos.isMoving, pos.pos, actualPos]);

    useEffect(() => {
      if (moveRef.current) {
        moveRef.current.addEventListener("mousedown", handleMovingDown);
      }
      return () => {
        if (moveRef.current) {
          moveRef.current.removeEventListener("mousedown", handleMovingDown);
        }
      };
    }, [moveRef.current]);

    // Resize Logic
    const handelResizing = (e: MouseEvent) => {
      if (props.isResizable === false) return;
      if (!divref.current) return;
      if (resizeHandelDrag) return;

      setResizeHandelDrag((_) => ({
        x: e.clientX,
        y: e.clientY,
      }));
    };

    const handleResizingDown = (e: MouseEvent) => {
      if (props.isResizable === false) return;
      if (!divref.current) return;

      setResizeHandelDown((_) => ({
        x: e.clientX,
        y: e.clientY,
      }));

      setResizeHandelDrag((_) => null);
    };

    const handleResizingUp = () => {
      setSize((prev) => ({
        ...prev,
        isResizing: false,
      }));

      gridContext.setChanging((_) => -1);
    };

    useLayoutEffect(() => {
      if (!resizeHandelDown) return;

      setSize((prev) => ({
        ...prev,
        isResizing: true,
      }));

      setActualSize((_) => ({
        x:
          resizeHandelDown.x -
          (divref.current?.getBoundingClientRect().left ?? 0),
        y:
          resizeHandelDown.y -
          (divref.current?.getBoundingClientRect().top ?? 0),
      }));

      setActualPos((_) => ({
        x: (pos.pos.x * gridContext.width) / gridContext.cols,
        y: pos.pos.y * (gridContext.rowHeight + gridContext.gap),
      }));

      setResizeHandelDown((_) => null);
      gridContext.setChanging((_) => props.id);
    }, [resizeHandelDown]);

    useLayoutEffect(() => {
      if (!resizeHandelDrag) return;

      let x: number = resizeHandelDrag.x;
      let y: number = resizeHandelDrag.y;

      let rect = divref.current?.getBoundingClientRect();

      let left = rect?.left ?? 0 - gridContext.left;
      let top = rect?.top ?? 0 - gridContext.top;

      let ax = Math.max(
        Math.min(x - left, gridContext.width),
        (props.minW ?? 1) * (gridContext.width / gridContext.cols) -
          gridContext.gap
      );
      let ay = Math.max(
        y - top,
        (props.minH ?? 1) * (gridContext.rowHeight + gridContext.gap) -
          gridContext.gap
      );

      if (
        props.maxW &&
        ax >
          props.maxW * (gridContext.width / gridContext.cols) - gridContext.gap
      )
        ax =
          props.maxW * (gridContext.width / gridContext.cols) - gridContext.gap;

      if (
        props.maxH &&
        ay >
          props.maxH * (gridContext.rowHeight + gridContext.gap) -
            gridContext.gap
      )
        ay =
          props.maxH * (gridContext.rowHeight + gridContext.gap) -
          gridContext.gap;

      setActualSize((_) => ({
        x: ax,
        y: ay,
      }));

      let newW = Math.max(
        Math.min(
          Math.ceil((x - left) / (gridContext.width / gridContext.cols)),
          gridContext.cols - pos.pos.x
        ),
        props.minW ?? 1
      );

      let newH = Math.max(
        Math.ceil((y - top) / (gridContext.rowHeight + gridContext.gap)),
        props.minH ?? 1
      );

      if (props.maxW && newW > props.maxW) newW = props.maxW;

      if (props.maxH && newH > props.maxH) newH = props.maxH;

      setSize((prev) => ({
        ...prev,
        newSize: { x: newW, y: newH },
      }));

      setResizeHandelDrag((_) => null);
    }, [resizeHandelDrag]);

    useEffect(() => {
      if (size.isResizing) {
        window.addEventListener("mousemove", handelResizing);
        window.addEventListener("mouseup", handleResizingUp);
      } else {
        window.removeEventListener("mousemove", handelResizing);
        window.removeEventListener("mouseup", handleResizingUp);
      }
      return () => {
        window.removeEventListener("mousemove", handelResizing);
        window.removeEventListener("mouseup", handleResizingUp);
      };
    }, [size.isResizing]);

    useEffect(() => {
      if (size.newSize) {
        if (size.newSize.x !== size.size.x || size.newSize.y !== size.size.y) {
          setSize((prev) => ({
            ...prev,
            size: {
              x: size.newSize?.x || 0,
              y: size.newSize?.y || 0,
            },
          }));
          gridContext.setRect({
            pos: pos.pos,
            size: size.newSize,
          });
          gridContext.setChanged((_) => props.id);
        }
      }
    }, [size.newSize]);

    useLayoutEffect(() => {
      if (divref.current) {
        if (size.isResizing) {
          divref.current.style.position = "relative";
          divref.current.style.width = `${actualSize.x}px`;
          divref.current.style.height = `${actualSize.y}px`;
          divref.current.style.gridRowStart = `${pos.pos.y + 1}`;
          divref.current.style.gridColumnStart = `${pos.pos.x + 1}`;
        } else {
          divref.current.style.position = "relative";
          divref.current.style.width = `100%`;
          divref.current.style.height = `100%`;
          divref.current.style.top = `0px`;
          divref.current.style.left = `0px`;
          divref.current.style.gridArea = `${pos.pos.y + 1} / ${
            pos.pos.x + 1
          } / span ${size.size.y} / span ${size.size.x}`;
        }
      }
    }, [size.isResizing, size.size, actualSize]);

    useEffect(() => {
      if (resizeRef.current) {
        resizeRef.current.addEventListener("mousedown", handleResizingDown);
      }
      return () => {
        if (resizeRef.current) {
          resizeRef.current.removeEventListener(
            "mousedown",
            handleResizingDown
          );
        }
      };
    }, [resizeRef.current]);

    return (
      <WidgetContext.Provider
        value={{
          resizeRef: resizeRef,
          moveRef: moveRef,
        }}
      >
        <div
          ref={divref}
          style={{
            position: "absolute",
            zIndex: pos.isMoving ? 2 : 1,
          }}
        >
          {children}
        </div>
      </WidgetContext.Provider>
    );
  }
);
