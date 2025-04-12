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
} from "./types";

const GridContext = createContext<GridContextType | null>(null);

export const useGridContext = () => {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error("useGridContext must be used within a GridProvider");
  }
  return context;
};

export const Grid = forwardRef((props: GridProps, ref: React.Ref<GridRef>) => {
  const gridref = useRef<HTMLDivElement>(null);

  const widgetRefs = useRef<
    Map<number | string, React.RefObject<WidgetRef | null>>
  >(new Map());
  
  const [state, setState] = useState<GridState>({
    width: 0,
    rows: 0,
    top: 0,
    left: 0,
    scrollTop: 0,
    scrollLeft: 0,
  });
  const [changed, setChanged] = useState<number | string>(-1);
  const [changing, setChanging] = useState<number | string>(-1);
  const [rect, setRect] = useState<Rect>({
    pos: { x: 0, y: 0 },
    size: { x: 0, y: 0 },
  });

  useImperativeHandle(
    ref,
    () => ({
      getLayout: () => {
        return []
      },
    }),
    [widgetRefs]
  );

  useEffect(() => {
    widgetRefs.current.clear();
    Children.forEach(props.children, (child) => {
      if (isValidElement(child) && (child.props as WidgetProps).id !== undefined) {
         widgetRefs.current.set((child.props as WidgetProps).id, React.createRef());
      }
    });
  }, [props.children]);

  useLayoutEffect(() => {
    let rafId: number | null = null;
    const measure = () => {
      rafId = null;
      if (gridref.current) {
        const clientRect = gridref.current.getBoundingClientRect();
        const currentGap = props.gap ?? 10;
        const currentRowHeight = props.rowHeight ?? 100;
        const newRows = Math.max(1,
          Math.floor(
            (clientRect.height + currentGap) / (currentRowHeight + currentGap)
          )
        );

        setState((prevState) => {
          if (
            prevState.width !== clientRect.width ||
            prevState.rows !== newRows ||
            prevState.top !== clientRect.top ||
            prevState.left !== clientRect.left
          ) {
            return {
              ...prevState,
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
      if (gridref.current) {
        setState((prevState) => ({
          ...prevState,
          scrollTop: gridref.current?.scrollTop ?? 0,
          scrollLeft: gridref.current?.scrollLeft ?? 0,
        }));
      }
    };

    const currentGridRef = gridref.current;
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
  }, [props.rowHeight, props.gap]);

  useLayoutEffect(() => {
    if (changed !== -1) {
      
      setChanged(_ => -1)
    }
  }, [changed]);

  const memoizedSetChanged = useCallback((value: number | string) => {
      setChanged(value);
  }, []);

  const memoizedSetChanging = useCallback((value: number | string) => {
      setChanging(value);
  }, []);

  const memoizedSetRect = useCallback((newRect: Rect) => {
      setRect(newRect);
  }, []);

  const contextValue = useMemo<GridContextType>(() => {
    const { width, rows, top, left, scrollTop, scrollLeft } = state;
    const numCols = props.cols ?? 12;
    const numGap = props.gap ?? 10; 
    const currentGridWidth = width;
    const calcColWidth = numCols > 0
        ? (currentGridWidth - numGap * (numCols - 1)) / numCols
        : 0;

    return {
      cols: numCols,
      colWidth: calcColWidth,
      rows: rows,
      rowHeight: props.rowHeight ?? 100, 
      gap: numGap,
      width: currentGridWidth,
      top: top,
      left: left,
      scrollTop: scrollTop,
      scrollLeft: scrollLeft,
      changed: changed,
      setChanged: memoizedSetChanged, 
      changing: changing,
      setChanging: memoizedSetChanging,
      rect: rect,
      setRect: memoizedSetRect, 
    };
  }, [
    state, 
    props.cols, props.gap, props.rowHeight, 
    changed, changing, rect, 
    memoizedSetChanged, memoizedSetChanging, memoizedSetRect 
  ]);

  // --- Render ---
  const numCols = props.cols ?? 12;
  const numGap = props.gap ?? 10;
  const numRowHeight = props.rowHeight ?? 100;

  return (
    <div
      style={{
        width: "100%",
        position: "relative",
      }}
    >
      <GridContext.Provider value={contextValue}>
        <div
          className="react-grid-layout"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${numCols}, 1fr)`, 
            gap: `${numGap}px`,
            gridAutoRows: `${numRowHeight}px`,
            gridAutoFlow: "row dense",
            width: "100%",
            position: 'relative',
            zIndex: 1
          }}
          ref={gridref}
        >
          {contextValue && Children.map(props.children, (child) => {
            if (isValidElement(child) && (child.props as WidgetProps).id !== undefined) {
              const widgetRef = widgetRefs.current.get((child.props as WidgetProps).id);
              return cloneElement(child as React.ReactElement<any>, {
                ref: widgetRef,
              });
            }
            return child;
          })}
        </div>
        {props.showSlots && <GridSlots />}
        {props.showPlaceholder && <Placeholder />}
      </GridContext.Provider>
    </div>
  );
});

Grid.displayName = "Grid";

export default Grid;