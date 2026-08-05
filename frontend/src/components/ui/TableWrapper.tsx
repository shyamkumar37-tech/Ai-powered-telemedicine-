import { DynamicState } from "./../../types/DynamicState";
import { ReactNode } from "react";

export interface TableWrapperProps {
  children?: ReactNode;
  className?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function TableWrapper({ children, className = "" }: TableWrapperProps) {
  return (
    <div className={`glass-card overflow-hidden ${className}`.trim()}>
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
