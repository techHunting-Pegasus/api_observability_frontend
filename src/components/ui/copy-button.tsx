"use client";
import { Check, Copy } from "lucide-react";
import { useCopy } from "@/hooks/use-copy";
import { Button, type ButtonProps } from "./button";

export function CopyButton({ text, label = "Copy", copiedLabel = "Copied", ...rest }: { text: string; label?: string; copiedLabel?: string } & Omit<ButtonProps, "onClick" | "children">) {
  const { copied, copy } = useCopy();
  return (
    <Button size="sm" {...rest} onClick={() => void copy(text)}>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </Button>
  );
}
