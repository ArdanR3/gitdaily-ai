"use client";

import * as React from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/CommandPalette";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <CommandPalette />
      <Toaster
        position="top-right"
        closeButton
        toastOptions={{
          style: {
            border: "3px solid #000000",
            borderRadius: "0px",
            boxShadow: "5px 5px 0px 0px #000000",
            background: "#FFFDF5",
            color: "#000000",
            fontWeight: 800,
            fontSize: "12px",
          },
        }}
      />
    </MotionConfig>
  );
}
