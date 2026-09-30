import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

type Tone = "primary" | "ink" | "ghost" | "glass";
type Size = "md" | "lg";

type BaseProps = {
  tone?: Tone;
  size?: Size;
  icon?: ReactNode | false;
  className?: string;
  children: ReactNode;
};

type ButtonAsLink = BaseProps & { href: string } & Omit<
    ComponentProps<typeof Link>,
    "href" | "children" | "className"
  >;
type ButtonAsButton = BaseProps & { href?: undefined } & Omit<
    ComponentProps<"button">,
    "children" | "className"
  >;

const tones: Record<Tone, { shell: string; orb: string }> = {
  primary: {
    shell: "bg-sky text-ink hover:bg-sky-deep hover:text-white shadow-sky",
    orb: "bg-ink/10 text-ink group-hover:bg-white/15 group-hover:text-white",
  },
  ink: {
    shell: "bg-ink text-white hover:bg-ink-700",
    orb: "bg-white/10 text-white",
  },
  ghost: {
    shell:
      "bg-transparent text-ink ring-1 ring-ink/12 hover:ring-ink/30 hover:bg-white",
    orb: "bg-ink/6 text-ink",
  },
  glass: {
    shell:
      "bg-white/8 text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-white/14",
    orb: "bg-white/12 text-white",
  },
};

const sizes: Record<Size, { shell: string; orb: string }> = {
  md: { shell: "h-11 pl-5 pr-1.5 text-[13.5px] gap-3", orb: "size-8" },
  lg: { shell: "h-13 pl-6 pr-2 text-[15px] gap-4", orb: "size-9" },
};

/**
 * Pill CTA with the "button-in-button" trailing orb. Pass `icon={false}` to
 * omit the orb; the padding then rebalances automatically.
 */
export function Button(props: ButtonAsLink | ButtonAsButton) {
  const {
    tone = "primary",
    size = "md",
    icon,
    className = "",
    children,
    ...rest
  } = props;
  const t = tones[tone];
  const s = sizes[size];
  const hasOrb = icon !== false;

  const cls = [
    "group relative inline-flex items-center rounded-full font-medium tracking-tight select-none",
    "transition-[background-color,color,box-shadow,transform] duration-500 ease-soft",
    "active:scale-[0.98] active:translate-y-px",
    t.shell,
    s.shell,
    hasOrb ? "" : size === "lg" ? "pr-6" : "pr-5",
    className,
  ].join(" ");

  const inner = (
    <>
      <span>{children}</span>
      {hasOrb && (
        <span
          aria-hidden
          className={[
            "grid place-items-center rounded-full transition-[transform,background-color] duration-500 ease-soft",
            "group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105",
            t.orb,
            s.orb,
          ].join(" ")}
        >
          {icon ?? <ArrowUpRight size={16} weight="bold" />}
        </span>
      )}
    </>
  );

  if ("href" in props && typeof props.href === "string") {
    const { href, ...linkRest } = rest as ButtonAsLink;
    return (
      <Link href={href} className={cls} {...linkRest}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as ComponentProps<"button">)}>
      {inner}
    </button>
  );
}
