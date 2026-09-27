import type { DetailedHTMLProps, HTMLAttributes } from "react";

/** Props for the <model-viewer> web component (@google/model-viewer). */
export interface ModelViewerProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
  src?: string;
  alt?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "ar-scale"?: string;
  "camera-controls"?: boolean;
  "auto-rotate"?: boolean;
  "shadow-intensity"?: string;
  exposure?: string;
  "interaction-prompt"?: string;
  loading?: "auto" | "lazy" | "eager";
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}
