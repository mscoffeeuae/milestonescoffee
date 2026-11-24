'use client';

import { useState, type FormEvent } from 'react';

interface ContactFormProps {
  isAr: boolean;
}

export function ContactForm({ isAr }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'invalid' | 'ready'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    if (!String(form.get('name') ?? '').trim()) next.name = isAr ? 'الاسم مطلوب' : 'Please enter your name';
    const email = String(form.get('email') ?? '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = isAr ? 'أدخل بريداً إلكترونياً صحيحاً' : 'Please enter a valid email';
    if (!String(form.get('message') ?? '').trim()) next.message = isAr ? 'الرسالة مطلوبة' : 'Please write a message';
    setErrors(next);
    setStatus(Object.keys(next).length ? 'invalid' : 'ready');
  };

  const field = 'mt-1 w-full rounded border border-black/20 bg-white px-3 py-2.5 text-[var(--color-brand-espresso,#3B1F0E)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-gold,#C9A87C)]';
  const label = 'block text-sm font-semibold text-[var(--color-brand-espresso,#3B1F0E)]';

  return (
    <form noValidate onSubmit={onSubmit} className="rounded-md bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-[var(--color-brand-espresso,#3B1F0E)]">
        {isAr ? 'أرسل رسالة' : 'Send a message'}
      </h2>

      <div className="mt-4">
        <label htmlFor="contact-name" className={label}>{isAr ? 'الاسم' : 'Name'}</label>
        <input id="contact-name" name="name" autoComplete="name" className={field} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'contact-name-err' : undefined} />
        {errors.name && <p id="contact-name-err" className="mt-1 text-xs text-red-700">{errors.name}</p>}
      </div>

      <div className="mt-4">
        <label htmlFor="contact-email" className={label}>{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
        <input id="contact-email" name="email" type="email" autoComplete="email" className={field} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'contact-email-err' : undefined} />
        {errors.email && <p id="contact-email-err" className="mt-1 text-xs text-red-700">{errors.email}</p>}
      </div>

      <div className="mt-4">
        <label htmlFor="contact-topic" className={label}>{isAr ? 'الموضوع' : 'Topic'}</label>
        <select id="contact-topic" name="topic" className={field}>
          <option value="general">{isAr ? 'استفسار عام' : 'General question'}</option>
          <option value="catering">{isAr ? 'التموين والفعاليات' : 'Catering and events'}</option>
          <option value="feedback">{isAr ? 'ملاحظات' : 'Feedback'}</option>
          <option value="careers">{isAr ? 'الوظائف' : 'Careers'}</option>
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="contact-message" className={label}>{isAr ? 'الرسالة' : 'Message'}</label>
        <textarea id="contact-message" name="message" rows={5} className={field} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'contact-message-err' : undefined} />
        {errors.message && <p id="contact-message-err" className="mt-1 text-xs text-red-700">{errors.message}</p>}
      </div>

      <button type="submit" className="mt-5 min-h-[46px] rounded-full bg-[var(--color-brand-espresso,#3B1F0E)] px-6 text-sm font-semibold text-[var(--color-brand-ivory,#F5F0E8)] transition hover:bg-[var(--color-brand-bronze,#A0784A)]">
        {isAr ? 'إرسال الرسالة' : 'Send message'}
      </button>

      <p role="status" className="mt-3 min-h-[1.4em] text-sm font-semibold text-green-800">
        {status === 'ready' && (isAr ? 'شكراً. إرسال الرسائل غير متصل بعد.' : 'Thanks. Sending is not connected yet.')}
      </p>
    </form>
  );
}
