import React from 'react';
import { cn } from '@/lib/utils';

interface SpreadsheetHeaderProps {
  type: 'row' | 'column';
  label: string;
}

export const SpreadsheetHeader: React.FC<SpreadsheetHeaderProps> = ({
  type,
  label,
}) => {
  return (
    <div
      className={cn(
        "bg-header border-r border-b border-header-border",
        "flex items-center justify-center text-xs font-medium text-header-foreground",
        "select-none",
        type === 'row' ? "w-16 h-8 sticky left-0 z-10" : "w-20 h-8"
      )}
    >
      {label}
    </div>
  );
};