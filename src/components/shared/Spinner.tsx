import { cn } from '../../utils/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-purple-500',
        className
      )}
    />
  );
}
