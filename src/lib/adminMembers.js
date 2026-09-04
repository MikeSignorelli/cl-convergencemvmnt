import { supabase } from './supabaseClient'

export async function listMembers() {
  const { data, error } = await supabase.rpc('admin_list_members')
  if (error) throw error
  return data || []
}

export async function deleteMember(id) {
  const { error } = await supabase.rpc('admin_delete_member', { p_member_id: id })
  if (error) throw error
}
