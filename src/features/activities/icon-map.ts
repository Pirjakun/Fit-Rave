import {
  Footprints,
  Dumbbell,
  Waves,
  Music4,
  CircleDot,
  Volleyball,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Footprints,
  Dumbbell,
  Waves,
  Music4,
  CircleDot,
  Volleyball,
};

export function getActivityIcon(name: string): LucideIcon {
  return iconMap[name] ?? Dumbbell;
}
