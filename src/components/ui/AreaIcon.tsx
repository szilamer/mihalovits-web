import {
  Briefcase,
  Buildings,
  Diamond,
  FirstAid,
  Scales,
  ShieldCheck,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { IconProps } from "@phosphor-icons/react";
import type { IconName } from "@/content/schema";

const map: Record<IconName, React.ComponentType<IconProps>> = {
  buildings: Buildings,
  briefcase: Briefcase,
  "first-aid": FirstAid,
  "shield-check": ShieldCheck,
  "users-three": UsersThree,
  scales: Scales,
  diamond: Diamond,
};

export function AreaIcon({ name, ...props }: { name: IconName } & IconProps) {
  const Cmp = map[name];
  return <Cmp weight="light" {...props} />;
}
