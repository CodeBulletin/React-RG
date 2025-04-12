import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useMemo, // Import useMemo
  useCallback, // Import useCallback
  useImperativeHandle, // Import useImperativeHandle
  createContext, // Import createContext
  useContext, // Import useContext
  forwardRef, // Import forwardRef
  Children, // Import Children
  isValidElement, // Import isValidElement
  cloneElement, // Import cloneElement
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
} from "./types"; // Ensure all types are imported
import { sortLayout } from "./LayoutUtils";

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
  const [currentLayout, setCurrentLayout] = useState<Layout[]>([]);

  // --- Imperative Handle ---
  useImperativeHandle(
    ref,
    () => ({
      getLayout: () => {
        return currentLayout
      },
    }),
    [widgetRefs]
  );

  // --- Widget Refs Management ---
  useEffect(() => {
    const initialLayout: Layout[] = [];
    Children.forEach(props.children, (child) => {
      if (isValidElement(child)) {
        const childProps = child.props as WidgetProps;
        if (childProps.id !== undefined) {
          initialLayout.push({
            id: childProps.id,
            x: childProps.x,
            y: childProps.y,
            w: childProps.w,
            h: childProps.h,
            isStatic: childProps.static ?? false
          });
        }
      }
    });
    // Sort initially to ensure consistent order for algorithms
    setCurrentLayout(sortLayout(initialLayout));
    
    widgetRefs.current.clear();
    Children.forEach(props.children, (child) => {
      if (isValidElement(child) && (child.props as WidgetProps).id !== undefined) {
         // Ensure you create a new ref object for each child
         widgetRefs.current.set((child.props as WidgetProps).id, React.createRef());
      }
    });
  }, [props.children]);

  // --- Layout Measurement Effect ---
  useLayoutEffect(() => {
    let rafId: number | null = null;
    const measure = () => {
      rafId = null; // Reset rafId first
      if (gridref.current) {
        const clientRect = gridref.current.getBoundingClientRect();
        // Use default values directly in calculation
        const currentGap = props.gap ?? 10;
        const currentRowHeight = props.rowHeight ?? 100;
        const newRows = Math.max(1, // Ensure at least 1 row
          Math.floor(
            (clientRect.height + currentGap) / (currentRowHeight + currentGap)
          )
        );

        setState((prevState) => {
          // Check against previous values before updating
          if (
            prevState.width !== clientRect.width ||
            prevState.rows !== newRows ||
            prevState.top !== clientRect.top ||
            prevState.left !== clientRect.left
          ) {
            return {
              ...prevState, // Keep existing scroll state
              width: clientRect.width,
              rows: newRows,
              top: clientRect.top,
              left: clientRect.left,
            };
          }
          return prevState; // No change needed
        });
      }
    };

    // Initial measure
    measure(); // Call measure directly initially

    const resizeObserver = new ResizeObserver(() => {
      // Throttle with rAF
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

    // Cleanup
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (currentGridRef) {
        currentGridRef.removeEventListener("scroll", handleScroll);
        // It's safer to unobserve before disconnecting
        resizeObserver.unobserve(currentGridRef);
      }
      resizeObserver.disconnect();
    };
    // Dependencies include props that affect measurement/row calculation
  }, [props.rowHeight, props.gap]); // Removed gridref, cols (cols don't affect height measurement)

  // --- REMOVED Unnecessary/Incorrect Effect ---
  // useEffect(() => {
  //   setChanged(-1);
  // }, [changed]);


  // --- Context Value Optimization ---

  // Memoize setter functions passed to context
  const memoizedSetChanged = useCallback((value: number | string) => {
      setChanged(value);
  }, []);

  const memoizedSetChanging = useCallback((value: number | string) => {
      setChanging(value);
  }, []);

  const memoizedSetRect = useCallback((newRect: Rect) => {
      setRect(newRect);
  }, []);


  // Memoize the entire context value object
  const contextValue = useMemo<GridContextType>(() => {
    const { width, rows, top, left, scrollTop, scrollLeft } = state;
    const numCols = props.cols ?? 12; // Use default value
    const numGap = props.gap ?? 10; // Use default value
    const currentGridWidth = width; // Use measured width

    // Calculate colWidth, handle division by zero
    const calcColWidth = numCols > 0
        ? (currentGridWidth - numGap * (numCols - 1)) / numCols
        : 0;

    return {
      cols: numCols,
      colWidth: calcColWidth,
      rows: rows,
      rowHeight: props.rowHeight ?? 100, // Use default value
      gap: numGap,
      width: currentGridWidth, // Measured width
      top: top,
      left: left,
      scrollTop: scrollTop,
      scrollLeft: scrollLeft,
      changed: changed,
      setChanged: memoizedSetChanged, // Pass stable function reference
      changing: changing,
      setChanging: memoizedSetChanging, // Pass stable function reference
      rect: rect,
      setRect: memoizedSetRect, // Pass stable function reference
    };
  }, [
    state, // Depends on the entire state object
    props.cols, props.gap, props.rowHeight, // Relevant props from props object
    changed, changing, rect, // Other state values
    memoizedSetChanged, memoizedSetChanging, memoizedSetRect // Include stable callbacks
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
          {/* Map over children and clone to pass ref */}
          {contextValue && Children.map(props.children, (child) => {
            if (isValidElement(child) && (child.props as WidgetProps).id !== undefined) {
              // Get the corresponding ref from the map
              const widgetRef = widgetRefs.current.get((child.props as WidgetProps).id);
              return cloneElement(child as React.ReactElement<any>, {
                // Pass the specific ref object to the child
                ref: widgetRef,
              });
            }
            return child; // Return non-widget children as is
          })}
        </div>
        {/* Conditional rendering of helpers */}
        {props.showSlots && <GridSlots />}
        {props.showPlaceholder && <Placeholder />}
      </GridContext.Provider>
    </div>
  );
});

Grid.displayName = "Grid";

export default Grid;