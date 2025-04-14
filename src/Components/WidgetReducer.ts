import { Vec2, WidgetAction, WidgetState } from "./types";

export const clampVec2 = (v: Vec2, min: Vec2, max: Vec2): Vec2 => {
  return {
    x: Math.min(Math.max(v.x, min.x), max.x),
    y: Math.min(Math.max(v.y, min.y), max.y),
  };
};

export const createInitialState = (): WidgetState => ({
  gridPos: { x: 0, y: 0 },
  gridSize: { x: 0, y: 0 },
  minSize: { x: 0, y: 0 },
  maxSize: { x: 0, y: 0 },
  status: "idle",
  interactionPixelPos: null,
  interactionPixelSize: null,
  dragStartOffset: null,
  potentialGridPos: null,
  potentialGridSize: null,
  prevValue: null,
  interactionJustEnded: false,
  changeOccurred: false,
  isDraggable: false,
  isResizeable: false,
  isStatic: false,
});

export const widgetReducer = (
  state: WidgetState,
  action: WidgetAction
): WidgetState => {
  switch (action.type) {
    case "SET_STATE": {
      const { x, y, w, h, ...other } = action.payload;
      let min = {
        x: other.minW ?? 1,
        y: other.minH ?? 1,
      };
      let max = {
        x: other.maxW ?? Infinity,
        y: other.maxH ?? Infinity,
      };

      return {
        ...state,
        gridPos: { x, y },
        gridSize: clampVec2(
          {
            x: w,
            y: h,
          },
          min,
          max
        ),
        maxSize: max,
        minSize: min,
        isDraggable: other.isDraggable ?? true,
        isResizeable: other.isResizeable ?? true,
        isStatic: other.isStatic
      };
    }

    case "SET_POSITION": {
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
      const { clientX, clientY, gridContext, currentScrollTop } = action.payload;

      const actualScrollTop = currentScrollTop ?? gridContext.scrollTop;

      let newPixelX =
        clientX -
        gridContext.left -
        state.dragStartOffset.x +
        gridContext.scrollLeft;
      let newPixelY =
        clientY -
        gridContext.top -
        state.dragStartOffset.y +
        actualScrollTop;

      newPixelX = Math.max(
        Math.min(newPixelX, gridContext.width - state.interactionPixelSize.x),
        0
      );
      newPixelY = Math.max(newPixelY, 0);

      const colWidth = gridContext.colWidth;
      const rowHeight = gridContext.rowHeight;
      const gap = gridContext.gap;
      let newGridX = Math.round(newPixelX / (colWidth + gap));
      let newGridY = Math.round(newPixelY / (rowHeight + gap));

      newGridX = Math.max(
        Math.min(newGridX, gridContext.cols - state.gridSize.x),
        0
      );
      newGridY = Math.max(newGridY, 0);

      return {
        ...state,
        interactionPixelPos: { x: newPixelX, y: newPixelY },
        prevValue: {
          x: state.potentialGridPos?.x ?? state.gridPos.x,
          y: state.potentialGridPos?.y ?? state.gridPos.y,
        },
        potentialGridPos: { x: newGridX, y: newGridY },
      };
    }

    case "MOVE_END": {
      if (state.status !== "moving") return state;
      const finalPos = state.potentialGridPos ?? state.gridPos;
      const didChange =
        finalPos.x !== state.gridPos.x || finalPos.y !== state.gridPos.y;

      return {
        ...state,
        status: "idle",
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
          x: elementRect.left + elementRect.width - clientX,
          y: elementRect.top + elementRect.height - clientY,
        },
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
        currentScrollTop
      } = action.payload;


      const actualScrollTop = currentScrollTop ?? gridContext.scrollTop;

      let newPixelW =
        clientX +
        state.dragStartOffset.x -
        (state.interactionPixelPos.x +
          gridContext.left -
          gridContext.scrollLeft);
      let newPixelH =
        clientY +
        state.dragStartOffset.y -
        (state.interactionPixelPos.y + gridContext.top - actualScrollTop);

      const colWidth = gridContext.colWidth;
      const rowHeight = gridContext.rowHeight;
      const gap = gridContext.gap;
      const minPixelW = state.minSize.x * colWidth + (state.minSize.x - 1) * gap;
      const maxPixelW = state.maxSize.x * colWidth + (state.maxSize.x - 1) * gap;
      const minPixelH = state.minSize.y * rowHeight + (state.minSize.y - 1) * gap;
      const maxPixelH = state.maxSize.y * rowHeight + (state.maxSize.y - 1) * gap;

      newPixelW = Math.max(minPixelW, newPixelW);
      newPixelH = Math.max(minPixelH, newPixelH);
      if (state.maxSize.x !== Infinity) newPixelW = Math.min(maxPixelW, newPixelW);
      if (state.maxSize.y !== Infinity) newPixelH = Math.min(maxPixelH, newPixelH);

      const gridEdgeX =
        (gridContext.cols - state.gridPos.x) * (colWidth + gap) - gap;
      newPixelW = Math.min(newPixelW, gridEdgeX);

      let newGridW = Math.round((newPixelW + gap) / (colWidth + gap));
      let newGridH = Math.round((newPixelH + gap) / (rowHeight + gap));

      newGridW = Math.min(
        Math.max(newGridW, state.minSize.x),
        state.maxSize.x,
        gridContext.cols - state.gridPos.x
      );
      newGridH = Math.min(Math.max(newGridH, state.minSize.y), state.maxSize.y);

      return {
        ...state,
        interactionPixelSize: { x: newPixelW, y: newPixelH },
        prevValue: {
          x: state.potentialGridSize?.x ?? state.gridSize.x,
          y: state.potentialGridSize?.y ?? state.gridSize.y,
        },
        potentialGridSize: { x: newGridW, y: newGridH },
      };
    }

    case "RESIZE_END": {
      if (state.status !== "resizing") return state;
      const finalSize = state.potentialGridSize ?? state.gridSize;
      const didChange =
        finalSize.x !== state.gridSize.x || finalSize.y !== state.gridSize.y;

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
