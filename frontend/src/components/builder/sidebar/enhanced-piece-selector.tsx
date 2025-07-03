import React, { useMemo, useState } from 'react';
import { IconGripVertical, IconPlus, IconSearch, IconSparkles } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useEnhancedWorkflowBuilderStore } from '@/stores/enhanced-workflow-builder-store';
import { getAvailablePieceTypes, getAvailableTriggerTypes } from '../nodes/step-utils';

interface EnhancedPieceSelectorProps {
  onSelectPiece?: (piece: any) => void;
  className?: string;
}

export function EnhancedPieceSelector({ onSelectPiece, className }: EnhancedPieceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'triggers' | 'actions'>('all');

  const { 
    flowVersion,
    readonly,
    nodes,
    applyOperation,
  } = useEnhancedWorkflowBuilderStore();

  const pieceTypes = getAvailablePieceTypes();
  const triggerTypes = getAvailableTriggerTypes();
  // Check if there's a trigger node in the current nodes array
  const hasTrigger = nodes.some(node => node.data.stepType === 'trigger');

  // Filter pieces based on search and category
  const filteredPieces = useMemo(() => {
    let pieces = pieceTypes;
    
    if (searchTerm) {
      pieces = pieces.filter(piece => 
        piece.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        piece.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        piece.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      pieces = pieces.filter(piece => piece.category === selectedCategory);
    }

    return pieces;
  }, [pieceTypes, searchTerm, selectedCategory]);

  const filteredTriggers = useMemo(() => {
    if (searchTerm) {
      return triggerTypes.filter(trigger =>
        trigger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trigger.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return triggerTypes;
  }, [triggerTypes, searchTerm]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(pieceTypes.map(p => p.category)));
    return [{ id: 'all', name: 'All Categories' }, ...cats.map(cat => ({ id: cat, name: cat }))];
  }, [pieceTypes]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, item: any, type: 'trigger' | 'action') => {
    e.dataTransfer.setData('application/reactflow', item.id);
    e.dataTransfer.setData('application/reactflow-label', item.name);
    e.dataTransfer.setData('application/reactflow-category', type === 'trigger' ? 'triggers' : 'actions');
    e.dataTransfer.setData('application/reactflow-type', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle piece selection
  const handlePieceSelect = async (piece: any, type: 'trigger' | 'action') => {
    if (readonly) return;
    
    // Check if trying to add trigger when one already exists
    if (type === 'trigger' && hasTrigger) {
      // Show error or handle trigger replacement
      return;
    }

    try {
      await applyOperation({
        type: type === 'trigger' ? 'UPDATE_TRIGGER' : 'ADD_ACTION',
        request: {
          stepName: `${piece.id}_${Date.now()}`,
          displayName: piece.name,
          type: type.toUpperCase(),
          settings: {
            pieceType: piece.id,
            ...piece.settings,
          },
        },
      });

      onSelectPiece?.(piece);
    } catch (error) {
      console.error('Failed to add piece:', error);
    }
  };

  const renderPieceItem = (piece: any, type: 'trigger' | 'action') => {
    const isDisabled = type === 'trigger' && hasTrigger;
    const Icon = piece.icon;

    return (
      <div key={piece.id}>
        <Button
          variant="ghost"
          className={cn(
            'group relative cursor-grab active:cursor-grabbing w-full justify-start text-left',
            'rounded-lg border border-transparent transition-all duration-200',
            'hover:border-border/60 hover:bg-muted/40 hover:shadow-sm',
            'focus:border-ring/40 focus:ring-2 focus:ring-ring/20',
            isDisabled && 'cursor-not-allowed bg-muted/20 opacity-50',
            'h-auto p-3'
          )}
          disabled={isDisabled}
          draggable={!isDisabled && !readonly}
          onClick={() => handlePieceSelect(piece, type)}
          onDragStart={(e) => {
            if (!isDisabled && !readonly) {
              handleDragStart(e as any, piece, type);
            }
          }}
        >
          <div className="flex w-full items-center gap-3">
            <div className={cn('flex-shrink-0 rounded-md p-1.5 transition-colors', piece.color)}>
              <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate font-medium text-sm">{piece.name}</span>
                <IconGripVertical className="h-3 w-3 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground/70" />
              </div>
              <p className="mt-0.5 line-clamp-2 text-muted-foreground/70 text-xs text-left">
                {piece.description}
              </p>
              <div className="mt-1.5 flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  {piece.category || (type === 'trigger' ? 'Trigger' : 'Action')}
                </Badge>
                {isDisabled && (
                  <Badge variant="destructive" className="text-xs">
                    Disabled
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Button>
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <IconSparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Add Nodes</h2>
        </div>
        
        {/* Search */}
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="triggers">Triggers</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="all" className="mt-4 h-full">
              <ScrollArea className="h-full px-4">
                <div className="space-y-6">
                  {/* Triggers Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-medium text-sm">Triggers</h3>
                      <Badge variant="secondary" className="text-xs">
                        {filteredTriggers.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {filteredTriggers.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                          <p className="text-muted-foreground text-sm">
                            {searchTerm ? 'No triggers match your search' : 'No triggers available'}
                          </p>
                        </div>
                      ) : (
                        filteredTriggers.map(trigger => renderPieceItem(trigger, 'trigger'))
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Actions Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-medium text-sm">Actions</h3>
                      <Badge variant="secondary" className="text-xs">
                        {filteredPieces.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {filteredPieces.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                          <p className="text-muted-foreground text-sm">
                            {searchTerm ? 'No actions match your search' : 'No actions available'}
                          </p>
                        </div>
                      ) : (
                        filteredPieces.map(piece => renderPieceItem(piece, 'action'))
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="triggers" className="mt-4 h-full">
              <ScrollArea className="h-full px-4">
                <div className="space-y-1">
                  {filteredTriggers.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                      <p className="text-muted-foreground text-sm">
                        {searchTerm ? 'No triggers match your search' : 'No triggers available'}
                      </p>
                    </div>
                  ) : (
                    filteredTriggers.map(trigger => renderPieceItem(trigger, 'trigger'))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="actions" className="mt-4 h-full">
              <ScrollArea className="h-full px-4">
                <div className="space-y-1">
                  {filteredPieces.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                      <p className="text-muted-foreground text-sm">
                        {searchTerm ? 'No actions match your search' : 'No actions available'}
                      </p>
                    </div>
                  ) : (
                    filteredPieces.map(piece => renderPieceItem(piece, 'action'))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
} 