import React, { useState, useRef, useCallback } from 'react';
import { SpreadsheetCell } from './SpreadsheetCell';
import { SpreadsheetHeader } from './SpreadsheetHeader';

interface CellData {
  value: string;
  formula?: string;
}

export const Spreadsheet: React.FC = () => {
  const [data, setData] = useState<Record<string, CellData>>({});
  const [selectedCell, setSelectedCell] = useState<string | null>('A1');
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ROWS = 100;
  const COLUMNS = 26; // A-Z

  const getColumnLetter = (index: number): string => {
    return String.fromCharCode(65 + index);
  };

  const getCellId = (row: number, col: number): string => {
    return `${getColumnLetter(col)}${row + 1}`;
  };

  const updateCellData = useCallback((cellId: string, value: string) => {
    setData(prev => ({
      ...prev,
      [cellId]: { value, formula: value.startsWith('=') ? value : undefined }
    }));
  }, []);

  const handleCellClick = useCallback((cellId: string) => {
    setSelectedCell(cellId);
    setEditingCell(null);
  }, []);

  const handleCellDoubleClick = useCallback((cellId: string) => {
    setEditingCell(cellId);
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!selectedCell) return;

    const match = selectedCell.match(/^([A-Z])(\d+)$/);
    if (!match) return;

    const col = match[1].charCodeAt(0) - 65;
    const row = parseInt(match[2]) - 1;

    let newCol = col;
    let newRow = row;

    switch (event.key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(ROWS - 1, row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(COLUMNS - 1, col + 1);
        break;
      case 'Enter':
        if (editingCell) {
          setEditingCell(null);
        } else {
          setEditingCell(selectedCell);
        }
        return;
      case 'Escape':
        setEditingCell(null);
        return;
      default:
        return;
    }

    event.preventDefault();
    const newCellId = getCellId(newRow, newCol);
    setSelectedCell(newCellId);
    setEditingCell(null);
  }, [selectedCell, editingCell, ROWS, COLUMNS]);

  return (
    <div 
      className="w-full h-screen bg-background overflow-auto focus:outline-none" 
      tabIndex={0}
      onKeyDown={handleKeyDown}
      ref={containerRef}
    >
      <div className="inline-block min-w-full">
        {/* Header Row */}
        <div className="flex sticky top-0 z-20">
          <div className="w-16 h-8 bg-header border-r border-header-border flex items-center justify-center text-xs font-medium text-header-foreground">
            
          </div>
          {Array.from({ length: COLUMNS }, (_, colIndex) => (
            <SpreadsheetHeader
              key={colIndex}
              type="column"
              label={getColumnLetter(colIndex)}
            />
          ))}
        </div>

        {/* Data Rows */}
        {Array.from({ length: ROWS }, (_, rowIndex) => (
          <div key={rowIndex} className="flex">
            <SpreadsheetHeader
              type="row"
              label={(rowIndex + 1).toString()}
            />
            {Array.from({ length: COLUMNS }, (_, colIndex) => {
              const cellId = getCellId(rowIndex, colIndex);
              return (
                <SpreadsheetCell
                  key={cellId}
                  cellId={cellId}
                  value={data[cellId]?.value || ''}
                  isSelected={selectedCell === cellId}
                  isEditing={editingCell === cellId}
                  onClick={() => handleCellClick(cellId)}
                  onDoubleClick={() => handleCellDoubleClick(cellId)}
                  onValueChange={(value) => updateCellData(cellId, value)}
                  onEditComplete={() => setEditingCell(null)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};