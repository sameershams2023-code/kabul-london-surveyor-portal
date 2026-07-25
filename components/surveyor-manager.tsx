'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, Mail, MapPin, Phone, Plus, Search, UserRoundPlus } from 'lucide-react';
import type { Surveyor } from '@/lib/types';

type ServerAction = (formData: FormData) => void | Promise<void>;

export function SurveyorManager({
  surveyors,
  createSurveyorAction,
  updateSurveyorAction,
  selectedId,
  canSubmit
}: {
  surveyors: Surveyor[];
  createSurveyorAction: ServerAction;
  updateSurveyorAction: ServerAction;
  selectedId?: string | null;
  canSubmit: boolean;
}) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'create' | 'edit'>(selectedId ? 'edit' : surveyors.length ? 'edit' : 'create');
  const [activeSurveyorId, setActiveSurveyorId] = useState(selectedId ?? surveyors[0]?.id ?? null);

  const filteredSurveyors = useMemo(() => {
    const cleaned = query.trim().toLowerCase();

    if (!cleaned) {
      return surveyors;
    }

    return surveyors.filter((surveyor) =>
      [surveyor.full_name, surveyor.email, surveyor.phone, surveyor.service_area, surveyor.tidycal_link]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(cleaned)
    );
  }, [query, surveyors]);

  const activeSurveyor = surveyors.find((surveyor) => surveyor.id === activeSurveyorId) ?? surveyors[0] ?? null;

  function selectSurveyor(id: string) {
    setActiveSurveyorId(id);
    setMode('edit');
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-3">
        <div className="rounded-md border border-line bg-white p-3 shadow-soft">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-md border border-line py-2 pl-9 pr-3 text-sm font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search surveyors..."
              type="search"
              value={query}
            />
          </div>
          <button
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-extrabold text-white"
            onClick={() => setMode('create')}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add new surveyor
          </button>
        </div>

        <div className="space-y-2">
          {filteredSurveyors.length ? (
            filteredSurveyors.map((surveyor) => (
              <button
                className={`w-full rounded-md border bg-white p-4 text-left shadow-soft transition ${
                  mode === 'edit' && activeSurveyorId === surveyor.id
                    ? 'border-brand ring-2 ring-brand/20'
                    : 'border-line hover:border-brand'
                }`}
                key={surveyor.id}
                onClick={() => selectSurveyor(surveyor.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-ink">{surveyor.full_name}</div>
                    <div className="mt-1 text-sm font-medium text-slate-600">{surveyor.email}</div>
                  </div>
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-extrabold ${
                      surveyor.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {surveyor.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm font-medium text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {surveyor.phone ?? 'No phone'}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {surveyor.service_area ?? 'No service area'}
                  </span>
                  <span className="inline-flex items-center gap-2 text-brand">
                    <CalendarCheck className="h-4 w-4" />
                    {surveyor.tidycal_link ? 'TidyCal set' : 'TidyCal not set'}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-md border border-line bg-white p-5 text-sm font-medium text-slate-500">
              No surveyors found.
            </div>
          )}
        </div>
      </aside>

      <section className="rounded-md border border-line bg-white p-5 shadow-soft">
        {mode === 'create' ? (
          <CreateSurveyorForm action={createSurveyorAction} canSubmit={canSubmit} />
        ) : activeSurveyor ? (
          <EditSurveyorForm action={updateSurveyorAction} canSubmit={canSubmit} surveyor={activeSurveyor} />
        ) : (
          <CreateSurveyorForm action={createSurveyorAction} canSubmit={canSubmit} />
        )}
      </section>
    </div>
  );
}

function CreateSurveyorForm({ action, canSubmit }: { action: ServerAction; canSubmit: boolean }) {
  return (
    <div>
      <PanelHeader
        icon={<UserRoundPlus className="h-5 w-5" />}
        title="Add surveyor login"
        subtitle="Create their app login and profile in one place."
      />
      <form action={action} className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Full name" name="full_name" placeholder="Sameer Shams" required />
        <Field label="Email login" name="email" placeholder="sameer@kabullondon.co.uk" type="email" required />
        <Field label="Temporary password" name="password" placeholder="Set a strong password" type="password" required />
        <Field label="Phone" name="phone" placeholder="+447..." />
        <Field label="Service area" name="service_area" placeholder="West London" />
        <Field label="TidyCal booking link" name="tidycal_link" placeholder="https://tidycal.com/..." />
        <div className="md:col-span-2">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-action px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50"
            disabled={!canSubmit}
            type="submit"
          >
            <Plus className="h-4 w-4" />
            Create surveyor
          </button>
        </div>
      </form>
    </div>
  );
}

function EditSurveyorForm({
  action,
  canSubmit,
  surveyor
}: {
  action: ServerAction;
  canSubmit: boolean;
  surveyor: Surveyor;
}) {
  return (
    <div>
      <PanelHeader
        icon={<CheckCircle2 className="h-5 w-5" />}
        title={surveyor.full_name}
        subtitle="Edit login details, phone, area, booking link, and active status."
      />
      <form action={action} className="mt-5 grid gap-4 md:grid-cols-2">
        <input name="surveyor_id" type="hidden" value={surveyor.id} />
        <input name="user_id" type="hidden" value={surveyor.user_id ?? ''} />
        <Field defaultValue={surveyor.full_name} label="Full name" name="full_name" placeholder="Sameer Shams" required />
        <Field defaultValue={surveyor.email} label="Email login" name="email" placeholder="sameer@kabullondon.co.uk" type="email" required />
        <Field defaultValue={surveyor.phone ?? ''} label="Phone" name="phone" placeholder="+447..." />
        <Field defaultValue={surveyor.service_area ?? ''} label="Service area" name="service_area" placeholder="West London" />
        <Field
          defaultValue={surveyor.tidycal_link ?? ''}
          label="TidyCal booking link"
          name="tidycal_link"
          placeholder="https://tidycal.com/..."
        />
        <Field label="New password" name="password" placeholder="Leave blank to keep same password" type="password" />
        <label className="flex items-center gap-3 rounded-md border border-line bg-panel p-3 md:col-span-2">
          <input className="h-5 w-5 rounded border-line" defaultChecked={surveyor.active} name="active" type="checkbox" value="true" />
          <span>
            <span className="block text-sm font-extrabold text-ink">Active surveyor</span>
            <span className="block text-sm font-medium text-slate-600">Inactive surveyors stay saved but can be kept out of daily work.</span>
          </span>
        </label>
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-action px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50"
            disabled={!canSubmit}
            type="submit"
          >
            Save changes
          </button>
          {surveyor.tidycal_link ? (
            <a
              className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-3 text-sm font-extrabold text-ink hover:border-brand hover:text-brand"
              href={surveyor.tidycal_link}
              rel="noreferrer"
              target="_blank"
            >
              <CalendarCheck className="h-4 w-4" />
              Open TidyCal
            </a>
          ) : null}
          <a
            className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-3 text-sm font-extrabold text-ink hover:border-brand hover:text-brand"
            href={`mailto:${surveyor.email}`}
          >
            <Mail className="h-4 w-4" />
            Email surveyor
          </a>
        </div>
      </form>
    </div>
  );
}

function PanelHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand text-white">{icon}</div>
      <div>
        <h2 className="text-xl font-extrabold text-ink">{title}</h2>
        <p className="text-sm font-medium text-slate-600">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  type = 'text',
  required = false
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-extrabold text-ink">{label}</span>
      <input
        className="w-full rounded-md border border-line px-3 py-3 text-base font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}
