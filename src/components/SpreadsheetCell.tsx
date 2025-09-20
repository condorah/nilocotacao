import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SpreadsheetCellProps {
  cellId: string;
  value: string;
  isSelected: boolean;
  isEditing: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onValueChange: (value: string) => void;
  onEditComplete: () => void;
}

export const SpreadsheetCell: React.FC<SpreadsheetCellProps> = ({
  cellId,
  value,
  isSelected,
  isEditing,
  onClick,
  onDoubleClick,
  onValueChange,
  onEditComplete,
}) => {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onValueChange(editValue);
      onEditComplete();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      onEditComplete();
    }
    e.stopPropagation();
  };

  const handleInputBlur = () => {
    onValueChange(editValue);
    onEditComplete();
  };

  return (
    <div
      className={cn(
        "w-20 h-8 border-r border-b border-cell-border bg-cell cursor-cell relative",
        "hover:bg-cell-hover transition-colors",
        isSelected && "ring-2 ring-primary ring-inset bg-cell-selected",
        isEditing && "bg-cell-active"
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          className="w-full h-full px-1 bg-transparent border-none outline-none text-xs"
        />
      ) : (
        <div className="w-full h-full px-1 py-1 text-xs truncate flex items-center">
          {value}
        </div>
      )}
    </div>
  );
};