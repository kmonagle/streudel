import { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

export interface DragDropItem {
  id: string;
  sortOrder: number;
}

export interface DragDropProps<T extends DragDropItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  children: (item: T, index: number, dragHandleProps?: any) => React.ReactNode;
  droppableId: string;
  className?: string;
}

// Context-free droppable list component (for use within an existing DragDropContext)
export function DroppableList<T extends DragDropItem>({
  items,
  children,
  droppableId,
  className = "",
}: Omit<DragDropProps<T>, 'onReorder'>) {
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={className}
        >
          {items.map((item, index) => (
            <Draggable key={item.id} draggableId={item.id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className={snapshot.isDragging ? "dragging" : ""}
                >
                  {children(item, index, provided.dragHandleProps)}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

export function DragDropList<T extends DragDropItem>({
  items,
  onReorder,
  children,
  droppableId,
  className = "",
}: DragDropProps<T>) {
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;

      if (sourceIndex === destinationIndex) return;

      const reorderedItems = Array.from(items);
      const [removed] = reorderedItems.splice(sourceIndex, 1);
      reorderedItems.splice(destinationIndex, 0, removed);

      // Update sort orders
      const updatedItems = reorderedItems.map((item, index) => ({
        ...item,
        sortOrder: index,
      }));

      onReorder(updatedItems);
    },
    [items, onReorder]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <DroppableList
        items={items}
        droppableId={droppableId}
        className={className}
      >
        {children}
      </DroppableList>
    </DragDropContext>
  );
}

export interface TodayDragDropItem {
  id: string;
  type: 'task' | 'habit';
  todaySortOrder: number | null;
}

export interface TodayDragDropProps<T extends TodayDragDropItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  children: (item: T, index: number, dragHandleProps?: any) => React.ReactNode;
  droppableId: string;
  className?: string;
}

export function TodayDragDropList<T extends TodayDragDropItem>({
  items,
  onReorder,
  children,
  droppableId,
  className = "",
}: TodayDragDropProps<T>) {
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;

      if (sourceIndex === destinationIndex) return;

      const reorderedItems = Array.from(items);
      const [removed] = reorderedItems.splice(sourceIndex, 1);
      reorderedItems.splice(destinationIndex, 0, removed);

      // Update today sort orders
      const updatedItems = reorderedItems.map((item, index) => ({
        ...item,
        todaySortOrder: index,
      }));

      onReorder(updatedItems);
    },
    [items, onReorder]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={className}
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={snapshot.isDragging ? "dragging" : ""}
                  >
                    {children(item, index, provided.dragHandleProps)}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
