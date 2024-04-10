export interface EllipseProps {
  width?: string
  height?: string
  fill?: string
  position: EllipsePosition
  [prop: string]: any
}

export type EllipsePosition =
  | "top-right"
  | "top-left"
  | "middle-right"
  | "middle-left"
  | "bottom-right"
  | "bottom-left"