import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  helper,
  error,
  children
}: {
  label: string;
  htmlFor?: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm font-medium text-danger">{error}</p>
      ) : helper ? (
        <p className="text-xs leading-5 text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}

export function inputClass(error?: boolean) {
  return cn(
    "min-h-10 w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground shadow-none transition placeholder:text-muted-foreground",
    error ? "border-danger focus:border-danger" : "border-border focus:border-accent"
  );
}

export function textareaClass(error?: boolean) {
  return cn(
    "min-h-24 w-full resize-y rounded-md border bg-card px-3 py-2 text-sm text-foreground shadow-none transition placeholder:text-muted-foreground",
    error ? "border-danger focus:border-danger" : "border-border focus:border-accent"
  );
}
