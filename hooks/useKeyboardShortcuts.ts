import { useEffect } from 'react';
import { useProjectStore } from '../store/useProjectStore';

export const useKeyboardShortcuts = () => {
    const { 
        isGenerating, selection, sketchOptions, currentOptionIndex, 
        deleteItem, updateItem, undo, redo, setSelection 
    } = useProjectStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isGenerating) return;
            
            // Ignore input fields
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

            // Undo/Redo
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
                return;
            }

            // Selection Actions
            if (selection) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setSelection(null);
                    return;
                }

                if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    deleteItem(selection.id, selection.type);
                    return;
                }

                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    e.preventDefault();
                    const currentOpt = sketchOptions[currentOptionIndex];
                    if (currentOpt?.status === 'loaded') {
                        const item = selection.type === 'room' 
                            ? currentOpt.data.rooms.find(r => r.id === selection.id)
                            : currentOpt.data.elements.find(el => e => e.id === selection.id);
                        
                        if (item) {
                            const step = e.shiftKey ? 1 : 10;
                            let field = 'x';
                            // @ts-ignore
                            let val = item.x;
                            
                            // @ts-ignore
                            if (e.key === 'ArrowLeft') { field = 'x'; val = item.x - step; }
                            // @ts-ignore
                            if (e.key === 'ArrowRight') { field = 'x'; val = item.x + step; }
                            // @ts-ignore
                            if (e.key === 'ArrowUp') { field = 'y'; val = item.y - step; }
                            // @ts-ignore
                            if (e.key === 'ArrowDown') { field = 'y'; val = item.y + step; }
                            
                            updateItem(selection.id, selection.type, field, val);
                        }
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGenerating, selection, sketchOptions, currentOptionIndex, deleteItem, updateItem, undo, redo, setSelection]);
};