import { supabase } from './supabaseClient'

export async function listMembers() {
  const { data, error } = await supabase.rpc('admin_list_members')
  if (error) throw error
  return data || []
}

export async function updateMember({ id, tier, displayName }) {
  const { error } = await supabase.rpc('admin_update_member', {
    p_member_id: id,
    p_tier: tier,
    p_display_name: displayName,
  })
  if (error) throw error
}

export async function deleteMember(id) {
  const { error } = await supabase.rpc('admin_delete_member', { p_member_id: id })
  if (error) throw error
}
