import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Copy, Mail, Phone, Sun, X } from 'lucide-react';
import { btnPrimary, btnSecondary } from './shared';
import { SOLAR_SECTOR_OPTIONS } from './solarContent';
import type { SummaryLine } from './SolarSimulator';

export interface SolarQuoteRequest {
  sector?: string;
  summary?: SummaryLine[];
}

interface SolarQuoteModalProps {
  request: SolarQuoteRequest | null;
  onClose: () => void;
  contactEmail: string;
  phoneDisplay: string;
  phoneHref: string;
}

const inputClass =
  'mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-afro-ink outline-none transition placeholder:text-slate-400 focus:border-afro-blue focus:ring-4 focus:ring-afro-blue/10';
const labelClass = 'text-sm font-medium text-slate-700';

export function SolarQuoteModal({ request, onClose, contactEmail, phoneDisplay, phoneHref }: SolarQuoteModalProps) {
  return (
    <AnimatePresence>
      {request && (
        <QuoteDialog
          request={request}
          onClose={onClose}
          contactEmail={contactEmail}
          phoneDisplay={phoneDisplay}
          phoneHref={phoneHref}
        />
      )}
    </AnimatePresence>
  );
}

function QuoteDialog({ request, onClose, contactEmail, phoneDisplay, phoneHref }: SolarQuoteModalProps & { request: SolarQuoteRequest }) {
  const uid = useId();
  const firstField = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', sector: request.sector ?? '', message: '' });
  const [error, setError] = useState<string | null>(null);
  const [sentText, setSentText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstField.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim()) {
      setError('Indiquez votre nom et la ville du projet.');
      return;
    }
    if (form.phone.replace(/\D/g, '').length < 9) {
      setError('Indiquez un numéro de téléphone valide pour que nous puissions vous rappeler.');
      return;
    }
    setError(null);

    const lines = [
      'Bonjour,',
      '',
      'Je souhaite recevoir un devis pour une installation de panneaux solaires.',
      '',
      `Nom : ${form.name.trim()}`,
      `Téléphone : ${form.phone.trim()}`,
      ...(form.email.trim() ? [`E-mail : ${form.email.trim()}`] : []),
      `Ville : ${form.city.trim()}`,
      ...(form.sector ? [`Type de projet : ${form.sector}`] : []),
      ...(request.summary?.length ? ['', 'Simulation réalisée sur le site :', ...request.summary.map((l) => `- ${l.label} : ${l.value}`)] : []),
      ...(form.message.trim() ? ['', form.message.trim()] : []),
    ];
    const text = lines.join('\n');
    const subject = `Demande de devis solaire${form.sector ? ` – ${form.sector}` : ''} – ${form.city.trim()}`;
    setSentText(text);
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  };

  const copyRequest = async () => {
    if (!sentText) return;
    try {
      await navigator.clipboard.writeText(sentText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-afro-navy/60 backdrop-blur-sm"
        aria-hidden="true"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:rounded-[1.75rem]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6 sm:px-8">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF3D7] text-[#B7791F]">
              <Sun className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id={`${uid}-title`} className="font-display text-xl font-bold text-afro-ink">Demande de devis solaire</h2>
              <p className="text-sm text-slate-500">Étude, fourniture et installation</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="-mr-2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-afro-ink">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 sm:px-8">
          {sentText ? (
            <div className="py-2 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-afro-green/20 text-afro-green-dark">
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-afro-ink">Votre demande est prête</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                Votre messagerie s'est ouverte avec la demande adressée à <span className="font-semibold text-afro-ink">{contactEmail}</span>.
                Envoyez le message : notre équipe vous recontacte pour étudier votre projet.
              </p>
              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
                <p className="text-sm font-semibold text-afro-ink">Votre messagerie ne s'est pas ouverte ?</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={copyRequest} className={`${btnSecondary} h-11 px-4`}>
                    <Copy className="h-4 w-4 text-afro-blue" aria-hidden="true" /> {copied ? 'Demande copiée' : 'Copier la demande'}
                  </button>
                  <a href={phoneHref} className={`${btnSecondary} h-11 px-4`}>
                    <Phone className="h-4 w-4 text-afro-blue" aria-hidden="true" /> {phoneDisplay}
                  </a>
                </div>
              </div>
              <button type="button" onClick={onClose} className={`${btnPrimary} mt-6`}>Fermer</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {request.summary && request.summary.length > 0 && (
                <div className="rounded-xl bg-afro-blue-50 p-4">
                  <p className="text-sm font-semibold text-afro-ink">Votre simulation sera jointe à la demande</p>
                  <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-[13px] sm:grid-cols-2">
                    {request.summary.slice(0, 6).map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-3 sm:block">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="text-right font-medium text-afro-ink sm:text-left">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${uid}-name`} className={labelClass}>Nom complet *</label>
                  <input ref={firstField} id={`${uid}-name`} autoComplete="name" value={form.name} onChange={update('name')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor={`${uid}-phone`} className={labelClass}>Téléphone *</label>
                  <input id={`${uid}-phone`} type="tel" autoComplete="tel" placeholder="06 00 00 00 00" value={form.phone} onChange={update('phone')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor={`${uid}-email`} className={labelClass}>E-mail</label>
                  <input id={`${uid}-email`} type="email" autoComplete="email" value={form.email} onChange={update('email')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor={`${uid}-city`} className={labelClass}>Ville du projet *</label>
                  <input id={`${uid}-city`} autoComplete="address-level2" placeholder="Meknès" value={form.city} onChange={update('city')} className={inputClass} />
                </div>
              </div>
              <div>
                <label htmlFor={`${uid}-sector`} className={labelClass}>Type de projet</label>
                <select id={`${uid}-sector`} value={form.sector} onChange={update('sector')} className={inputClass}>
                  <option value="">Sélectionnez</option>
                  {SOLAR_SECTOR_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor={`${uid}-message`} className={labelClass}>Votre projet</label>
                <textarea
                  id={`${uid}-message`}
                  rows={3}
                  placeholder="Toiture ou terrain disponible, consommation, besoin de batteries…"
                  value={form.message}
                  onChange={update('message')}
                  className={`${inputClass} h-auto resize-none py-3`}
                />
              </div>

              {error && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</p>}

              <button type="submit" className={`${btnPrimary} w-full`}>
                <Mail className="h-4 w-4" aria-hidden="true" /> Envoyer ma demande
              </button>
              <p className="text-center text-xs text-slate-500">
                La demande s'ouvre dans votre messagerie, adressée à {contactEmail}. Vous pouvez aussi nous appeler au{' '}
                <a href={phoneHref} className="font-semibold text-afro-blue">{phoneDisplay}</a>.
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
