"use client";

import { motion, type Variants } from "motion/react";
import type { ComponentProps, ElementType, ReactNode } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 36, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease },
  },
};

const stagger = (delay: number, gap: number): Variants => ({
  hidden: {},
  show: { transition: { delayChildren: delay, staggerChildren: gap } },
});

type BlockTag = "div" | "section" | "ul" | "ol" | "li" | "article" | "header" | "footer";
type InlineTag = "div" | "li" | "article" | "span" | "p" | "h1" | "h2" | "h3" | "ul" | "ol";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: BlockTag;
  once?: boolean;
  amount?: number;
};

/** Single element fade-up on viewport entry. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
  once = true,
  amount = 0.25,
}: RevealProps) {
  const Tag = motion[as] as ElementType;
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={{
        hidden: revealItem.hidden,
        show: {
          ...(revealItem.show as object),
          transition: { duration: 0.9, ease, delay },
        },
      }}
    >
      {children}
    </Tag>
  );
}

type StaggerProps = Omit<RevealProps, "delay"> & {
  delay?: number;
  gap?: number;
};

/** Parent orchestrator: wrap children in <RevealChild /> for cascading entry. */
export function RevealGroup({
  children,
  className,
  delay = 0.05,
  gap = 0.09,
  as = "div",
  once = true,
  amount = 0.2,
}: StaggerProps) {
  const Tag = motion[as] as ElementType;
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={stagger(delay, gap)}
    >
      {children}
    </Tag>
  );
}

type ChildProps = {
  children: ReactNode;
  className?: string;
  as?: InlineTag;
} & Omit<ComponentProps<"div">, "children" | "className">;

export function RevealChild({ children, className, as = "div" }: ChildProps) {
  const Tag = motion[as] as ElementType;
  return (
    <Tag className={className} variants={revealItem}>
      {children}
    </Tag>
  );
}
