import { ImportPreview } from '@/components/import-preview';

export default function ImportPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">CSV import</h1>
        <p className="text-sm text-slate-600">
          Preview leads, validate phone numbers, and import valid rows only.
        </p>
      </div>
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        The `assigned_surveyor_email` column must contain the surveyor login email, for example
        `sameer@kabullondon.co.uk`. It cannot be a postcode or service area.
      </div>
      <ImportPreview />
    </div>
  );
}
