import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  hoverEffect = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white text-slate-900 shadow-xs transition-all',
        hoverEffect && 'hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {header && <div className="border-b border-slate-100 px-6 py-4">{header}</div>}
      {header || footer ? <div className="p-6">{children}</div> : children}
      {footer && <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-3.5 rounded-b-xl">{footer}</div>}
    </div>
  );
};

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6 border-b border-slate-100', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-display text-base font-bold leading-none tracking-tight text-slate-900', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-slate-500', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0 border-t border-slate-100 bg-slate-50/60 rounded-b-xl', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
