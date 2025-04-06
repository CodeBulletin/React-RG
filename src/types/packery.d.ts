declare module "packery" {
  import { EventEmitter } from "events";

  interface PackeryOptions {
    itemSelector?: string;
    columnWidth?: number | string;
    rowHeight?: number | string;
    gutter?: number | string;
    percentPosition?: boolean;
    stamp?: string;
    fitWidth?: boolean;
    originLeft?: boolean;
    originTop?: boolean;
    containerStyle?: object;
    transitionDuration?: string;
    resize?: boolean;
    initLayout?: boolean;
  }

  class Packery extends EventEmitter {
    constructor(element: Element | string, options?: PackeryOptions);
    layout(): void;
    stamp(elements: Element | Element[]): void;
    unstamp(elements: Element | Element[]): void;
    appended(elements: Element | Element[]): void;
    prepended(elements: Element | Element[]): void;
    reloadItems(): void;
    getItemElements(): Element[];
    shiftLayout(): void;
    destroy(): void;
  }

  export = Packery;
}
