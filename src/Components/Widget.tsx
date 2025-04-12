import React, { forwardRef } from "react";
import { useGridContext } from "./Grid";
import { Vec2, WidgetProps, WidgetRef } from "./types";
import { createInitialState, widgetReducer } from "./WidgetReducer";

export const Widget = forwardRef(
  (props: WidgetProps, ref: React.Ref<WidgetRef>) => {
    const {
      children,
      id,
      x,
      y,
      w,
      h,
      minW,
      maxW,
      minH,
      maxH,
      isMovable = true,
      isResizable = true,
      static: isStatic,
    } = props;
    const gridContext = useGridContext();
    const divref = React.useRef<HTMLDivElement>(null);
    const latestMouseEventRef = React.useRef<{
      clientX: number;
      clientY: number;
    } | null>(null);
    const animationFrameRef = React.useRef<number | null>(null);

    const [state, dispatch] = React.useReducer(
      widgetReducer,
      props,
      createInitialState
    );

    // --- Event Handlers ---
    const handleMoveMouseDown = React.useCallback(
      (e: MouseEvent) => {
        if (!isMovable || !divref.current) return;
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
      [isMovable, gridContext, dispatch]
    );

    const handleResizeMouseDown = React.useCallback(
      (e: MouseEvent) => {
        if (!isResizable || !divref.current) return;
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
      [isResizable, gridContext, dispatch]
    );

    // --- Imperative Handle ---
    React.useImperativeHandle(
      ref,
      () => ({
        getPosition: () => state.gridPos,
        getSize: () => state.gridSize,
        setPosition: (newPos: Vec2) =>
          dispatch({
            type: "PROPS_UPDATE",
            payload: { x: newPos.x, y: newPos.y, w, h, minW, maxW, minH, maxH },
          }),
        getStatic: () => isStatic ?? false,
      }),
      [state.gridPos, state.gridSize, dispatch, isStatic]
    );

    // --- Effect for Prop Updates ---
    // React.useEffect(() => {
    //   dispatch({
    //     type: "PROPS_UPDATE",
    //     payload: { x, y, w, h, minW, maxW, minH, maxH },
    //   });
    // }, [x, y, w, h, minW, maxW, minH, maxH, dispatch]);

    // --- Global Listeners Effect ---
    React.useEffect(() => {
      if (state.status === "idle") return;

      // Function to be called within rAF
      const performUpdate = () => {
        if (!latestMouseEventRef.current) return; // Should not happen if scheduled

        const { clientX, clientY } = latestMouseEventRef.current;

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
              minW,
              maxW,
              minH,
              maxH,
            },
          });
        }

        // Reset the ref after processing the frame to allow scheduling the next one
        animationFrameRef.current = null;
      };

      const handleMouseMove = (e: MouseEvent) => {
        // Store the latest mouse event data
        latestMouseEventRef.current = {
          clientX: e.clientX,
          clientY: e.clientY,
        };

        // If no frame is scheduled, schedule one
        if (animationFrameRef.current === null) {
          animationFrameRef.current = requestAnimationFrame(performUpdate);
        }
        // If a frame is already scheduled, it will simply use the latest data
        // stored in latestMouseEventRef when it runs.
      };

      const handleMouseUp = (_: MouseEvent) => {
        // IMPORTANT: Cancel any pending animation frame
        // to prevent updates after mouse up.
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Dispatch the final END action
        if (state.status === "moving") {
          dispatch({ type: "MOVE_END" });
        } else if (state.status === "resizing") {
          dispatch({ type: "RESIZE_END" });
        }
        latestMouseEventRef.current = null; // Clear mouse data
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      // Cleanup function
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);

        // Cancel any pending frame when the effect cleans up
        // (e.g., component unmounts or status changes back to idle)
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        latestMouseEventRef.current = null; // Clear mouse data
      };
      // Ensure dependencies cover everything used in handlers & performUpdate
    }, [state.status, gridContext, dispatch, id, minW, maxW, minH, maxH]); // Keep existing dependencies

    // --- Attach Handle Listeners ---
    React.useEffect(() => {
      const draggable = divref.current?.querySelector(
        ".widget-draggable-handle"
      );
      const resizable = divref.current?.querySelector(
        ".widget-resizable-handle"
      );

      if (draggable && isMovable) {
        draggable.addEventListener(
          "mousedown",
          handleMoveMouseDown as EventListener
        );
      }
      if (resizable && isResizable) {
        resizable.addEventListener(
          "mousedown",
          handleResizeMouseDown as EventListener
        );
      }

      return () => {
        if (draggable && isMovable) {
          draggable.removeEventListener(
            "mousedown",
            handleMoveMouseDown as EventListener
          );
        }
        if (resizable && isResizable) {
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
      isMovable,
      isResizable,
    ]);

    const classNames = [
      props.className ?? "",
      "widget",
      isStatic ? "widget-static" : "",
      isResizable ? "widget-resizable" : "",
      isMovable ? "widget-movable" : "",
      state.status === "moving" ? "widget-moving" : "",
      state.status === "resizing" ? "widget-resizing" : "",
    ]
      .filter(Boolean)
      .join(" ");

    // --- Notify Context Effect ---
    React.useEffect(() => {
      if (state.interactionJustEnded) {
        console.log(`Widget ${id} notifying context: STOP ${state.status}`);
        gridContext.setChanging(-1);
        dispatch({ type: "INTERACTION_END" });
      } else {
        if (state.status === "moving" && state.potentialGridPos) {
          let prev = state.prevValue ?? state.gridPos;
          if (state.potentialGridPos.x == prev.x && state.potentialGridPos.y == prev.y)
            return
          console.log(`Widget ${id} notifying context: DOING ${state.status}`);
          gridContext.setChanged(id);
          gridContext.setRect({
            pos: state.potentialGridPos,
            size: state.gridSize,
          });
        } else if (state.status === "resizing" && state.potentialGridSize) {
          let prev = state.prevValue ?? state.gridSize;
          if (state.potentialGridSize.x == prev.x && state.potentialGridSize.y == prev.y)
            return
          console.log(`Widget ${id} notifying context: DOING ${state.status}`);
          gridContext.setChanged(id);
          gridContext.setRect({
            pos: state.gridPos,
            size: state.potentialGridSize,
          });
        } else if (state.status === "moving" || state.status === "resizing") {
          console.log(`Widget ${id} notifying context: START ${state.status}`);
          gridContext.setChanging(id);
          gridContext.setRect({ pos: state.gridPos, size: state.gridSize });
        }
      }
    }, [
      state.status,
      state.gridPos,
      state.gridSize,
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
        style.zIndex = "1";
      } else {
        style.position = "relative";
        style.top = "auto";
        style.left = "auto";
        style.width = "auto";
        style.height = "auto";
        style.gridArea = `${state.gridPos.y + 1} / ${
          state.gridPos.x + 1
        } / span ${state.gridSize.y} / span ${state.gridSize.x}`;
        style.zIndex = "0";
      }
    }, [
      state.status,
      state.gridPos,
      state.gridSize,
      state.interactionPixelPos,
      state.interactionPixelSize,
    ]);

    return (
      <div
        ref={divref}
        style={props.style} // Pass user styles, but position/size/grid is controlled by effect
        className={classNames}
      >
        {children}
      </div>
    );
  }
);

Widget.displayName = "Widget";
export default Widget;
