import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const SheetContext = React.createContext({ open: false, setOpen: () => {} });

const Sheet = ({ open: controlledOpen, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value) => {
    if (onOpenChange) onOpenChange(value);
    if (controlledOpen === undefined) setInternalOpen(value);
  };
  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
};

const SheetTrigger = ({ asChild = false, children, ...props }) => {
  const { setOpen } = React.useContext(SheetContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(true);
      },
    });
  }
  return (
    <button type="button" onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  );
};

const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SheetContext);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        ref={ref}
        className={cn(
          "absolute top-0 h-full w-3/4 max-w-sm bg-white shadow-xl p-6 flex flex-col gap-4",
          side === "right" ? "right-0" : "left-0",
          className
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
});
SheetContent.displayName = "SheetContent";

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-gray-900", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
};
