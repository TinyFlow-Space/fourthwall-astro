import { stegaClean } from "@sanity/client/stega";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(stegaClean(clsx(inputs)));
}
