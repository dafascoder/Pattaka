import { IconHistory } from '@tabler/icons-react';

export function FlowVersionHistory() {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b p-4">
        <IconHistory className="h-5 w-5" />
        <h3 className="font-semibold">Version History</h3>
      </div>
      <div className="flex-1 p-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Version history will be displayed here when available.
          </p>
        </div>
      </div>
    </div>
  );
} 