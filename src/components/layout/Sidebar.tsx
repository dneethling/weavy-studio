import {
  Type, Sparkles, Pencil, Image, Layers, Upload,
  Droplets, Maximize2, Crop, SunMoon, Link2, StickyNote,
} from 'lucide-react';
import { NODE_CATEGORIES, NODE_DEFINITIONS } from '../../constants/nodeDefinitions';
import { cn } from '../../utils/cn';
import type { DragEvent } from 'react';

const ICONS: Record<string, typeof Type> = {
  Type,
  Sparkles,
  Pencil,
  Image,
  Layers,
  Upload,
  Droplets,
  Maximize2,
  Crop,
  SunMoon,
  Link2,
  StickyNote,
};

export function Sidebar() {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/bxai-node-type', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-y-auto">
      <div className="px-3 py-3 border-b border-zinc-800">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nodes</h2>
      </div>
      <div className="flex-1 p-2 space-y-4">
        {NODE_CATEGORIES.map((category) => (
          <div key={category.id}>
            <h3 className="px-2 mb-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              {category.label}
            </h3>
            <div className="space-y-1">
              {category.types.map((type) => {
                const def = NODE_DEFINITIONS[type];
                if (!def) return null;
                const Icon = ICONS[def.icon] || Type;
                return (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => onDragStart(e, type)}
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-2 rounded-md cursor-grab',
                      'bg-zinc-800/50 border border-zinc-700/50',
                      'hover:bg-zinc-800 hover:border-zinc-600',
                      'active:cursor-grabbing transition-colors'
                    )}
                  >
                    <div className={cn('p-1 rounded', def.color)}>
                      <Icon size={12} className="text-white" />
                    </div>
                    <span className="text-xs text-zinc-300">{def.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
