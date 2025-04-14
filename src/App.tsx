import { useRef, useState } from "react";
import "./App.css";
import { Exmaple } from "./Components/Example";
import Grid from "./Components/Grid";
import Widget from "./Components/Widget";
import { ExtendedLayout, GridRef } from "./Components/types";

function App() {
  const gridRef = useRef<GridRef | null>(null);
  const [layout, setLayout] = useState<ExtendedLayout[]>([
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
      isStatic: false,
      isResizeable: true,
      isDraggable: true,
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
      isStatic: false,
      isResizeable: true,
      isDraggable: true,
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
      isStatic: true,
      isResizeable: true,
      isDraggable: true,
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
      isStatic: false,
      isResizeable: true,
      isDraggable: true,
    },
    {
      id: 5,
      w: 2,
      h: 2,
      x: 8,
      y: 2,
      minW: 1,
      minH: 1,
      maxH: 10,
      maxW: 10,
      isStatic: true,
      isResizeable: true,
      isDraggable: true,
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
        isStatic: false,
        isResizeable: true,
        isDraggable: true,
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
        isStatic: false,
        isResizeable: true,
        isDraggable: true,
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
        isStatic: false,
        isResizeable: true,
        isDraggable: true,
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
        isStatic: false,
        isResizeable: true,
        isDraggable: true,
      },
    ]);
  };

  return (
    <div style={{
      flexGrow: 1,
      display: "flex",
      flexDirection: 'column',
      paddingLeft: '100px',
      paddingRight: '100px',
      paddingBottom: '100px',
      gap: '100px'
    }}>
      <div>
        <button onClick={() => console.log(gridRef.current?.getLayout())}>
          Print Layout
        </button>
        <button onClick={() => changeLayout()}>Change layout</button>
      </div>
      <Grid 
        cols={12} 
        rows={12}
        gap={20} 
        padding={10}
        ref={gridRef} 
        layout={layout}
        setLayout={setLayout}
        showSlots
        showPlaceholder
      >
        {layout.map((l) => (
          <Widget
            key={l.id}
            id={l.id}
          >
            <Exmaple id={l.id} />
          </Widget>
        ))}
      </Grid>
    </div>
  );
}

export default App;
