import { IconClock } from '@tabler/icons-react';

export function FlowRunDetails() {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b p-4">
        <IconClock className="h-5 w-5" />
        <h3 className="font-semibold">Run Details</h3>
      </div>
      <div className="flex-1 p-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Flow run details will be displayed here when available.
          </p>
        </div>
      </div>
    </div>
  );
} 