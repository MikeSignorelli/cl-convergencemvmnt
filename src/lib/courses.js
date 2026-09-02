import { supabase } from './supabaseClient'

export async function uploadCourseThumbnail(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('course-thumbnails')
    .upload(path, file, { contentType: file.type })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('course-thumbnails').getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

export async function createCourse({ title, description, visibleTiers, thumbnailPath, videoUrl }) {
  const { data: userData } = await supabase.auth.getUser()
  const { error } = await supabase.from('courses').insert({
    title,
    description: description || null,
    visible_tiers: visibleTiers,
    thumbnail_path: thumbnailPath || null,
    video_url: videoUrl,
    created_by: userData.user?.id ?? null,
  })
  if (error) throw error
}

export async function listCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, description, visible_tiers, thumbnail_path, video_url, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function deleteCourse(id, thumbnailPath) {
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw error
  if (thumbnailPath) {
    await supabase.storage.from('course-thumbnails').remove([thumbnailPath])
  }
}
