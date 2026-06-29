alter table public.leads
drop constraint if exists leads_current_status_check;

alter table public.leads
add constraint leads_current_status_check check (
  current_status in (
    'New',
    'First attempt',
    'Second attempt',
    'Third attempt',
    'SMS sent',
    'Appointment booked',
    'Completed',
    'Refused',
    'No Show',
    'No answer',
    'No access',
    'Wrong number',
    'Cancelled'
  )
);
