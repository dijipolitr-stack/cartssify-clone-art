import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { CONFIG_UI } from "@/data/configurator";

type Props = {
  open: boolean;
  onBack: () => void; // konfigüratöre geri dön
  onFinish: () => void; // tüm akışı kapat (başarı sonrası)
  summary: string;
  productTitle: string;
  total: string;
  previewImage?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Status = "idle" | "sending" | "success" | "error";

export function QuoteDialog({
  open,
  onBack,
  onFinish,
  summary,
  productTitle,
  total,
  previewImage,
}: Props) {
  const { locale } = useI18n();
  const ui = CONFIG_UI[locale];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [touched, setTouched] = useState(false);

  // Dialog her açıldığında formu sıfırla.
  useEffect(() => {
    if (open) {
      setStatus("idle");
      setTouched(false);
    }
  }, [open]);

  const phoneOk = phone.trim().length >= 7;
  const emailOk = EMAIL_RE.test(email.trim());
  const canSend = phoneOk && emailOk && status !== "sending";

  const submit = async () => {
    setTouched(true);
    if (!phoneOk || !emailOk) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          summary,
          productTitle,
          total,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onBack(); }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {status === "success" ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background text-2xl">
              ✓
            </div>
            <h2 className="text-xl font-light tracking-tight mb-2">{ui.quoteTitle}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {ui.quoteSuccess}
            </p>
            <button
              onClick={onFinish}
              className="w-full bg-foreground text-background py-3.5 text-sm tracking-[0.25em] uppercase hover:opacity-90 transition"
            >
              {ui.quoteClose}
            </button>
          </div>
        ) : (
          <div className="max-h-[88vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-light tracking-tight">{ui.quoteTitle}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {ui.quoteIntro}
              </p>

              {/* Tasarım özeti */}
              <div className="mt-5 border border-border rounded-lg overflow-hidden">
                <div className="flex items-stretch gap-3 bg-muted/40 p-3">
                  {previewImage && (
                    <img
                      src={previewImage}
                      alt=""
                      className="h-16 w-16 object-contain bg-background rounded border border-border/60 flex-none"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{productTitle}</div>
                    {total && (
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {ui.total}: <span className="text-foreground">{total}</span>
                      </div>
                    )}
                  </div>
                </div>
                <details className="group">
                  <summary className="cursor-pointer list-none px-3 py-2 text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground select-none">
                    {ui.quoteDesignSummary} ▾
                  </summary>
                  <pre className="whitespace-pre-wrap px-3 pb-3 text-xs text-muted-foreground font-sans leading-relaxed">
                    {summary}
                  </pre>
                </details>
              </div>

              {/* İletişim bilgileri */}
              <div className="mt-5 space-y-3">
                <Field label={ui.quoteName}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={ui.quoteNamePh}
                    className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground transition"
                  />
                </Field>
                <Field label={ui.quotePhone} required invalid={touched && !phoneOk}>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder={ui.quotePhonePh}
                    className={`w-full border bg-background px-3 py-2.5 text-sm outline-none transition ${
                      touched && !phoneOk ? "border-red-500" : "border-border focus:border-foreground"
                    }`}
                  />
                </Field>
                <Field
                  label={ui.quoteEmail}
                  required
                  invalid={touched && !emailOk}
                  hint={touched && email.trim() && !emailOk ? ui.quoteEmailInvalid : undefined}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder={ui.quoteEmailPh}
                    className={`w-full border bg-background px-3 py-2.5 text-sm outline-none transition ${
                      touched && !emailOk ? "border-red-500" : "border-border focus:border-foreground"
                    }`}
                  />
                </Field>
              </div>

              <p className="mt-2 text-[11px] text-muted-foreground">{ui.quoteContactHint}</p>

              {status === "error" && (
                <p className="mt-3 text-xs text-red-600">{ui.quoteError}</p>
              )}

              <div className="mt-5 flex gap-2">
                <button
                  onClick={onBack}
                  className="px-4 py-3.5 text-sm tracking-[0.15em] uppercase border border-border hover:border-foreground transition"
                >
                  {ui.quoteBack}
                </button>
                <button
                  onClick={submit}
                  disabled={!canSend}
                  className="flex-1 bg-foreground text-background py-3.5 text-sm tracking-[0.2em] uppercase hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {status === "sending" ? ui.quoteSending : ui.quoteSend}
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  invalid,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  invalid?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground">
        {label}
        {required && <span className={invalid ? "text-red-500" : "text-foreground"}> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-red-600">{hint}</span>}
    </label>
  );
}
