
import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ size = 'md', className, ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div role="status" className={cn("animate-spin", sizeClasses[size], className)} {...props}>
      <div className="h-full w-full rounded-full border-4 border-primary border-r-transparent" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
