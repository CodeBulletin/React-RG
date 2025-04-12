import {
  Vec2,
  WidgetAction,
  WidgetProps,
  WidgetState,
} from "./types";

export const clampSize = (w: number, h: number, props: WidgetProps): Vec2 => {
  const minW = props.minW ?? 1;
  const maxW = props.maxW ?? Infinity;
  const minH = props.minH ?? 1;
  const maxH = props.maxH ?? Infinity;
  return {
    x: Math.min(Math.max(w, minW), maxW),
    y: Math.min(Math.max(h, minH), maxH),
  };
};

export const createInitialState = (props: WidgetProps): WidgetState => ({
  gridPos: { x: props.x, y: props.y },
  gridSize: clampSize(props.w, props.h, props),
  status: "idle",
  interactionPixelPos: null,
  interactionPixelSize: null,
  dragStartOffset: null,
  potentialGridPos: null,
  potentialGridSize: null,
  interactionJustEnded: false, 
  changeOccurred: false, 
});

export const widgetReducer = (
  state: WidgetState,
  action: WidgetAction
): WidgetState => {
  switch (action.type) {
    case "PROPS_UPDATE": {      // Only update from props if not currently interacting
      if (state.status !== "idle") return state;
      const { x, y, w, h, ...sizeProps } = action.payload;
      const clampedSize = clampSize(w, h, sizeProps as WidgetProps);
      // Only update if props actually changed grid position/size
      if (
        state.gridPos.x === x &&
        state.gridPos.y === y &&
        state.gridSize.x === clampedSize.x &&
        state.gridSize.y === clampedSize.y
      ) {
        return state;
      }
      return {
        ...state,
        gridPos: { x, y },
        gridSize: clampedSize,
      };
    }

    case "SET_POSITION": {
      if (state.status !== "idle") return state; // Prevent update during interaction
      return {
        ...state,
        gridPos: action.payload,
      };
    }

    case "MOVE_START": {
      const { clientX, clientY, elementRect, gridContext } = action.payload;
      return {
        ...state,
        status: "moving",
        dragStartOffset: {
          x: clientX - elementRect.left,
          y: clientY - elementRect.top,
        },
        // Store initial pixel position/size for smooth absolute positioning
        interactionPixelPos: {
          x: elementRect.left - gridContext.left + gridContext.scrollLeft,
          y: elementRect.top - gridContext.top + gridContext.scrollTop,
        },
        interactionPixelSize: { x: elementRect.width, y: elementRect.height },
        potentialGridPos: null, 
        interactionJustEnded: false,
        changeOccurred: false,
      };
    }

    case "MOVE": {
      if (
        state.status !== "moving" ||
        !state.dragStartOffset ||
        !state.interactionPixelSize
      )
        return state;
      const { clientX, clientY, gridContext } = action.payload;

      // Calculate new pixel position relative to grid container
      let newPixelX =
        clientX -
        gridContext.left -
        state.dragStartOffset.x +
        gridContext.scrollLeft;
      let newPixelY =
        clientY -
        gridContext.top -
        state.dragStartOffset.y +
        gridContext.scrollTop;

      // Clamp pixel position within grid bounds
      newPixelX = Math.max(
        Math.min(newPixelX, gridContext.width - state.interactionPixelSize.x),
        0
      );
      newPixelY = Math.max(newPixelY, 0);

      // Calculate potential new grid position (logical units)
      const colWidth = gridContext.colWidth;
      const rowHeight = gridContext.rowHeight;
      const gap = gridContext.gap;
      let newGridX = Math.round(newPixelX / (colWidth + gap));
      let newGridY = Math.round(newPixelY / (rowHeight + gap));

      // Clamp grid position
      newGridX = Math.max(
        Math.min(newGridX, gridContext.cols - state.gridSize.x),
        0
      );
      newGridY = Math.max(newGridY, 0);

      return {
        ...state,
        interactionPixelPos: { x: newPixelX, y: newPixelY },
        potentialGridPos: { x: newGridX, y: newGridY },
      };
    }

    case "MOVE_END": {
      if (state.status !== "moving") return state;
      const finalPos = state.potentialGridPos ?? state.gridPos; // Use potential if calculated, else original
      const didChange = finalPos.x !== state.gridPos.x || finalPos.y !== state.gridPos.y;

      return {
        ...state,
        status: "idle",
        gridPos: finalPos, // Finalize grid position
        // Clear transient state
        interactionPixelPos: null,
        interactionPixelSize: null,
        dragStartOffset: null,
        potentialGridPos: null,
        interactionJustEnded: true,
        changeOccurred: didChange,
      };
    }

    case "RESIZE_START": {
      const { clientX, clientY, elementRect, gridContext } = action.payload;
      return {
        ...state,
        status: "resizing",
        dragStartOffset: {
          // Offset from bottom-right corner
          x: elementRect.left + elementRect.width - clientX,
          y: elementRect.top + elementRect.height - clientY,
        },
        // Store initial pixel position/size
        interactionPixelPos: {
          x: elementRect.left - gridContext.left + gridContext.scrollLeft,
          y: elementRect.top - gridContext.top + gridContext.scrollTop,
        },
        interactionPixelSize: { x: elementRect.width, y: elementRect.height },
        potentialGridSize: null,
        interactionJustEnded: false,
        changeOccurred: false,
      };
    }

    case "RESIZE": {
      if (
        state.status !== "resizing" ||
        !state.dragStartOffset ||
        !state.interactionPixelPos
      )
        return state;
      const {
        clientX,
        clientY,
        gridContext,
        minW = 1,
        maxW = Infinity,
        minH = 1,
        maxH = Infinity,
      } = action.payload;

      // Calculate new pixel size based on mouse position and offset
      let newPixelW =
        clientX +
        state.dragStartOffset.x -
        (state.interactionPixelPos.x +
          gridContext.left -
          gridContext.scrollLeft);
      let newPixelH =
        clientY +
        state.dragStartOffset.y -
        (state.interactionPixelPos.y + gridContext.top - gridContext.scrollTop);

      // Clamp pixel size based on grid dimensions and min/max pixel constraints
      const colWidth = gridContext.colWidth;
      const rowHeight = gridContext.rowHeight;
      const gap = gridContext.gap;
      const minPixelW = minW * colWidth + (minW - 1) * gap;
      const maxPixelW = maxW * colWidth + (maxW - 1) * gap;
      const minPixelH = minH * rowHeight + (minH - 1) * gap;
      const maxPixelH = maxH * rowHeight + (maxH - 1) * gap;

      newPixelW = Math.max(minPixelW, newPixelW);
      newPixelH = Math.max(minPixelH, newPixelH);
      if (maxW !== Infinity) newPixelW = Math.min(maxPixelW, newPixelW);
      if (maxH !== Infinity) newPixelH = Math.min(maxPixelH, newPixelH);

      // Prevent resizing beyond grid boundaries
      const gridEdgeX =
        (gridContext.cols - state.gridPos.x) * (colWidth + gap) - gap;
      newPixelW = Math.min(newPixelW, gridEdgeX);

      // Calculate potential new grid size (logical units)
      let newGridW = Math.round((newPixelW + gap) / (colWidth + gap));
      let newGridH = Math.round((newPixelH + gap) / (rowHeight + gap));

      // Clamp grid size based on logical min/max and grid columns
      newGridW = Math.min(
        Math.max(newGridW, minW),
        maxW,
        gridContext.cols - state.gridPos.x
      );
      newGridH = Math.min(Math.max(newGridH, minH), maxH);

      return {
        ...state,
        interactionPixelSize: { x: newPixelW, y: newPixelH },
        potentialGridSize: { x: newGridW, y: newGridH },
      };
    }

    case "RESIZE_END": {
      if (state.status !== "resizing") return state;
      const finalSize = state.potentialGridSize ?? state.gridSize; // Use potential if calculated, else original
      const didChange = finalSize.x !== state.gridSize.x || finalSize.y !== state.gridSize.y;

      return {
        ...state,
        status: "idle",
        gridSize: finalSize,
        interactionPixelPos: null,
        interactionPixelSize: null,
        dragStartOffset: null,
        potentialGridSize: null,
        interactionJustEnded: true,
        changeOccurred: didChange,
      };
    }

    case "INTERACTION_END": {
      return {
        ...state,
        interactionJustEnded: true,
        changeOccurred: false,
        potentialGridSize: null,
        potentialGridPos: null,
      };
    }

    default:
      return state;
  }
};
