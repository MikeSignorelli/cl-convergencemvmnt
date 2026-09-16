import { supabase } from './supabaseClient'

const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25MB
// Mirrors the resource-files bucket's allowed_mime_types (0021) exactly, so a
// bad file is rejected inline before the upload round-trip instead of
// failing against the storage layer's own enforcement.
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]

export function validateResourceFile(file) {
  if (file.size > MAX_FILE_BYTES) {
    return 'File must be under 25MB.'
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Only PDF or Word (.docx) files are supported.'
  }
  return ''
}

export async function uploadResourceFile(file) {
  // Re-checked here (not just at the call sites) so this function can never
  // ship a file to Storage that the bucket's own limit/type rule would reject
  // anyway -- same belt-and-suspenders spirit as the bucket config itself.
  const validationError = validateResourceFile(file)
  if (validationError) throw new Error(validationError)

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('resource-files')
    .upload(path, file, { contentType: file.type })
  if (uploadError) throw uploadError

  return path
}

// Next append-to-end position for a course's resource list (or the general/
// unlinked list when courseId is null) -- mirrors the per-course_id grouping
// the 0021 backfill used, so newly added resources land after whatever's
// already there instead of colliding on position 0.
async function nextResourcePosition(courseId) {
  let query = supabase
    .from('resources')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
  query = courseId ? query.eq('course_id', courseId) : query.is('course_id', null)
  const { data, error } = await query
  if (error) throw error
  const highest = data && data[0] ? data[0].position : -1
  return highest + 1
}

export async function createResource({ title, description, visibleTiers, filePath, fileSize, mimeType, externalUrl, courseId }) {
  const { data: userData } = await supabase.auth.getUser()
  const normalizedCourseId = courseId || null
  const position = await nextResourcePosition(normalizedCourseId)
  const { error } = await supabase.from('resources').insert({
    title,
    description: description || null,
    visible_tiers: visibleTiers,
    file_path: filePath || null,
    file_size: fileSize ?? null,
    mime_type: mimeType || null,
    external_url: externalUrl || null,
    course_id: normalizedCourseId,
    position,
    created_by: userData.user?.id ?? null,
  })
  if (error) throw error
}

// Persists a new sort position for one resource -- used by the course-resource
// reorder controls (swaps two adjacent rows' positions).
export async function updateResourcePosition(id, position) {
  const { error } = await supabase.from('resources').update({ position }).eq('id', id)
  if (error) throw error
}

// Resources attached to one course. RLS returns only the ones the caller can
// access (course access rule). Shown at the end of the course page + in Resources.
export async function listCourseResources(courseId) {
  const { data, error } = await supabase
    .from('resources')
    .select('id, title, description, file_path, external_url, course_id, position, created_at')
    .eq('course_id', courseId)
    .order('position', { ascending: true })
  if (error) throw error
  return data || []
}

export async function listResources() {
  const { data, error } = await supabase
    .from('resources')
    .select('id, title, description, visible_tiers, file_path, external_url, course_id, position, created_at')
    .order('position', { ascending: true })
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
