import { TopBar } from "@/components/TopBar";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  lastUpdated?: string;
  children: ReactNode;
};

/**
 * Shared layout for all legal/info pages (Privacy, Terms, FAQ, etc.).
 * Single max-width prose container, consistent typography, no fancy hero.
 */
export function LegalPageLayout({ eyebrow, title, lastUpdated, children }: Props) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <SiteNav variant="products-list" />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 md:py-24 w-full">
        <header className="mb-12 md:mb-16 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
            {eyebrow}
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight">{title}</h1>
          {lastUpdated && (
            <p className="mt-6 text-xs tracking-[0.2em] uppercase text-muted-foreground">
              {lastUpdated}
            </p>
          )}
        </header>
        <article className="prose-content text-base text-muted-foreground leading-relaxed space-y-6">
          {children}
        </article>
      </main>
      <SiteFooter topMargin />
    </div>
  );
}
