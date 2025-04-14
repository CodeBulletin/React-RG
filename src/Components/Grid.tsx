import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useMemo,
  useCallback,
  useImperativeHandle,
  createContext,
  useContext,
  forwardRef,
  Children,
  isValidElement,
  cloneElement,
} from "react";
import GridSlots from "./GridSlots";
import Placeholder from "./Placeholder";
import "./Grid.css";
import {
  WidgetProps,
  WidgetRef,
  GridContextType,
  GridProps,
  Rect,
  GridRef,
  GridState,
  Layout,
  RenderFunction,
} from "./types";
import { resolveCollisionAndCompact, sortLayout } from "./LayoutUtils";

const GridContext = createContext<GridContextType | null>(null);

export const useGridContext = () => {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error("useGridContext must be used within a GridProvider");
  }
  return context;
};

export function getCurrentLayout(
  refs: React.RefObject<Map<string | number, React.RefObject<WidgetRef | null>>>
): Layout[] {
  let layout: Layout[] = [];
  let widgets = refs.current;
  if (widgets) {
    widgets.forEach((widgetRef, key) => {
      let widget = widgetRef.current;
      if (!widget) return;
      let pos = widget.getPosition();
      let size = widget.getSize();
      let isStatic = widget.getStatic();
      layout.push({
        x: pos.x,
        y: pos.y,
        w: size.x,
        h: size.y,
        isStatic: isStatic,
        id: key,
      });
    });
  }
  return sortLayout(layout);
}

