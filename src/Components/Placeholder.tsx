import React from "react";
import { useGridContext } from "./Grid";

const Placeholder = () => {
  const gridContext = useGridContext();
  const { cols, rowHeight, gap, rect } = gridContext;
  if (gridContext.changing === -1) return <></>; 
  return (
      <div
        className="Placeholder-cell"
        style={{
          gridArea: `${rect.pos.y + 1} / ${rect.pos.x + 1} / span ${rect.size.y} / span ${rect.size.x}`,
          border: "1px dashed black",
          zIndex: 3,
        }}
      >
      </div>
  );
};

export default Placeholder;
