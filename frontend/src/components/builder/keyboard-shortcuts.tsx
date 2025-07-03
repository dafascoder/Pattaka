import React, { useState } from 'react';
import { IconKeyboard, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const shortcuts = [
  {
    category: 'General',
    items: [
      { keys: ['Ctrl', 'S'], description: 'Save workflow' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo' },
      { keys: ['Escape'], description: 'Clear selection' },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { keys: ['Space'], description: 'Pan canvas' },
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Ctrl', '0'], description: 'Fit to screen' },
    ],
  },
  {
    category: 'Editing',
    items: [
      { keys: ['Delete'], description: 'Delete selected step' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate selected step' },
      { keys: ['Ctrl', 'C'], description: 'Copy selected step' },
      { keys: ['Ctrl', 'V'], description: 'Paste step' },
    ],
  },
  {
    category: 'Testing',
    items: [
      { keys: ['Ctrl', 'Enter'], description: 'Test selected step' },
      { keys: ['Ctrl', 'Shift', 'Enter'], description: 'Run workflow' },
    ],
  },
];

export function FlowKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="fixed bottom-4 right-4 z-50 rounded-full p-2 h-10 w-10"
          title="Keyboard shortcuts"
        >
          <IconKeyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconKeyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={i}>
                          <Badge variant="outline" className="text-xs font-mono">
                            {key}
                          </Badge>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 