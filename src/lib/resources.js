import { supabase } from './supabaseClient'

const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25MB

export function validateResourceFile(file) {
  if (file.size > MAX_FILE_BYTES) {
    return 'File must be under 25MB.'
  }
  return ''
}

export async function uploadResourceFile(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('resource-files')
    .upload(path, file, { contentType: file.type })
  if (uploadError) throw uploadError

  return path
}

export async function createResource({ title, description, visibleTiers, filePath, externalUrl }) {
  const { data: userData } = await supabase.auth.getUser()
  const { error } = await supabase.from('resources').insert({
    title,
    description: description || null,
    visible_tiers: visibleTiers,
    file_path: filePath || null,
    external_url: externalUrl || null,
    created_by: userData.user?.id ?? null,
  })
  if (error) throw error
}

export async function listResources() {
  const { data, error } = await supabase
    .from('resources')
    .select('id, title, description, visible_tiers, file_path, external_url, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function deleteResource(id, filePath) {
  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) throw error
  if (filePath) {
    await supabase.storage.from('resource-files').remove([filePath])
  }
}

export async function getResourceDownloadUrl(filePath) {
  const { data, error } = await supabase.storage
    .from('resource-files')
    .createSignedUrl(filePath, 60)
  if (error) throw error
  return data.signedUrl
}
