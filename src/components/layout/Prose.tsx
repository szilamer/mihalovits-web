/** Long-form legal text container with consistent typographic rhythm. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:text-ink [&_h3]:mt-8 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:text-ink [&_p]:mt-4 [&_p]:text-[15.5px] [&_p]:leading-relaxed [&_p]:text-muted [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:text-[15.5px] [&_ul]:leading-relaxed [&_ul]:text-muted [&_a]:text-ink [&_a]:underline [&_a]:decoration-sky [&_a]:decoration-2 [&_a]:underline-offset-4">
      {children}
    </div>
  );
}
