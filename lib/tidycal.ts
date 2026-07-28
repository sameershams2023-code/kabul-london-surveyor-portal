import { createSupabaseAdminClient, hasSupabaseEnv } from '@/lib/supabase/server';
import type { Lead, Surveyor } from '@/lib/types';

type TidyCalContact = {
  name?: string | null;
  email?: string | null;
  phone_number?: string | null;
};

type TidyCalQuestion = {
  question?: string | null;
  answer?: string | null;
};

type TidyCalBookingType = {
  id?: number | string | null;
  title?: string | null;
  url?: string | null;
  url_slug?: string | null;
};

type TidyCalHost = {
  name?: string | null;
  email?: string | null;
};

type TidyCalBooking = {
  id: number | string;
  booking_type_id?: number | string | null;
  starts_at?: string | null;
  cancelled_at?: string | null;
  contact?: TidyCalContact | null;
  questions?: TidyCalQuestion[] | null;
  booking_type?: TidyCalBookingType | null;
  hosts?: TidyCalHost[] | null;
};

type TidyCalResponse = {
  data?: TidyCalBooking[];
};

function digitsOnly(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '');
}

function phoneKey(value: string | null | undefined) {
  const digits = digitsOnly(value);
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalise(value: string | null | undefined) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function questionAnswer(booking: TidyCalBooking, keywords: string[]) {
  const questions = booking.questions ?? [];
  const found = questions.find((item) => {
    const question = normalise(item.question);
    return keywords.some((keyword) => question.includes(normalise(keyword)));
  });

  return found?.answer?.trim() || null;
}

function bookingText(booking: TidyCalBooking) {
  return [
    booking.booking_type?.title,
    booking.booking_type?.url,
    booking.booking_type?.url_slug,
    ...(booking.hosts ?? []).flatMap((host) => [host.name, host.email])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function matchSurveyor(booking: TidyCalBooking, surveyors: Surveyor[]) {
  const text = bookingText(booking);

  return (
    surveyors.find((surveyor) => surveyor.email && text.includes(surveyor.email.toLowerCase())) ??
    surveyors.find((surveyor) => surveyor.full_name && text.includes(surveyor.full_name.toLowerCase())) ??
    surveyors.find((surveyor) => {
      const link = surveyor.tidycal_link?.toLowerCase();
      return Boolean(link && booking.booking_type?.url?.toLowerCase().includes(link));
    }) ??
    null
  );
}

function matchLead(booking: TidyCalBooking, leads: Lead[], surveyor: Surveyor | null) {
  const customerPhone = booking.contact?.phone_number ?? questionAnswer(booking, ['phone', 'mobile', 'telephone']);
  const customerEmail = booking.contact?.email?.toLowerCase() ?? '';
  const propertyAddress = questionAnswer(booking, ['address', 'property']);
  const postcode = questionAnswer(booking, ['postcode', 'post code', 'zip']);
  const name = booking.contact?.name?.toLowerCase() ?? '';
  const phone = phoneKey(customerPhone);
  const assignedLeads = surveyor ? leads.filter((lead) => lead.assigned_surveyor_id === surveyor.id) : leads;

  return (
    assignedLeads.find((lead) => phone && phoneKey(lead.phone) === phone) ??
    assignedLeads.find((lead) => customerEmail && lead.email?.toLowerCase() === customerEmail) ??
    assignedLeads.find(
      (lead) =>
        postcode &&
        normalise(lead.postcode) === normalise(postcode) &&
        propertyAddress &&
        normalise(propertyAddress).includes(normalise(lead.property_address).slice(0, 12))
    ) ??
    assignedLeads.find((lead) => name && normalise(name) === normalise(lead.customer_name)) ??
    null
  );
}

async function fetchTidyCalBookings(startsAt: Date, endsAt: Date) {
  const token = process.env.TIDYCAL_API_KEY;
  if (!token) {
    throw new Error('Missing TIDYCAL_API_KEY.');
  }

  const url = new URL('https://tidycal.com/api/bookings');
  url.searchParams.set('starts_at', startsAt.toISOString().slice(0, 10));
  url.searchParams.set('ends_at', endsAt.toISOString().slice(0, 10));
  url.searchParams.set('include_teams', 'true');
  url.searchParams.set('page', '1');

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`TidyCal returned ${response.status}.`);
  }

  const json = (await response.json()) as TidyCalResponse;
  return json.data ?? [];
}

export async function syncTidyCalBookings(daysAhead = 14) {
  if (!hasSupabaseEnv()) {
    return { synced: 0, skipped: 0, error: 'Supabase is not connected.' };
  }

  const startsAt = new Date();
  startsAt.setHours(0, 0, 0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + daysAhead);

  const admin = createSupabaseAdminClient();
  const [tidycalBookings, surveyorsResult, leadsResult] = await Promise.all([
    fetchTidyCalBookings(startsAt, endsAt),
    admin.from('surveyors').select('*').eq('active', true),
    admin.from('leads').select('*')
  ]);

  const surveyors = (surveyorsResult.data as Surveyor[] | null) ?? [];
  const leads = (leadsResult.data as Lead[] | null) ?? [];
  let synced = 0;
  let skipped = 0;

  for (const tidycalBooking of tidycalBookings) {
    if (!tidycalBooking.starts_at) {
      skipped += 1;
      continue;
    }

    const surveyor = matchSurveyor(tidycalBooking, surveyors);
    const lead = matchLead(tidycalBooking, leads, surveyor);

    if (!lead) {
      skipped += 1;
      continue;
    }

    const tidycalBookingId = String(tidycalBooking.id);
    const status = tidycalBooking.cancelled_at ? 'cancelled' : 'booked';
    const existing = await admin
      .from('bookings')
      .select('id,booking_status')
      .eq('tidycal_booking_id', tidycalBookingId)
      .maybeSingle();

    const bookingPayload = {
      lead_id: lead.id,
      surveyor_id: surveyor?.id ?? lead.assigned_surveyor_id,
      tidycal_booking_id: tidycalBookingId,
      booking_time: tidycalBooking.starts_at,
      booking_status: status,
      customer_name: tidycalBooking.contact?.name ?? lead.customer_name,
      customer_email: tidycalBooking.contact?.email ?? lead.email,
      customer_phone:
        tidycalBooking.contact?.phone_number ?? questionAnswer(tidycalBooking, ['phone', 'mobile', 'telephone']) ?? lead.phone
    };

    if (existing.data?.id) {
      await admin.from('bookings').update(bookingPayload).eq('id', existing.data.id);
    } else {
      await admin.from('bookings').insert(bookingPayload);
    }

    if (!tidycalBooking.cancelled_at && lead.current_status !== 'Appointment booked') {
      await Promise.all([
        admin
          .from('leads')
          .update({ current_status: 'Appointment booked', updated_at: new Date().toISOString() })
          .eq('id', lead.id),
        admin.from('lead_status_history').insert({
          lead_id: lead.id,
          old_status: lead.current_status,
          new_status: 'Appointment booked',
          changed_by: lead.created_by,
          note: 'Appointment booked from TidyCal.'
        })
      ]);
    }

    synced += 1;
  }

  return { synced, skipped };
}
