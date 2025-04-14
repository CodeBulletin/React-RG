import React from "react";
import { useGridContext } from "./Grid";

const Placeholder = () => {
  const { cols, rowHeight, gap, rect, width, changing } = useGridContext();

  const cellWidth = (width - gap * (cols - 1)) / cols;

  const left = rect.pos.x * (cellWidth + gap);
  const top = rect.pos.y * (rowHeight + gap);
  const w = rect.size.x * cellWidth + (rect.size.x - 1) * gap;
  const h = rect.size.y * rowHeight + (rect.size.y - 1) * gap;

  const [style, setStyle] = React.useState({
    left,
    top,
    width: w,
    height: h,
  });

  React.useLayoutEffect(() => {
    setStyle({ left, top, width: w, height: h });
  }, [left, top, w, h]);

  if (changing === -1) return null;

  return (
    <div style={{
      position: "absolute"
    }}>
      <div
        className="Placeholder-absolute"
        style={{
          position: "absolute",
          ...style,
          transition: "all 200ms ease",
          border: "1px dashed black",
          zIndex: 2,
          backgroundColor: "lavender",
          opacity: 0.2,
        }}
      />
    </div>
  );
};

export default Placeholder;
