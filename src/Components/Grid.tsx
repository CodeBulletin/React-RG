import React, {
  forwardRef,
  ReactElement,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import GridSlots from "./GridSlots";
import { vec2, WidgetProps, WidgetRef } from "./Widget";
import Placeholder from "./Placeholder";

export type GridProps = {
  children: React.ReactElement[];
  cols?: number;
  rowHeight?: number;
  gap?: number;
  showSlots?: boolean;
};

export type rect = {
  pos: vec2;
  size: vec2;
};

export type GridContext = {
  cols: number;
  rows: number;
  rowHeight: number;
  gap: number;
  top: number;
  left: number;
  width: number;
  changed: number;
  setChanged: React.Dispatch<React.SetStateAction<number>>;
  changing: number;
  setChanging: React.Dispatch<React.SetStateAction<number>>;
  rect: rect;
  setRect: React.Dispatch<React.SetStateAction<rect>>;
};

const GridContext = React.createContext<GridContext | null>(null);

export const useGridContext = () => {
  const context = React.useContext(GridContext);
  if (!context) {
    throw new Error("useGridContext must be used within a GridProvider");
  }
  return context;
};

export type GridState = {
  width: number;
  rows: number;
  top: number;
  left: number;
};

export type Layout = {
  w: number;
  h: number;
  x: number;
  y: number;
  id: number;
};

export type GridRef = {
  getLayout: () => Layout[];
};

export const Grid = forwardRef((props: GridProps, ref: React.Ref<GridRef>) => {
  const gridref = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<GridState>({
    width: 0,
    rows: 0,
    top: 0,
    left: 0,
  });
  const [changed, setChanged] = React.useState(-1);
  const [changing, setChanging] = React.useState(-1);
  const [rect, setRect] = useState<rect>({
    pos: { x: 0, y: 0 },
    size: { x: 0, y: 0 },
  });

  const widgetRefs = React.useRef<
    Map<number, React.RefObject<WidgetRef | null>>
  >(new Map());

  useImperativeHandle(
    ref,
    () => ({
      getLayout: () => {
        let layouts: Layout[] = [];
        for (const [id, ref] of widgetRefs.current) {
          let pos = ref?.current?.getPosition();
          let size = ref?.current?.getSize();

          let layout: Layout = {
            w: size?.x ?? 0,
            h: size?.y ?? 0,
            x: pos?.x ?? 0,
            y: pos?.y ?? 0,
            id: id,
          };

          layouts.push(layout);
        }

        return layouts;
      },
    }),
    [widgetRefs.current, props.children]
  );

  React.useEffect(() => {
    widgetRefs.current.clear();
    console.log("Why Here?");
    for (let i = 0; i < props.children.length; i++) {
      let child = props.children[i].props as WidgetProps;
      widgetRefs.current.set(child.id, React.createRef());
    }
  }, [props.children]);

  React.useLayoutEffect(() => {
    if (gridref.current) {
      const rect = gridref.current?.getBoundingClientRect();
      setState({
        width: rect.width,
        rows: Math.floor(
          rect.height / ((props.rowHeight || 100) + (props.gap || 10)) + 1
        ),
        top: rect.top,
        left: rect.left,
      });
    }
  }, [gridref, changing]);

  React.useEffect(() => {
    setChanged(-1);
  }, [changed]);

  return (
    <div
      style={{
        width: "100%",
        position: "relative",
      }}
    >
      <GridContext.Provider
        value={{
          cols: props.cols || 12,
          rows: state.rows,
          rowHeight: props.rowHeight || 100,
          gap: props.gap || 10,
          width: state.width,
          top: state.top,
          left: state.left,
          changed: changed,
          setChanged: (value) => {
            setChanged(value);
          },
          changing: changing,
          setChanging: (value) => {
            setChanging(value);
          },
          rect: rect,
          setRect: (rect) => {
            setRect(rect);
          },
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${props.cols || 12}, 1fr)`,
            gap: `${props.gap || 10}px`,
            gridAutoRows: `${props.rowHeight || 100}px`,
            gridAutoFlow: "row",
            width: "100%",
            zIndex: 1,
          }}
          ref={gridref}
        >
          {React.Children.map(props.children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as ReactElement<any>, {
                ref: widgetRefs.current.get((child.props as WidgetProps).id),
              });
            }
          })}
          <Placeholder />
        </div>
        {props.showSlots && <GridSlots />}
      </GridContext.Provider>
    </div>
  );
});

export default Grid;
