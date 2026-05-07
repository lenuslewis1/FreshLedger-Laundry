grant usage on schema private to authenticated;
grant execute on function private.is_business_member(uuid, uuid) to authenticated;
grant execute on function private.has_business_role(uuid, uuid, public.member_role[]) to authenticated;