export const Grid = forwardRef((props: GridProps, ref: React.Ref<GridRef>) => {
  const gridref = useRef<HTMLDivElement>(null);
  const containeref = useRef<HTMLDivElement>(null);

  const widgetRefs = useRef<
    Map<number | string, React.RefObject<WidgetRef | null>>
  >(new Map());

  const [state, setState] = useState<GridState>({
    width: 0,
    rows: 0,
    rowsHeight: 0,
    top: 0,
    left: 0,
    scrollTop: 0,
    scrollLeft: 0,
  });
  const [changing, setChanging] = useState<number | string>(-1);
  const [rect, setRect] = useState<Rect>({
    pos: { x: 0, y: 0 },
    size: { x: 0, y: 0 },
  });
  const [render, setRender] = useState<boolean>(false);

  useImperativeHandle(
    ref,
    () => ({
      getLayout: () => {
        return getCurrentLayout(widgetRefs);
      },
    }),
    [widgetRefs]
  );

  useEffect(() => {
    widgetRefs.current.clear();
    Children.forEach(props.children, (child) => {
      if (
        isValidElement(child) &&
        (child.props as WidgetProps).id !== undefined
      ) {
        widgetRefs.current.set(
          (child.props as WidgetProps).id,
          React.createRef()
        );
      }
    });
  }, [props.children]);

  useEffect(() => {
    let layout = resolveCollisionAndCompact(props.layout, props.layout[0]);
    for (let i = 0; i < layout.length; i++) {
      let id = layout[i].id;
      let widget = widgetRefs?.current?.get(id)?.current;
      if (!widget) {
        continue;
      }
      widget.setState(props.layout[i]);
    }
  }, [widgetRefs.current, props.layout]);

  useLayoutEffect(() => {
    let rafId: number | null = null;
    const measure = () => {
      rafId = null;
      if (gridref.current && containeref.current) {
        const clientRect = gridref.current.getBoundingClientRect();
        const containerRect = containeref.current.getBoundingClientRect();
        const currentGap = props.gap ?? 10;
        const currentRows = props.rows ?? 12;
        const currentRowHeight =
          (containerRect.height -
            (props.padding ?? 0) * 2 -
            (currentRows - 1) * currentGap) /
          currentRows;
        const newRows = Math.max(
          currentRows,
          Math.floor(
            (containerRect.height + currentGap - 2 * (props.padding ?? 0)) / (currentRowHeight + currentGap)
          )
        );


        console.log(newRows);

        setState((prevState) => {
          if (
            prevState.width !== clientRect.width ||
            prevState.rows !== newRows ||
            prevState.top !== clientRect.top ||
            prevState.left !== clientRect.left ||
            prevState.rowsHeight !== currentRowHeight
          ) {
            return {
              ...prevState,
              rowsHeight: currentRowHeight,
              width: clientRect.width,
              rows: newRows,
              top: clientRect.top,
              left: clientRect.left,
            };
          }
          return prevState;
        });
      }
    };

    measure();

    const resizeObserver = new ResizeObserver(() => {
      if (rafId === null) {
        rafId = requestAnimationFrame(measure);
      }
    });

    const handleScroll = () => {
      if (containeref.current) {
        setState((prevState) => ({
          ...prevState,
          scrollTop: containeref.current?.scrollTop ?? 0,
          scrollLeft: containeref.current?.scrollLeft ?? 0,
        }));
      }
    };

    const currentGridRef = containeref.current;
    if (currentGridRef) {
      resizeObserver.observe(currentGridRef);
      currentGridRef.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (currentGridRef) {
        currentGridRef.removeEventListener("scroll", handleScroll);
        resizeObserver.unobserve(currentGridRef);
      }
      resizeObserver.disconnect();
    };
  }, [props.rows, props.gap]);

  const memoizedSetChanging = useCallback((value: number | string) => {
    setChanging(value);
  }, []);

  const memoizedSetRect = useCallback((newRect: Rect) => {
    setRect(newRect);
  }, []);

  const memoizedRender = useCallback((fn: RenderFunction) => {
    setRender(fn);
  }, []);

  useLayoutEffect(() => {
    if (changing != -1 && widgetRefs.current) {
      let layout = getCurrentLayout(widgetRefs);

      let originalItem = layout.find((l) => l.id === changing);
      if (!originalItem) return;

      originalItem.x = rect.pos.x;
      originalItem.y = rect.pos.y;
      originalItem.w = rect.size.x;
      originalItem.h = rect.size.y;

      layout = resolveCollisionAndCompact(layout, originalItem);

      layout.forEach((l) => {
        let widget = widgetRefs.current.get(l.id)?.current;
        if (!widget) return;
        widget.setPosition({
          x: l.x,
          y: l.y,
        });
      });

      setRect({
        pos: {
          x: originalItem.x,
          y: originalItem.y,
        },
        size: {
          x: originalItem.w,
          y: originalItem.h,
        },
      });
    }
  }, [changing, render]);

  const contextValue = useMemo<GridContextType>(() => {
    const { width, rows, rowsHeight, top, left, scrollTop, scrollLeft } = state;
    const numCols = props.cols ?? 12;
    const numGap = props.gap ?? 10;
    const currentGridWidth = width;
    const calcColWidth = (currentGridWidth - numGap * (numCols - 1)) / numCols;

    return {
      cols: numCols,
      colWidth: calcColWidth,
      rows: rows,
      rowHeight: rowsHeight,
      gap: numGap,
      width: currentGridWidth,
      top: top,
      left: left,
      scrollTop: scrollTop,
      scrollLeft: scrollLeft,
      changing: changing,
      setChanging: memoizedSetChanging,
      rect: rect,
      setRect: memoizedSetRect,
      setRender: memoizedRender,
    };
  }, [
    state,
    props.cols,
    props.gap,
    props.rows,
    changing,
    rect,
    memoizedSetChanging,
    memoizedSetRect,
  ]);

  const height = Math.max(
    ...getCurrentLayout(widgetRefs).map((i) => i.y + i.h)
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        flexBasis: 0,
        minHeight: 0,
        overflow: "auto",
        position: "relative",
        backgroundColor: "wheat",
        padding: props.padding ?? 0,
      }}
      ref={containeref}
    >
      <GridContext.Provider value={contextValue}>
        {contextValue && (
          <>
            <div
              className="react-grid-layout"
              style={{
                position: "relative",
                zIndex: 1,
                background: "#0000",
              }}
              ref={gridref}
            >
              {props.layout &&
                Children.map(props.children, (child) => {
                  let id = (child.props as WidgetProps).id;
                  let l = props.layout.find((l) => l.id === id);
                  if (isValidElement(child) && id !== undefined) {
                    const widgetRef = widgetRefs.current.get(id);
                    return cloneElement(child as React.ReactElement<any>, {
                      ref: widgetRef,
                      layout: l,
                    });
                  }
                  return child;
                })}
            </div>
            {props.showSlots && <GridSlots />}
            {props.showPlaceholder && <Placeholder />}
          </>
        )}
      </GridContext.Provider>
    </div>
  );
});

Grid.displayName = "Grid";

export default Grid;
