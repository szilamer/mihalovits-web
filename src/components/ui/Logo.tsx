import Image from "next/image";
import Link from "next/link";
import { firm } from "@/content/site";

type LogoProps = {
  variant?: "light" | "dark" | "mark";
  className?: string;
  priority?: boolean;
  href?: string | null;
};

const sources = {
  light: { src: "/brand/logo-light.png", width: 757, height: 650 },
  dark: { src: "/brand/logo-dark.png", width: 757, height: 650 },
  mark: { src: "/brand/mark.png", width: 749, height: 514 },
} as const;

/**
 * Brand lockup extracted from the Google Business profile. `light` is the
 * wordmark for light backgrounds, `dark` inverts the wordmark for navy panels,
 * `mark` is the standalone double-arch monogram.
 */
export function Logo({
  variant = "light",
  className = "",
  priority = false,
  href = "/",
}: LogoProps) {
  const s = sources[variant];
  const img = (
    <Image
      src={s.src}
      alt={`${firm.brand} – ${firm.name} ${firm.title}`}
      width={s.width}
      height={s.height}
      priority={priority}
      className={className}
    />
  );
  if (href === null) return img;
  return (
    <Link href={href} aria-label="Főoldal" className="inline-flex shrink-0">
      {img}
    </Link>
  );
}
