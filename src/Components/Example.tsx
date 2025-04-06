import React, { useState, useMemo, useEffect } from "react";
import { useWidgetContext } from "./Widget";



export const Exmaple = React.memo(({id}: {id: number}) => {

  const widgetContext = useWidgetContext();

  console.log('rerendering', id)

  return (
    <div style={{
      position: "absolute",
      border: "1px solid black",
      backgroundColor: "white",
      width: '100%',
      height: '100%',
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "20px",
        backgroundColor: "lightgray",
      }} ref={widgetContext.moveRef}>

      </div>


      <div style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "10px",
        height: "10px",
        backgroundColor: "red",
      }}>

      </div>

      <div style={{
        width: '100%',
        height: '100%',
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {id}
      </div>
      

      <div style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        width: "20px",
        height: "20px",
        backgroundColor: "black",
      }} ref={widgetContext.resizeRef}>

      </div>
    </div>
  );
})
