import { supabase } from './supabaseClient'
import { slugify } from './slug'

// course_categories (migration 0021): a real, orderable, admin-managed
// category list that sits ALONGSIDE the legacy courses.category free-text
// column -- see courses.js's createCourse/updateCourse for the categoryId
// pass-through and the write-through that keeps the old text column in sync.

export async function listCategories() {
  const { data, error } = await supabase
    .from('course_categories')
    .select('id, name, slug, position')
    .order('position', { ascending: true })
  if (error) throw error
  return data || []
}

// Admin-only (enforced by RLS -- see "admins manage course categories" in
// migration 0021): the insert simply fails with the RLS error if the caller
// isn't an admin, surfaced to the caller as-is. New categories are appended
// to the end of the current order.
export async function createCategory(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) throw new Error('Enter a category name.')

  const { data: last, error: lastError } = await supabase
    .from('course_categories')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lastError) throw lastError

  const { data, error } = await supabase
    .from('course_categories')
    .insert({ name: trimmed, slug: slugify(trimmed), position: last ? last.position + 1 : 0 })
    .select('id, name, slug, position')
    .single()
  if (error) throw error
  return data
}

export async function renameCategory(id, name) {
  const trimmed = (name || '').trim()
  if (!trimmed) throw new Error('Enter a category name.')
  const { error } = await supabase.from('course_categories').update({ name: trimmed }).eq('id', id)
  if (error) throw error
}

// Reorder the full list: `orderedIds` is every category id in its new
// display order, and each gets its index as its new position -- same
// swap/update-by-position approach as swapLessonPositions in
// courseLessons.js, just applied across an arbitrary-length list instead of
// a single pair.
export async function reorderCategories(orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('course_categories')
      .update({ position: i })
      .eq('id', orderedIds[i])
    if (error) throw error
  }
}

// Client-side pre-check (courses.category_id has no ON DELETE clause, so a
// referenced category would otherwise fail the delete with a raw foreign-key
// error) -- refuse early with a clear, actionable message instead. If the
// count check somehow races with a new reference, the delete itself still
// fails naturally and that error is surfaced as-is.
export async function deleteCategory(id) {
  const { count, error: countError } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)
  if (countError) throw countError
  if (count > 0) {
    throw new Error(
      `${count} course${count === 1 ? '' : 's'} still ${count === 1 ? 'uses' : 'use'} this category. Reassign ${count === 1 ? 'it' : 'them'} to another category before deleting.`
    )
  }

  const { error } = await supabase.from('course_categories').delete().eq('id', id)
  if (error) throw error
}
