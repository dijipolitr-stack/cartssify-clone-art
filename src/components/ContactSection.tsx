import { useState, type FormEvent } from "react";
import { useT } from "@/lib/i18n";

/**
 * WhatsApp number for the contact form.
 *
 * TODO(rumicarts): replace this placeholder with the real WhatsApp business
 * number. Format: digits only, no `+`, no spaces (e.g. "905551234567").
 * The form will refuse to submit while this placeholder is in place — see
 * the validation inside `handleSubmit` below.
 */
const WHATSAPP_NUMBER = "905555555555"; // PLACEHOLDER

const PLACEHOLDER_PATTERN = /^9055555/;

type SubjectKey = "quote" | "custom" | "question";

export function ContactSection() {
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<SubjectKey>("quote");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isPlaceholderNumber = PLACEHOLDER_PATTERN.test(WHATSAPP_NUMBER);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !message.trim()) {
      setError(t.contact.form.required);
      return;
    }

    const subjectLabel = t.contact.form.subjects[subject];
    const lines = [
      `Hi Rumicarts — ${subjectLabel}.`,
      "",
      `Name: ${name}`,
      email.trim() ? `Email: ${email}` : null,
      "",
      message,
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join("\n"));
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
    // Open in a new tab; fall back to same-tab navigation if popups blocked.
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = url;
    }
  }

  return (
    <section id="contact" className="py-24 md:py-36 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
            {t.contact.eyebrow}
          </p>
          <h2 className="mt-6 text-4xl md:text-6xl font-light tracking-tight leading-tight">
            {t.contact.title}
          </h2>
          <p className="mt-6 text-base text-muted-foreground max-w-xl mx-auto">
            {t.contact.body}
          </p>
          <p className="mt-4 text-xs tracking-[0.2em] uppercase text-muted-foreground">
            {t.contact.hours}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-14 space-y-8" noValidate>
          {/* Name + Email row */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="contact-name"
                className="block text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2"
              >
                {t.contact.form.name}
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.contact.form.namePlaceholder}
                required
                className="w-full bg-transparent border-b border-border focus:border-foreground focus:outline-none py-3 text-base placeholder:text-muted-foreground/60 transition"
              />
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="block text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2"
              >
                {t.contact.form.email}
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.contact.form.emailPlaceholder}
                className="w-full bg-transparent border-b border-border focus:border-foreground focus:outline-none py-3 text-base placeholder:text-muted-foreground/60 transition"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs tracking-[0.25em] uppercase text-muted-foreground mb-3">
              {t.contact.form.subject}
            </label>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(t.contact.form.subjects) as SubjectKey[]).map((key) => {
                const active = subject === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSubject(key)}
                    aria-pressed={active}
                    className={`px-4 py-2 text-xs tracking-[0.2em] uppercase border transition ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {t.contact.form.subjects[key]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="contact-message"
              className="block text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2"
            >
              {t.contact.form.message}
            </label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.contact.form.messagePlaceholder}
              rows={5}
              required
              className="w-full bg-transparent border-b border-border focus:border-foreground focus:outline-none py-3 text-base placeholder:text-muted-foreground/60 transition resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {isPlaceholderNumber && import.meta.env.DEV && (
            <p className="text-xs text-muted-foreground border border-dashed border-border px-4 py-3">
              ⚠️ Placeholder WhatsApp number active. Replace
              {" "}<code className="text-foreground">WHATSAPP_NUMBER</code>{" "}
              in <code className="text-foreground">src/components/ContactSection.tsx</code> before going live.
            </p>
          )}

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-3 bg-foreground text-background px-8 py-4 text-sm tracking-[0.25em] uppercase hover:opacity-90 transition"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="currentColor"
              >
                <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.4-1.4-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4 0-.1-.2-.2-.5-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.5.8 3.2 1.3 4.9 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3C3.9 14.9 3.4 13.5 3.4 12 3.4 7.3 7.3 3.4 12 3.4S20.6 7.3 20.6 12 16.7 20 12 20z" />
              </svg>
              {t.contact.form.submit}
            </button>
            <p className="text-xs text-muted-foreground max-w-xs">
              {t.contact.form.hint}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
