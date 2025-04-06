import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
} from "react";
import { useGridContext } from "./Grid";

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

  className?: string;
  style?: React.CSSProperties;
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

    // if props change then update the state
    useLayoutEffect(() => {
      setPos((prev) => ({
        ...prev,
        pos: {
          x: props.x,
          y: props.y,
        },
      }));
      setSize((prev) => ({
        ...prev,
        size: {
          x: Math.min(
            Math.max(props.w, props.minW ?? 1),
            props.maxW ?? Infinity
          ),
          y: Math.min(
            Math.max(props.h, props.minH ?? 1),
            props.maxH ?? Infinity
          ),
        },
      }));
    }, [props.x, props.y, props.w, props.h]);

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
        x: e.clientX,
        y: e.clientY,
      });
    };

    const handleMovingDown = (e: any) => {
      if (props.isMovable === false) return;
      if (!divref.current) return;
      setMovHandelDrag(null);
      setMovHandelDown((_) => ({
        x: e.clientX,
        y: e.clientY,
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

      let rect = divref.current?.getBoundingClientRect();

      setOffset((_) => ({
        x: movHandelDown.x - (rect?.left ?? 0),
        y: movHandelDown.y - (rect?.top ?? 0),
      }));

      setActualSize({
        x: rect?.width ?? 0,
        y: rect?.height ?? 0,
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
      let x: number = movHandelDrag.x - gridContext.left - offset.x;
      let y: number = movHandelDrag.y - gridContext.top - offset.y;

      setActualPos((_) => ({
        x: Math.max(Math.min(x, gridContext.width - (rect?.width ?? 0)), 0),
        y: Math.max(y, 0),
      }));

      let newX = Math.max(
        Math.min(
          Math.floor(
            (x + gridContext.gap / 2) / (gridContext.colWidth + gridContext.gap)
          ),
          gridContext.cols - size.size.x
        ),
        0
      );
      let newY = Math.max(
        Math.floor(
          (y + gridContext.gap / 2) / (gridContext.rowHeight + gridContext.gap)
        ),
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

    const handleResizingDown = (e: any) => {
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

      let rect = divref.current?.getBoundingClientRect();
      let left = rect?.left ?? 0;
      let top = rect?.top ?? 0;

      setOffset((_) => ({
        x: (rect?.left ?? 0) + (rect?.width ?? 0) - resizeHandelDown.x,
        y: (rect?.top ?? 0) + (rect?.height ?? 0) - resizeHandelDown.y,
      }));

      setActualSize((_) => ({
        x: rect?.width ?? 0,
        y: rect?.height ?? 0,
      }));

      setActualPos((_) => ({
        x: pos.pos.x * (gridContext.colWidth + gridContext.gap),
        y: pos.pos.y * (gridContext.rowHeight + gridContext.gap),
      }));

      setResizeHandelDown((_) => null);
      gridContext.setChanging((_) => props.id);
    }, [resizeHandelDown]);

    useLayoutEffect(() => {
      if (!resizeHandelDrag) return;

      let x: number = resizeHandelDrag.x + offset.x;
      let y: number = resizeHandelDrag.y + offset.y;

      let rect = divref.current?.getBoundingClientRect();

      let left = rect?.left ?? 0;
      let top = rect?.top ?? 0;

      let ax = Math.max(
        Math.min(x - left, gridContext.width),
        (props.minW ?? 1) * gridContext.colWidth +
          ((props.minW ?? 1) - 1) * gridContext.gap
      );
      let ay = Math.max(
        y - top,
        (props.minH ?? 1) * gridContext.rowHeight +
          ((props.minH ?? 1) - 1) * gridContext.gap
      );

      if (
        props.maxW &&
        ax >
          props.maxW * gridContext.colWidth + (props.maxW - 1) * gridContext.gap
      ) {
        ax =
          props.maxW * gridContext.colWidth +
          (props.maxW - 1) * gridContext.gap;
      }

      if (ax + left > gridContext.width) {
        ax = gridContext.width - left + gridContext.left;
      }

      if (
        props.maxH &&
        ay >
          props.maxH * gridContext.rowHeight +
            (props.maxH - 1) * gridContext.gap
      ) {
        ay =
          props.maxH * gridContext.rowHeight +
          (props.maxH - 1) * gridContext.gap;
      }

      setActualSize((_) => ({
        x: ax,
        y: ay,
      }));

      //  To Fix
      let newW = Math.max(
        Math.min(
          Math.ceil(
            (x - left + gridContext.gap / 2) /
              (gridContext.colWidth + gridContext.gap)
          ),
          gridContext.cols - pos.pos.x
        ),
        props.minW ?? 1
      );

      let newH = Math.max(
        Math.ceil(
          (y - top + gridContext.gap / 2) /
            (gridContext.rowHeight + gridContext.gap)
        ),
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
          divref.current.style.position = "absolute";
          divref.current.style.width = `${actualSize.x}px`;
          divref.current.style.height = `${actualSize.y}px`;
          divref.current.style.top = `${actualPos.y}px`;
          divref.current.style.left = `${actualPos.x}px`;
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
      const child = divref.current?.querySelector(".widget-draggable-handle");
      if (child) {
        child.addEventListener("mousedown", handleMovingDown);
      }

      const resizeChild = divref.current?.querySelector(
        ".widget-resizable-handle"
      );

      if (resizeChild) {
        resizeChild.addEventListener("mousedown", handleResizingDown);
      }

      return () => {
        if (child) {
          (child as HTMLElement).removeEventListener(
            "mousedown",
            handleMovingDown
          );
        }
        if (resizeChild) {
          (resizeChild as HTMLElement).removeEventListener(
            "mousedown",
            handleResizingDown
          );
        }
      };
    }, [children]);

    return (
      <div
        ref={divref}
        style={{
          ...props.style,
          position: "absolute",
        }}
        className={`
          ${props.className ?? ""}
          widget 
          ${props.static ? "widget-static" : ""}
          ${props.isResizable ? "widget-resizable" : ""}
          ${props.isMovable ? "widget-movable" : ""}
          ${pos.isMoving ? "widget-moving" : ""}
          ${size.isResizing ? "widget-resizing" : ""}
        `}
      >
        {children}
      </div>
    );
  }
);
