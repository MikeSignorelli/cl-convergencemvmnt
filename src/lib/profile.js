import { supabase } from './supabaseClient'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateAvatarFile(file) {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return 'Please choose a JPG, PNG, WEBP, or GIF image.'
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return 'Image must be under 5MB.'
  }
  return ''
}

// Uploads to avatars/{userId}/avatar.<ext>, overwriting any previous photo —
// one current avatar per user, no orphaned old files to clean up.
export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // Cache-bust so a re-uploaded photo shows immediately instead of a stale
  // browser/CDN-cached copy at the same URL.
  return `${data.publicUrl}?t=${Date.now()}`
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, city, bio, avatar_url')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveProfile(userId, { displayName, city, bio, avatarUrl }) {
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      city: city || null,
      bio: bio || null,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq('id', userId)
  if (error) throw error
}
