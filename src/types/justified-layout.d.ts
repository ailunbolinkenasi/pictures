declare module "justified-layout" {
  export interface Box {
    left: number;
    top: number;
    width: number;
    height: number;
  }

  export interface LayoutResult {
    boxes: Box[];
    containerHeight: number;
    widows?: number[];
  }

  export interface LayoutOptions {
    containerWidth: number;
    targetRowHeight?: number;
    boxSpacing?: number;
    containerPadding?: number;
    forceAspectRatio?: boolean;
    maxNumRows?: number;
  }

  export default function justifiedLayout(
    aspectRatios: number[],
    options?: LayoutOptions,
  ): LayoutResult;
}
