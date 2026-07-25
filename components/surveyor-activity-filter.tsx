'use client';

import { useMemo, useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import type { LeadStatusHistory, Surveyor } from '@/lib/types';

function actorName(item: LeadStatusHistory) {
  return item.changed_by_surveyor?.full_name ?? item.changed_by_email ?? item.changed_by ?? 'Unknown user';
}

export function SurveyorActivityFilter({
  history,
  surveyors
}: {
  history: LeadStatusHistory[];
  surveyors: Surveyor[];
}) {
  const [selectedSurveyorUserId, setSelectedSurveyorUserId] = useState<string | null>(null);

  const activeSurveyors = useMemo(
    () =>
      surveyors
        .filter((surveyor) => surveyor.active && surveyor.user_id)
        .sort((first, second) => first.full_name.localeCompare(second.full_name)),
    [surveyors]
  );

  const filteredHistory = selectedSurveyorUserId
    ? history.filter((item) => item.changed_by === selectedSurveyorUserId)
    : history;

  const selectedSurveyor = surveyors.find((surveyor) => surveyor.user_id === selectedSurveyorUserId);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          className={`rounded-md border px-3 py-2 text-sm font-extrabold ${
            selectedSurveyorUserId === null
              ? 'border-brand bg-brand text-white'
              : 'border-line bg-white text-ink hover:border-brand hover:text-brand'
          }`}
          onClick={() => setSelectedSurveyorUserId(null)}
          type="button"
        >
          All
        </button>
        {activeSurveyors.map((surveyor) => (
          <button
            className={`rounded-md border px-3 py-2 text-sm font-extrabold ${
              selectedSurveyorUserId === surveyor.user_id
                ? 'border-brand bg-brand text-white'
                : 'border-line bg-white text-ink hover:border-brand hover:text-brand'
            }`}
            key={surveyor.id}
            onClick={() => setSelectedSurveyorUserId(surveyor.user_id)}
            type="button"
          >
            {surveyor.full_name}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-white shadow-soft">
        {filteredHistory.length ? (
          <div className="divide-y divide-line">
            {selectedSurveyor ? (
              <div className="bg-panel px-4 py-3 text-sm font-semibold text-slate-600">
                Showing only what {selectedSurveyor.full_name} did
              </div>
            ) : null}
            {filteredHistory.map((item) => (
              <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="font-semibold text-ink">{actorName(item)}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Updated {item.leads?.customer_name ?? 'a property'}
                    {item.leads?.property_address ? ` at ${item.leads.property_address}` : ''}
                  </div>
                  {item.note ? <div className="mt-1 text-sm text-slate-500">{item.note}</div> : null}
                  <div className="mt-1 text-xs font-medium text-slate-500">
                    {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
                      new Date(item.created_at)
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.old_status ? <StatusBadge status={item.old_status} /> : null}
                  <span className="text-sm font-semibold text-slate-400">to</span>
                  <StatusBadge status={item.new_status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 text-sm text-slate-500">
            {selectedSurveyor
              ? `${selectedSurveyor.full_name} has no status changes yet.`
              : 'No status changes yet. When surveyors press their property buttons, activity will appear here.'}
          </div>
        )}
      </div>
    </div>
  );
}
