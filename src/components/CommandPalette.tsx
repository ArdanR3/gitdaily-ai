"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import {
  Search,
  LayoutDashboard,
  BookOpen,
  Settings,
  Shield,
  ScrollText,
  Swords,
  X,
} from "lucide-react";

export const OPEN_COMMAND_PALETTE_EVENT = "gitdaily:open-command";

export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
  }
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent);
    };
  }, []);

  function navigateTo(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/65" />
        <Dialog.Content className="fixed left-1/2 top-[15vh] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 border-4 border-black bg-[#FFFDF5] shadow-[10px_10px_0_0_#000] focus:outline-none">
          <Dialog.Title className="sr-only">Command Palette GitDaily AI</Dialog.Title>
          <Dialog.Description className="sr-only">
            Cari halaman dan bagian dashboard dengan cepat menggunakan keyboard.
          </Dialog.Description>

          <Command label="Navigasi cepat GitDaily AI" className="flex flex-col">
            <div className="flex items-center gap-2 border-b-3 border-black bg-[#FFD23F] px-3.5 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-black" aria-hidden="true" />
              <Command.Input
                placeholder="Ketik perintah atau tujuan halaman..."
                className="min-w-0 flex-1 bg-transparent font-mono text-base font-extrabold text-black placeholder-black/65 focus:outline-none sm:text-xs"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup Command Palette"
                className="nb-btn-sm inline-flex min-h-[36px] min-w-[36px] shrink-0 cursor-pointer items-center justify-center bg-white text-black sm:min-h-[28px] sm:min-w-[28px]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <Command.List className="max-h-[320px] overflow-y-auto p-2 overscroll-contain">
              <Command.Empty className="py-8 text-center font-mono text-xs font-bold text-black/65">
                Tidak ada perintah yang cocok.
              </Command.Empty>

              <Command.Group
                heading="Halaman Utama"
                className="px-1.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-black/60"
              >
                <Command.Item
                  value="dashboard home quest gitboy"
                  onSelect={() => navigateTo("/")}
                  className="mt-1 flex min-h-[44px] cursor-pointer items-center gap-2.5 border-2 border-transparent px-3 py-2 font-sans text-xs font-extrabold text-black aria-selected:border-black aria-selected:bg-[#88D498] aria-selected:shadow-[3px_3px_0_0_#000] sm:min-h-[36px]"
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Dashboard · Quest Hub &amp; GITBOY-01</span>
                </Command.Item>

                <Command.Item
                  value="materials codex pdf chunker edit"
                  onSelect={() => navigateTo("/materials")}
                  className="mt-1 flex min-h-[44px] cursor-pointer items-center gap-2.5 border-2 border-transparent px-3 py-2 font-sans text-xs font-extrabold text-black aria-selected:border-black aria-selected:bg-[#B8A9FA] aria-selected:shadow-[3px_3px_0_0_#000] sm:min-h-[36px]"
                >
                  <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Study Materials · Codex &amp; FIG 02</span>
                </Command.Item>

                <Command.Item
                  value="settings mode autopilot branch pr telegram"
                  onSelect={() => navigateTo("/settings")}
                  className="mt-1 flex min-h-[44px] cursor-pointer items-center gap-2.5 border-2 border-transparent px-3 py-2 font-sans text-xs font-extrabold text-black aria-selected:border-black aria-selected:bg-[#74B9FF] aria-selected:shadow-[3px_3px_0_0_#000] sm:min-h-[36px]"
                >
                  <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Settings · Mode, Jadwal WIB &amp; PR</span>
                </Command.Item>
              </Command.Group>

              <Command.Group
                heading="Bagian Dashboard"
                className="mt-2 px-1.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-black/60"
              >
                <Command.Item
                  value="daily quests suggestions ai"
                  onSelect={() => navigateTo("/#suggestions-heading")}
                  className="mt-1 flex min-h-[44px] cursor-pointer items-center gap-2.5 border-2 border-transparent px-3 py-2 font-sans text-xs font-extrabold text-black aria-selected:border-black aria-selected:bg-[#FFD23F] aria-selected:shadow-[3px_3px_0_0_#000] sm:min-h-[36px]"
                >
                  <Swords className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Today&apos;s Daily Quests</span>
                </Command.Item>

                <Command.Item
                  value="repository guard panel private locked"
                  onSelect={() => navigateTo("/#repo-guard-heading")}
                  className="mt-1 flex min-h-[44px] cursor-pointer items-center gap-2.5 border-2 border-transparent px-3 py-2 font-sans text-xs font-extrabold text-black aria-selected:border-black aria-selected:bg-[#FFD23F] aria-selected:shadow-[3px_3px_0_0_#000] sm:min-h-[36px]"
                >
                  <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Repository Guard Panel</span>
                </Command.Item>

                <Command.Item
                  value="activity log history chart streak"
                  onSelect={() => navigateTo("/#activity-log-heading")}
                  className="mt-1 flex min-h-[44px] cursor-pointer items-center gap-2.5 border-2 border-transparent px-3 py-2 font-sans text-xs font-extrabold text-black aria-selected:border-black aria-selected:bg-[#FFD23F] aria-selected:shadow-[3px_3px_0_0_#000] sm:min-h-[36px]"
                >
                  <ScrollText className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Quest Activity Log &amp; Chart</span>
                </Command.Item>
              </Command.Group>
            </Command.List>

            <div className="flex items-center justify-between border-t-2 border-black bg-[#F5F0E8] px-3.5 py-2 font-mono text-[10px] font-bold text-black/75">
              <span>↑↓ pilih · Enter buka</span>
              <span>Esc tutup · Ctrl+K</span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
