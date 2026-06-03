import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-lg border border-stone-200 bg-white text-sm text-stone-800 placeholder:text-stone-400 " +
  "transition-all outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-50";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-9 px-3", base, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("h-9 px-3 cursor-pointer", base, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("min-h-24 px-3 py-2.5", base, props.className)} />;
}
