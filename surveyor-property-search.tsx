'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { SurveyorPropertyCard } from '@/components/surveyor-property-card';
import type { Lead } from '@/lib/types';

function searchableText(lead: Lead) {
  return [
    lead.customer_name,
    lead.phone,
    lead.email,
    lead.property_address,
    lead.postcode,
    lead.service_type,
    lead.current_status
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function SurveyorPropertySearch({ leads }: { leads: Lead[] }) {
  const [query, setQuery] = useState('');
  const cleanedQuery = query.trim().toLowerCase();

  const filteredLeads = useMemo(() => {
    if (!cleanedQuery) {
      return leads;
    }

    return leads.filter((lead) => searchableText(lead).includes(cleanedQuery));
  }, [cleanedQuery, leads]);

  return (
    <section className="space-y-3 pb-8">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded-md border border-line bg-white py-3 pl-10 pr-3 text-base font-medium text-ink shadow-soft outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, phone, address, postcode..."
          type="search"
          value={query}
        />
      </label>

      {cleanedQuery ? (
        <div className="text-sm font-semibold text-slate-500">
          Showing {filteredLeads.length} of {leads.length} properties
        </div>
      ) : null}

      {filteredLeads.length ? (
        filteredLeads.map((lead) => <SurveyorPropertyCard key={lead.id} lead={lead} />)
      ) : (
        <div className="rounded-md border border-line bg-white p-5 text-center text-sm font-medium text-slate-500">
          {leads.length ? 'No properties match your search' : 'No properties assigned yet'}
        </div>
      )}
    </section>
  );
}
