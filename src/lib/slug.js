// Slug generation, matching the backfill logic in
// supabase/migrations/0021_course_admin_extensions.sql (courses.slug and
// course_categories.slug) so client-generated slugs land the same way the
// database itself would derive them: lowercase, runs of non-alphanumeric
// characters collapsed to a single hyphen, leading/trailing hyphens trimmed.
export function slugify(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
