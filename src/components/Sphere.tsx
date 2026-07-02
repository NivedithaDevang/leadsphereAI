/**
 * Brand logo mark — lime tile with a dark inner sphere.
 */
export function Sphere({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex size-8 items-center justify-center rounded-lg bg-brand ${className}`}
    >
      <div className="size-4 rounded-full bg-background" />
    </div>
  );
}
