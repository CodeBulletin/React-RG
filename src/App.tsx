import { useRef, useState } from "react";
import "./App.css";
import { Exmaple } from "./Components/Example";
import Grid from "./Components/Grid";
import Widget from "./Components/Widget";
import { GridRef } from "./Components/types";

function App() {
  const [slots, setSlots] = useState(false);
  const gridRef = useRef<GridRef | null>(null);
  const [layout, setLayout] = useState([
    {
      id: 1,
      w: 3,
      h: 4,
      x: 0,
      y: 0,
      minW: 1,
      minH: 1,
      maxH: 10,
      maxW: 10,
      static: false,
      isResizable: true,
      isMovable: true,
    },
    {
      id: 2,
      w: 2,
      h: 2,
      x: 3,
      y: 0,
      minW: 1,
      minH: 1,
      maxH: 10,
      maxW: 10,
      static: false,
      isResizable: true,
      isMovable: true,
    },
    {
      id: 3,
      w: 2,
      h: 2,
      x: 3,
      y: 2,
      minW: 1,
      minH: 1,
      maxH: 10,
      maxW: 10,
      static: false,
      isResizable: true,
      isMovable: true,
    },
    {
      id: 4,
      w: 3,
      h: 4,
      x: 5,
      y: 0,
      minW: 1,
      minH: 1,
      maxH: null,
      maxW: null,
      static: false,
      isResizable: true,
      isMovable: true,
    },
  ]);
  const changeLayout = () => {
    setLayout([
      {
        id: 2,
        w: 3,
        h: 4,
        x: 0,
        y: 0,
        minW: 1,
        minH: 1,
        maxH: 10,
        maxW: 10,
        static: false,
        isResizable: true,
        isMovable: true,
      },
      {
        id: 1,
        w: 2,
        h: 2,
        x: 3,
        y: 0,
        minW: 1,
        minH: 1,
        maxH: 10,
        maxW: 10,
        static: false,
        isResizable: true,
        isMovable: true,
      },
      {
        id: 4,
        w: 2,
        h: 2,
        x: 3,
        y: 2,
        minW: 1,
        minH: 1,
        maxH: 10,
        maxW: 10,
        static: false,
        isResizable: true,
        isMovable: true,
      },
      {
        id: 3,
        w: 3,
        h: 4,
        x: 5,
        y: 0,
        minW: 1,
        minH: 1,
        maxH: 10,
        maxW: 10,
        static: false,
        isResizable: true,
        isMovable: true,
      },
    ]);
  };

  return (
    <div>
      <div>
        <button onClick={() => setSlots((s) => !s)}>Toggle Grid</button>
        <button onClick={() => console.log(gridRef.current?.getLayout())}>
          Print Layout
        </button>
        <button onClick={() => changeLayout()}>Change layout</button>
      </div>
      <Grid cols={12} rowHeight={75} gap={20} showSlots={slots} ref={gridRef} showPlaceholder>
        {layout.map((l) => (
          <Widget
            key={l.id}
            id={l.id}
            x={l.x}
            y={l.y}
            w={l.w}
            h={l.h}
            static={true}
            isResizable={l.isResizable}
            isMovable={l.isMovable}
            minW={l.minW}
            minH={l.minH}
            maxH={l.maxH ?? undefined}
            maxW={l.maxW ?? undefined}
          >
            <Exmaple id={l.id} />
          </Widget>
        ))}
      </Grid>
    </div>
  );
}

export default App;
