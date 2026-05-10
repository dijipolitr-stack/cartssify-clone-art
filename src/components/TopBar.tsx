import { useT } from "@/lib/i18n";

export function TopBar() {
  const t = useT();
  return (
    <div className="w-full bg-foreground text-background text-xs tracking-[0.2em] uppercase py-2 text-center">
      {t.topBar}
    </div>
  );
}
