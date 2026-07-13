import { useEffect, useState, type ReactNode } from "react";
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
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
type Status = "idle" | "sending" | "success" | "error";

// Yüklenen görsel: base64 (data URL prefixsiz) e-posta ekine gider + küçük önizleme.
type UploadedImage = { filename: string; content: string; type: string; dataUrl: string };

function readImage(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const dataUrl = String(fr.result);
      const content = dataUrl.split(",")[1] ?? "";
      resolve({ filename: file.name, content, type: file.type || "application/octet-stream", dataUrl });
    };
    fr.onerror = () => reject(new Error("read"));
    fr.readAsDataURL(file);
  });
}

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

  // Markalama talebi
  const [logoWanted, setLogoWanted] = useState(false);
  const [wrapWanted, setWrapWanted] = useState(false);
  const [logoImg, setLogoImg] = useState<UploadedImage | null>(null);
  const [wrapImg, setWrapImg] = useState<UploadedImage | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Dialog her açıldığında formu sıfırla.
  useEffect(() => {
    if (open) {
      setStatus("idle");
      setTouched(false);
      setLogoWanted(false);
      setWrapWanted(false);
      setLogoImg(null);
      setWrapImg(null);
      setFileError(null);
    }
  }, [open]);

  const phoneOk = phone.trim().length >= 7;
  const emailOk = EMAIL_RE.test(email.trim());
  const canSend = phoneOk && emailOk && status !== "sending";

  const pickFile = async (file: File | undefined, set: (v: UploadedImage | null) => void) => {
    setFileError(null);
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setFileError(ui.quoteFileTooBig);
      return;
    }
    try {
      set(await readImage(file));
    } catch {
      setFileError(ui.quoteError);
    }
  };

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
          logoWanted,
          wrapWanted,
          logoImage: logoWanted && logoImg ? { filename: logoImg.filename, content: logoImg.content, type: logoImg.type } : null,
          wrapImage: wrapWanted && wrapImg ? { filename: wrapImg.filename, content: wrapImg.content, type: wrapImg.type } : null,
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

              {/* Markalama — logo & giydirme talebi */}
              <div className="mt-6">
                <p className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
                  {ui.quoteBranding}
                </p>

                <YesNo
                  question={ui.quoteLogoQ}
                  value={logoWanted}
                  yes={ui.quoteEvet}
                  no={ui.quoteHayir}
                  onChange={(v) => {
                    setLogoWanted(v);
                    if (!v) setLogoImg(null);
                  }}
                />
                {logoWanted && (
                  <FilePicker
                    label={ui.quoteUploadLogo}
                    chooseText={ui.quoteFileChoose}
                    image={logoImg}
                    onPick={(f) => pickFile(f, setLogoImg)}
                    onClear={() => setLogoImg(null)}
                  />
                )}

                <div className="mt-4">
                  <YesNo
                    question={ui.quoteWrapQ}
                    value={wrapWanted}
                    yes={ui.quoteEvet}
                    no={ui.quoteHayir}
                    onChange={(v) => {
                      setWrapWanted(v);
                      if (!v) setWrapImg(null);
                    }}
                  />
                  {wrapWanted && (
                    <FilePicker
                      label={ui.quoteUploadWrap}
                      chooseText={ui.quoteFileChoose}
                      image={wrapImg}
                      onPick={(f) => pickFile(f, setWrapImg)}
                      onClear={() => setWrapImg(null)}
                    />
                  )}
                </div>

                {fileError && <p className="mt-2 text-[11px] text-red-600">{fileError}</p>}
              </div>

              {/* İletişim bilgileri */}
              <div className="mt-6 space-y-3">
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

function YesNo({
  question,
  value,
  yes,
  no,
  onChange,
}: {
  question: string;
  value: boolean;
  yes: string;
  no: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-foreground">{question}</span>
      <div className="flex-none inline-flex rounded-md border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-3 py-1.5 text-xs transition ${!value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          {no}
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-3 py-1.5 text-xs transition ${value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          {yes}
        </button>
      </div>
    </div>
  );
}

function FilePicker({
  label,
  chooseText,
  image,
  onPick,
  onClear,
}: {
  label: string;
  chooseText: string;
  image: UploadedImage | null;
  onPick: (f: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div className="mt-2 rounded-md border border-dashed border-border p-3">
      {image ? (
        <div className="flex items-center gap-3">
          <img src={image.dataUrl} alt="" className="h-12 w-12 object-contain bg-background rounded border border-border/60 flex-none" />
          <span className="min-w-0 flex-1 truncate text-xs text-foreground">{image.filename}</span>
          <button type="button" onClick={onClear} className="flex-none text-[11px] text-red-600 hover:underline">
            ✕
          </button>
        </div>
      ) : (
        <label className="flex flex-col gap-1 cursor-pointer">
          <span className="text-[11px] text-muted-foreground">{label}</span>
          <span className="inline-flex w-max items-center gap-2 rounded border border-border px-3 py-1.5 text-xs hover:border-foreground transition">
            {chooseText}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
        </label>
      )}
    </div>
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
  children: ReactNode;
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
