drop policy if exists "admins and managers insert leads" on public.leads;
create policy "admins insert leads" on public.leads
for insert with check (public.has_any_role(array['owner','admin']::public.app_role[]));

create or replace function public.prevent_non_admin_assignment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.assigned_surveyor_id::text, '') is distinct from coalesce(old.assigned_surveyor_id::text, '')
    and not public.has_any_role(array['owner','admin']::public.app_role[])
  then
    raise exception 'Only admin users can assign properties to surveyors.';
  end if;

  return new;
end;
$$;

drop trigger if exists leads_prevent_non_admin_assignment_change on public.leads;
create trigger leads_prevent_non_admin_assignment_change
before update of assigned_surveyor_id on public.leads
for each row execute function public.prevent_non_admin_assignment_change();
