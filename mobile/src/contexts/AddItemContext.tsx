import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

export type AddRecipeHandler = (url: string) => Promise<void>;

interface AddItemContextValue {
  isVisible: boolean;
  openAddDialog: () => void;
  closeAddDialog: () => void;
  registerOnAddRecipe: (handler: AddRecipeHandler) => void;
  onAddRecipe: AddRecipeHandler;
}

const AddItemContext = createContext<AddItemContextValue | null>(null);

export function AddItemProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  const onAddRecipeRef = useRef<AddRecipeHandler>(async () => {
    console.warn('No onAddRecipe handler registered');
  });

  const openAddDialog = useCallback(() => {
    setIsVisible(true);
  }, []);

  const closeAddDialog = useCallback(() => {
    setIsVisible(false);
  }, []);

  const registerOnAddRecipe = useCallback((handler: AddRecipeHandler) => {
    onAddRecipeRef.current = handler;
  }, []);

  const onAddRecipe: AddRecipeHandler = useCallback(async (url) => {
    await onAddRecipeRef.current(url);
  }, []);

  return (
    <AddItemContext.Provider
      value={{
        isVisible,
        openAddDialog,
        closeAddDialog,
        registerOnAddRecipe,
        onAddRecipe,
      }}
    >
      {children}
    </AddItemContext.Provider>
  );
}

export function useAddItem(): AddItemContextValue {
  const context = useContext(AddItemContext);
  if (!context) {
    throw new Error('useAddItem must be used within an AddItemProvider');
  }
  return context;
}
