import React from "react";
import { useGridContext } from "./Grid";

const GridSlots = () => {
  const gridContext = useGridContext();
  const { cols, rowHeight, colWidth, gap, rows } = gridContext;
  const [cells, setCells] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (rows == 0) return;
    const newCells = [];
    for (let i = 0; i < rows * cols; i++) {
      newCells.push(i);
    }
    setCells(newCells);
  }, [rows, cols]);

  return (
    <div
      style={{
        position: "absolute",
      }}
    >
      <div
        className="GridLines-container"
        style={{
          width: colWidth * cols + (cols - 1) * gap,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: `${gap}px`,
          pointerEvents: "none",
          zIndex: 0,
          backgroundColor: "#f0f0f0",
          gridAutoRows: `${rowHeight || 100}px`,
          opacity: 0.5,
        }}
      >
        {cells.map((cell) => (
          <div
            key={cell}
            className="GridLines-cell"
            style={{
              height: rowHeight,
              backgroundColor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default GridSlots;
