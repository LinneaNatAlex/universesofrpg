-- Never auto-create profiles from email or Google real names — only chosen username.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', ''),
    '[^a-z0-9_]', '_', 'g'
  ));

  if length(base_username) < 3 then
    base_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    base_username,
    base_username
  );

  return new;
end;
$$;

-- Fix existing OAuth profiles that used email/Google-derived display names.
update public.profiles
set display_name = username
where display_name is distinct from username
  and display_name ~ '[A-Z ]';
