"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "@phosphor-icons/react";

type Item = { q: string; a: string };

const ease = [0.32, 0.72, 0, 1] as const;

export function Accordion({
  items,
  defaultOpen = 0,
  tone = "light",
}: {
  items: Item[];
  defaultOpen?: number | null;
  tone?: "light" | "dark";
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const baseId = useId();
  const dark = tone === "dark";

  return (
    <div
      className={`divide-y overflow-hidden rounded-[1.75rem] p-1.5 ring-1 ${
        dark ? "divide-white/8 bg-white/[0.04] ring-white/10" : "divide-ink/6 bg-ink/[0.03] ring-ink/6"
      }`}
    >
      <div className={`divide-y rounded-[calc(1.75rem-0.375rem)] ${dark ? "divide-white/8 bg-ink-800" : "divide-ink/6 bg-white"}`}>
        {items.map((item, i) => {
          const isOpen = open === i;
          const panelId = `${baseId}-panel-${i}`;
          const btnId = `${baseId}-btn-${i}`;
          return (
            <div key={item.q}>
              <h3>
                <button
                  id={btnId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className={`group flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors duration-300 sm:px-8 sm:py-6 ${
                    dark ? "hover:bg-white/[0.03]" : "hover:bg-sky-mist"
                  }`}
                >
                  <span
                    className={`font-display text-[1.35rem] font-medium leading-snug tracking-tight sm:text-2xl ${
                      dark ? "text-white" : "text-ink"
                    }`}
                  >
                    {item.q}
                  </span>
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full ring-1 transition-[transform,background-color,color] duration-500 ease-soft ${
                      isOpen
                        ? "rotate-45 bg-sky text-ink ring-sky"
                        : dark
                          ? "text-white/70 ring-white/15 group-hover:bg-white/10"
                          : "text-ink/70 ring-ink/10 group-hover:bg-white"
                    }`}
                  >
                    <Plus size={16} weight="bold" />
                  </span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.55, ease }}
                    className="overflow-hidden"
                  >
                    <p
                      className={`max-w-[68ch] px-6 pb-7 text-[15px] leading-relaxed sm:px-8 ${
                        dark ? "text-white/65" : "text-muted"
                      }`}
                    >
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
