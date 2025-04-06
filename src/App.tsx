import { useRef, useState } from "react";
import "./App.css";
import { Exmaple } from "./Components/Example";
import Grid, { GridRef } from "./Components/Grid";
import { Widget } from "./Components/Widget";

function App() {
  const [count, setCount] = useState(1);
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
      maxH: 10,
      maxW: 10,
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
    ])
  }
  return (
    <div>
      <div>
        <button onClick={() => setCount((c) => c + 1)}>AddWidget</button>
        <button onClick={() => setSlots((s) => !s)}>Toggle Grid</button>
        <button onClick={() => console.log(gridRef.current?.getLayout())}>
          Print Layout
        </button>
        <button onClick={() => changeLayout()}>Change layout</button>
      </div>
      <Grid cols={24} rowHeight={75} gap={20} showSlots={slots} ref={gridRef}>
        {layout.map((l) => (
            <Widget
              key={l.id}
              id={l.id}
              x={l.x}
              y={l.y}
              w={l.w}
              h={l.h}
              static={l.static}
              isResizable={l.isResizable}
              isMovable={l.isMovable}
              minW={l.minW}
              minH={l.minH}
              maxH={l.maxH}
              maxW={l.maxW}
            >
              <Exmaple id={l.id} />
            </Widget>
          ))}
      </Grid>
    </div>
  );
}

export default App;
