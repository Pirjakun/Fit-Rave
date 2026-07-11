export type ActivityCategory = "segmented" | "open";

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  description: string;
  icon: string;
  location: string;
  day: 1 | 2;
  timeWindow: string;
  quota: number | null;
  quotaTaken: number;
  tags: string[];
}
