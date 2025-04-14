import React, { forwardRef, useMemo } from "react";
import { useGridContext } from "./Grid";
import { ExtendedLayout, Vec2, WidgetProps, WidgetRef } from "./types";
import { createInitialState, widgetReducer } from "./WidgetReducer";

export const Widget = forwardRef(
  (props: WidgetProps, ref: React.Ref<WidgetRef>) => {
    const { children, id, className, style } = props;
    const gridContext = useGridContext();
    const divref = React.useRef<HTMLDivElement>(null);
    const latestMouseEventRef = React.useRef<{
      clientX: number;
      clientY: number;
    } | null>(null);
    const animationFrameRef = React.useRef<number | null>(null);

    const [state, dispatch] = React.useReducer(
      widgetReducer,
      createInitialState()
    );

    // --- Event Handlers ---
    const handleMoveMouseDown = React.useCallback(
      (e: MouseEvent) => {
        if (!state.isDraggable || !divref.current) return;
        e.preventDefault();
        e.stopPropagation();
        const elementRect = divref.current.getBoundingClientRect();
        dispatch({
          type: "MOVE_START",
          payload: {
            clientX: e.clientX,
            clientY: e.clientY,
            elementRect,
            gridContext,
          },
        });
      },
      [state.isDraggable, gridContext, dispatch]
    );

    const handleResizeMouseDown = React.useCallback(
      (e: MouseEvent) => {
        if (!state.isResizeable || !divref.current) return;
        e.preventDefault();
        e.stopPropagation();
        const elementRect = divref.current.getBoundingClientRect();
        dispatch({
          type: "RESIZE_START",
          payload: {
            clientX: e.clientX,
            clientY: e.clientY,
            elementRect,
            gridContext,
          },
        });
      },
      [state.isResizeable, gridContext, dispatch]
    );

    // --- Imperative Handle ---
    React.useImperativeHandle<WidgetRef, WidgetRef>(
      ref,
      () => ({
        getPosition: () => state.gridPos,
        getSize: () => state.gridSize,
        setPosition: (newPos: Vec2) =>
          dispatch({
            type: "SET_POSITION",
            payload: { x: newPos.x, y: newPos.y },
          }),
        setState: (layout: ExtendedLayout) =>
          dispatch({
            type: "SET_STATE",
            payload: layout,
          }),
        getStatic: () => state.isStatic,
      }),
      [
        state.gridPos,
        state.gridSize,
        dispatch,
        state.isStatic,
        gridContext.rect,
      ]
    );

    React.useEffect(() => {
      if (props.layout)
        dispatch({
          type: "SET_STATE",
          payload: props.layout,
        });
    }, [props.layout]);

    // --- Global Listeners Effect ---
    React.useEffect(() => {
      // Only run when moving or resizing
      if (state.status !== "moving" && state.status !== "resizing") return;

      const container = gridContext.conatinerRef.current;
      if (!container) return; // Early exit if container ref is not available

      // --- AutoScroll Configuration ---
      const scrollThreshold = 50; // Pixels from edge to trigger scroll
      const scrollStep = 15; // Pixels to scroll per frame (adjust for desired speed)
      // ---

      const performUpdate = () => {
        if (!latestMouseEventRef.current) {
          animationFrameRef.current = null; // Ensure cleanup if mouse ref becomes null
          return;
        }

        const { clientX, clientY } = latestMouseEventRef.current;

        // --- Auto-scroll Logic (only when moving) ---
        if (state.status === "moving" && container) {
          const containerRect = container.getBoundingClientRect();
          // Mouse Y position relative to the container's visible viewport
          const mouseYRelativeToContainer = clientY - containerRect.top;

          let needsScroll = false;
          if (mouseYRelativeToContainer < scrollThreshold) {
            // Scroll Up
            const newScrollTop = Math.max(0, container.scrollTop - scrollStep);
            if (container.scrollTop !== newScrollTop) {
              container.scrollTop = newScrollTop;
              needsScroll = true;
            }
          } else if (
            mouseYRelativeToContainer >
            containerRect.height - scrollThreshold
          ) {
            // Scroll Down
            const maxScrollTop =
              container.scrollHeight - container.clientHeight;
            const newScrollTop = Math.min(
              maxScrollTop,
              container.scrollTop + scrollStep
            );
            if (container.scrollTop !== newScrollTop) {
              container.scrollTop = newScrollTop;
              needsScroll = true;
            }
          }
          // If scrolling happened, update gridContext's scrollTop state
          // This is important if other parts of your app rely on the context's scrollTop value
          // Note: This might cause extra re-renders if not handled carefully.
          // Consider if this is strictly necessary for your grid calculations.
          // if (needsScroll) {
          //    gridContext.setScrollTop(container.scrollTop); // Assuming you have a setScrollTop method in context
          // }
        }
        // --- End Auto-scroll Logic ---

        // Dispatch move or resize action
        if (state.status === "moving") {
          dispatch({
            type: "MOVE",
            payload: { clientX, clientY, gridContext },
          });
        } else if (state.status === "resizing") {
          dispatch({
            type: "RESIZE",
            payload: {
              clientX,
              clientY,
              gridContext,
            },
          });
        }

        // Nullify ref to allow the next mousemove to request a new frame
        animationFrameRef.current = null;
      };

      const handleMouseMove = (e: MouseEvent) => {
        // Prevent default text selection behavior during drag
        e.preventDefault();

        latestMouseEventRef.current = {
          clientX: e.clientX,
          clientY: e.clientY,
        };

        // Request animation frame *only* if one isn't already pending
        if (animationFrameRef.current === null) {
          animationFrameRef.current = requestAnimationFrame(performUpdate);
        }
      };

      const handleMouseUp = (e: MouseEvent) => {
        if (e.button !== 0) return; // Only react to main button mouseup

        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        if (state.status === "moving") {
          dispatch({ type: "MOVE_END" });
        } else if (state.status === "resizing") {
          dispatch({ type: "RESIZE_END" });
        }
        latestMouseEventRef.current = null; // Clear mouse position ref
      };

      // Add listeners
      window.addEventListener("mousemove", handleMouseMove, { passive: false }); // passive: false needed for preventDefault
      window.addEventListener("mouseup", handleMouseUp);

      // Cleanup function
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        latestMouseEventRef.current = null; // Clear mouse ref on cleanup
      };
    }, [state.status, gridContext, dispatch, id]); // Dependencies are crucial here

    // --- Attach Handle Listeners ---
    React.useEffect(() => {
      const draggable = divref.current?.querySelector(
        ".widget-draggable-handle"
      );
      const resizable = divref.current?.querySelector(
        ".widget-resizable-handle"
      );

      if (draggable && state.isDraggable) {
        draggable.addEventListener(
          "mousedown",
          handleMoveMouseDown as EventListener
        );
      }
      if (resizable && state.isResizeable) {
        resizable.addEventListener(
          "mousedown",
          handleResizeMouseDown as EventListener
        );
      }

      return () => {
        if (draggable && state.isDraggable) {
          draggable.removeEventListener(
            "mousedown",
            handleMoveMouseDown as EventListener
          );
        }
        if (resizable && state.isResizeable) {
          resizable.removeEventListener(
            "mousedown",
            handleResizeMouseDown as EventListener
          );
        }
      };
    }, [
      children,
      handleMoveMouseDown,
      handleResizeMouseDown,
      state.isDraggable,
      state.isResizeable,
    ]);

    const classNames = useMemo(
      () =>
        [
          className ?? "",
          "widget",
          state.isStatic ? "widget-static" : "",
          state.isResizeable ? "widget-resizable" : "",
          state.isDraggable ? "widget-draggable" : "",
          state.status === "moving" ? "widget-moving" : "",
          state.status === "resizing" ? "widget-resizing" : "",
        ]
          .filter(Boolean)
          .join(" "),
      [state.isStatic, state.isResizeable, state.isDraggable, state.status]
    );

    // --- Notify Context Effect ---
    React.useEffect(() => {
      if (state.interactionJustEnded) {
        gridContext.setChanging(-1);
        dispatch({ type: "INTERACTION_END" });
      } else {
        if (state.status === "moving" && state.potentialGridPos) {
          let prev = state.prevValue ?? state.gridPos;
          if (
            state.potentialGridPos.x == prev.x &&
            state.potentialGridPos.y == prev.y
          )
            return;
          gridContext.setRender((prev) => !prev);
          gridContext.setRect({
            pos: state.potentialGridPos,
            size: state.gridSize,
          });
        } else if (state.status === "resizing" && state.potentialGridSize) {
          let prev = state.prevValue ?? state.gridSize;
          if (
            state.potentialGridSize.x == prev.x &&
            state.potentialGridSize.y == prev.y
          )
            return;
          gridContext.setRender((prev) => !prev);
          gridContext.setRect({
            pos: state.gridPos,
            size: state.potentialGridSize,
          });
        } else if (state.status === "moving" || state.status === "resizing") {
          gridContext.setChanging(id);
          gridContext.setRect({ pos: state.gridPos, size: state.gridSize });
        }
      }
    }, [
      state.status,
      state.potentialGridPos,
      state.potentialGridSize,
      state.interactionJustEnded,
    ]);

    // --- Style Application Effect ---
    React.useLayoutEffect(() => {
      if (!divref.current) return;

      const style = divref.current.style;
      if (state.status === "moving" || state.status === "resizing") {
        style.position = "absolute";
        style.top = `${state.interactionPixelPos?.y ?? 0}px`;
        style.left = `${state.interactionPixelPos?.x ?? 0}px`;
        style.width = `${state.interactionPixelSize?.x ?? 0}px`;
        style.height = `${state.interactionPixelSize?.y ?? 0}px`;
        style.gridArea = "";
        style.transition = "";
        style.zIndex = "1";
      } else {
        style.position = "absolute";
        style.top = `${
          state.gridPos.y * (gridContext.rowHeight + gridContext.gap)
        }px`;
        style.left = `${
          state.gridPos.x * (gridContext.colWidth + gridContext.gap)
        }px`;
        style.height = `${
          state.gridSize.y * gridContext.rowHeight +
          (state.gridSize.y - 1) * gridContext.gap
        }px`;
        style.width = `${
          state.gridSize.x * gridContext.colWidth +
          (state.gridSize.x - 1) * gridContext.gap
        }px`;
        style.transition = "all 200ms ease";
        style.zIndex = "0";
      }
    }, [
      state.status,
      state.gridPos,
      state.gridSize,
      state.interactionPixelPos,
      state.interactionPixelSize,
      gridContext.colWidth,
      gridContext.rowHeight,
    ]);

    return (
      <div ref={divref} style={style} className={classNames}>
        {children}
      </div>
    );
  }
);

Widget.displayName = "Widget";
export default Widget;
