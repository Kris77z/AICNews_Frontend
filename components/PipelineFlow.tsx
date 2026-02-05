'use client';

import { getNodeStatus, NODE_CONFIG } from '@/lib/pipeline-utils';
import type { PipelineState } from '@/lib/types';
import { NodeStatus } from './NodeStatus';

interface PipelineFlowProps {
  state: PipelineState;
}

export function PipelineFlow({ state }: PipelineFlowProps) {
  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="flex items-center gap-2 min-w-max px-4">
        {NODE_CONFIG.map((node, index) => {
          const status = getNodeStatus(node.id, state);
          return (
            <div key={node.id} className="flex items-center">
              <NodeStatus nodeId={node.id} status={status} state={state} />
              {index < NODE_CONFIG.length - 1 && (
                <div className="w-8 h-0.5 bg-border mx-2 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

