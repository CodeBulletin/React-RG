import React from "react";
import { useGridContext } from "./Grid";

const GridSlots = () => {
  const gridContext = useGridContext();
  const { cols, rowHeight, gap, rows } = gridContext;
  const [cells, setCells] = React.useState<number[]>([]);

  React.useEffect(() => {
    if(rows == 0) return;
    const newCells = [];
    for (let i = 0; i < rows * cols; i++) {
      newCells.push(i);
    }
    setCells(newCells);
  }, [rows, cols]);

  return (
    <div
      className="GridLines-container"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: `${gap}px`,
        pointerEvents: "none", // doesn't block clicks
        zIndex: 0, // stays behind everything
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
        >
        </div>
      ))}
    </div>
  );
};

export default GridSlots;
