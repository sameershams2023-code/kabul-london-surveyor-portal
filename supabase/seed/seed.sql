-- Create matching auth users in Supabase Auth first, then replace these UUIDs if needed.
insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-000000000101', 'surveyor'),
  ('00000000-0000-0000-0000-000000000102', 'surveyor')
on conflict (user_id) do update set role = excluded.role;

insert into public.surveyors (id, user_id, full_name, email, phone, tidycal_link, service_area, active) values
  ('10000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000101', 'Sameer Shams', 'sameer@kabullondon.co.uk', '+447700900101', 'https://tidycal.com/kabullondon/sameer-survey', 'West London', true),
  ('10000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000102', 'Aisha Khan', 'aisha@kabullondon.co.uk', '+447700900102', 'https://tidycal.com/kabullondon/aisha-survey', 'North London', true)
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  tidycal_link = excluded.tidycal_link,
  service_area = excluded.service_area,
  active = excluded.active;

insert into public.leads (customer_name, phone, email, property_address, postcode, service_type, source, current_status, assigned_surveyor_id, created_by) values
  ('Nadia Rahimi', '+447700100001', 'nadia.rahimi@example.com', '12 High Street, London', 'W12 7AB', 'EPC Survey', 'CSV import', 'New', '10000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001'),
  ('Omar Malik', '+447700100002', 'omar.malik@example.com', '13 High Street, London', 'UB6 9RT', 'Property Survey', 'Referral', 'First attempt', '10000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001'),
  ('Hina Patel', '+447700100003', 'hina.patel@example.com', '14 High Street, London', 'HA1 2DD', 'Retrofit Assessment', 'CSV import', 'Second attempt', '10000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001'),
  ('Zain Ahmed', '+447700100004', 'zain.ahmed@example.com', '15 High Street, London', 'NW10 4LX', 'EPC Survey', 'Referral', 'Third attempt', '10000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001'),
  ('Mariam Noor', '+447700100005', 'mariam.noor@example.com', '16 High Street, London', 'Ealing W5', 'Property Survey', 'CSV import', 'SMS sent', '10000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001'),
  ('Daniel Cooper', '+447700100006', 'daniel.cooper@example.com', '17 High Street, London', 'SW6 1AA', 'EPC Survey', 'Referral', 'Appointment booked', '10000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001'),
  ('Farah Hussain', '+447700100007', 'farah.hussain@example.com', '18 High Street, London', 'N1 8QG', 'Retrofit Assessment', 'CSV import', 'Completed', '10000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001'),
  ('Amir Siddiq', '+447700100008', 'amir.siddiq@example.com', '19 High Street, London', 'SE1 7PB', 'Property Survey', 'Referral', 'Refused', null, '00000000-0000-0000-0000-000000000001'),
  ('Sara Williams', '+447700100009', 'sara.williams@example.com', '20 High Street, London', 'IG1 3AD', 'EPC Survey', 'CSV import', 'No access', '10000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001'),
  ('Khalid Jan', '+447700100010', 'khalid.jan@example.com', '21 High Street, London', 'TW3 2QA', 'Property Survey', 'Referral', 'No answer', '10000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001');
