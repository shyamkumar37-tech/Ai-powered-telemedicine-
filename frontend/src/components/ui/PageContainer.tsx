import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { ReactNode } from "react";

export interface PageContainerProps {
  className?: DynamicState;
  children?: ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function PageContainer({ className = "", children }: PageContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-7xl ${className}`.trim()}>
      {children}
    </div>
  );
}
