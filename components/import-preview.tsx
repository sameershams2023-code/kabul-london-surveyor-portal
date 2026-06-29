'use client';

import { useMemo, useState } from 'react';
import { Upload } from 'lucide-react';

const requiredColumns = [
  'customer_name',
  'phone',
  'email',
  'property_address',
  'postcode',
  'service_type',
  'assigned_surveyor_email'
];

function parseCsv(text: string) {
  const records: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field.trim());
      field = '';
      if (row.some(Boolean)) records.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some(Boolean)) records.push(row);

  const [headers = [], ...lines] = records;
  return lines.map((line) =>
    Object.fromEntries(headers.map((header, index) => [header.trim().toLowerCase(), cleanValue(line[index] ?? '')]))
  );
}

function isPhone(value = '') {
  return /^\+?[0-9\s-]{10,18}$/.test(value);
}

function isEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanValue(value: string) {
  const cleaned = value.trim().replace(/^"|"$/g, '').trim();
  return cleaned.toUpperCase() === 'N/A' ? '' : cleaned;
}

function normalisePhone(phone: string) {
  const compact = phone.replace(/[^\d+]/g, '');
  if (compact.startsWith('07')) return `+44${compact.slice(1)}`;
  if (compact.startsWith('7')) return `+44${compact}`;
  return compact;
}

function normaliseRows(rows: Record<string, string>[]) {
  return rows.map((row) => ({
    ...row,
    phone: normalisePhone(row.phone ?? ''),
    email: cleanValue(row.email ?? ''),
    assigned_surveyor_email: cleanValue(row.assigned_surveyor_email ?? '').toLowerCase()
  }));
}

function getRowErrors(row: Record<string, string>) {
  const errors: string[] = [];
  requiredColumns.forEach((column) => {
    if (!row[column] && column !== 'email') errors.push(`Missing ${column}`);
  });
  if (row.phone && !isPhone(row.phone)) errors.push('Bad phone');
  if (row.email && !isEmail(row.email)) errors.push('Bad email');
  if (row.assigned_surveyor_email && !isEmail(row.assigned_surveyor_email)) {
    errors.push('Bad surveyor email');
  }
  return errors;
}

export function ImportPreview() {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [filename, setFilename] = useState('');
  const [result, setResult] = useState<string>('');

  const validation = useMemo(() => {
    const valid = rows.filter((row) => getRowErrors(row).length === 0);
    return {
      valid,
      failed: rows.length - valid.length,
      missingColumns: requiredColumns.filter((column) => rows.length && !(column in rows[0]))
    };
  }, [rows]);

  return (
    <div className="space-y-5">
      <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-line bg-white px-4 py-6 text-center hover:border-brand">
        <Upload className="mb-3 h-7 w-7 text-brand" />
        <span className="font-semibold text-ink">Upload CSV for preview</span>
        <span className="text-sm text-slate-500">{filename || 'Required columns are checked before import.'}</span>
        <input
          className="sr-only"
          type="file"
          accept=".csv,text/csv"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setFilename(file.name);
            setRows(normaliseRows(parseCsv(await file.text())));
          }}
        />
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-line bg-white p-4">
          <div className="text-sm text-slate-500">Valid rows</div>
          <div className="text-2xl font-semibold text-ink">{validation.valid.length}</div>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <div className="text-sm text-slate-500">Failed rows</div>
          <div className="text-2xl font-semibold text-ink">{validation.failed}</div>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <div className="text-sm text-slate-500">Missing columns</div>
          <div className="text-sm font-semibold text-ink">{validation.missingColumns.join(', ') || 'None'}</div>
        </div>
      </div>

      {rows.length > 0 ? (
        <>
          <div className="flex flex-col gap-3 rounded-md border border-line bg-white p-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-600">{result || 'Only valid rows will be imported.'}</div>
            <button
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!validation.valid.length}
              onClick={async () => {
                const response = await fetch('/api/import', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ rows: validation.valid })
                });
                const body = await response.json().catch(() => null);
                if (!response.ok) {
                  setResult(body?.error ?? 'Import failed.');
                  return;
                }
                setResult(`Imported ${body.imported} row(s). Failed ${body.failed} row(s).`);
              }}
              type="button"
            >
              Import valid rows
            </button>
          </div>

          <div className="overflow-x-auto rounded-md border border-line bg-white">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-panel text-left text-xs font-semibold uppercase text-slate-600">
                <tr>
                  {requiredColumns.map((column) => (
                    <th key={column} className="px-3 py-2">
                      {column}
                    </th>
                  ))}
                  <th className="px-3 py-2">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.slice(0, 25).map((row, index) => {
                  const errors = getRowErrors(row);
                  return (
                    <tr key={`${row.phone}-${index}`}>
                    {requiredColumns.map((column) => (
                      <td key={column} className="px-3 py-2">
                        {row[column]}
                      </td>
                    ))}
                    <td className="px-3 py-2 font-semibold">{errors.length ? errors.join(', ') : 'Ready'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
