// Build-time content loaders. Globs the user's plain-text files and runs the
// deterministic parser. Drop a .txt into /content/** and it appears on rebuild.
import { parseArticle, parseCourse, type Article, type Course } from './parser';

const articleFiles = import.meta.glob('/content/knowledge/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const courseFiles = import.meta.glob('/content/courses/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function byOrderThenTitle<T extends { order: number; title: string }>(a: T, b: T): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.title.localeCompare(b.title);
}

let _articles: Article[] | null = null;
let _courses: Course[] | null = null;

export function getArticles(): Article[] {
  if (_articles) return _articles;
  const seen = new Map<string, Article>();
  for (const [path, raw] of Object.entries(articleFiles)) {
    const art = parseArticle(path, raw);
    let slug = art.slug || path;
    while (seen.has(slug)) slug = `${slug}-x`;
    seen.set(slug, { ...art, slug });
  }
  _articles = [...seen.values()].sort(byOrderThenTitle);
  return _articles;
}

export function getCourses(): Course[] {
  if (_courses) return _courses;
  const seen = new Map<string, Course>();
  for (const [path, raw] of Object.entries(courseFiles)) {
    const course = parseCourse(path, raw);
    let slug = course.slug || path;
    while (seen.has(slug)) slug = `${slug}-x`;
    seen.set(slug, { ...course, slug });
  }
  _courses = [...seen.values()].sort(byOrderThenTitle);
  return _courses;
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getArticles().find((a) => a.slug === slug);
}

export function getCourseBySlug(slug: string): Course | undefined {
  return getCourses().find((c) => c.slug === slug);
}

export function getCategories(): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const a of getArticles()) {
    map.set(a.category, (map.get(a.category) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type { Article, Course, CourseModule, Block, GlossaryItem, QuizQuestion } from './parser';
