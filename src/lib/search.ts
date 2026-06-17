// ---------------------------------------------------------------------------
// Soul Seeking — build-time search index.
// Pure logic, no AI and no third-party search service. Every page on the site
// (Home, About, Give Onward, the hubs, every article and every course) is
// flattened into a small JSON document that the browser fetches once and
// searches entirely client-side. Drop a new .txt into /content and it is
// indexed automatically on the next build.
// ---------------------------------------------------------------------------
import {
  getArticles,
  getCourses,
  type Block,
  type GlossaryItem,
  type QuizQuestion,
} from './content';

export interface SearchDoc {
  title: string;
  url: string;
  type: string; // "Article" | "Course" | "Page"
  category: string; // section / category label ('' when not applicable)
  excerpt: string; // short, human-readable summary shown under the title
  body: string; // full plain-text haystack used for matching
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&rsquo;': '\u2019',
  '&lsquo;': '\u2018',
  '&rdquo;': '\u201d',
  '&ldquo;': '\u201c',
  '&mdash;': '\u2014',
  '&ndash;': '\u2013',
  '&hellip;': '\u2026',
  '&nbsp;': ' ',
};

function decodeEntities(s: string): string {
  return s.replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m] ?? m);
}

// Reduce inline-formatted HTML (the parser only ever emits <strong>/<em>) back
// to clean, searchable plain text.
function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function blocksText(blocks: Block[]): string {
  const out: string[] = [];
  for (const b of blocks) {
    switch (b.kind) {
      case 'heading':
        out.push(b.text);
        break;
      case 'para':
      case 'lead':
      case 'quote':
        out.push(stripTags(b.html));
        break;
      case 'ul':
      case 'ol':
        out.push(b.items.map(stripTags).join(' '));
        break;
      case 'rule':
        break;
    }
  }
  return out.join(' ');
}

function glossaryText(items: GlossaryItem[]): string {
  return items.map((g) => `${g.term}: ${g.meaning}`).join(' ');
}

function quizText(questions: QuizQuestion[]): string {
  return questions
    .map(
      (q) =>
        `${stripTags(q.q)} ${q.options.map((o) => stripTags(o.text)).join(' ')} ${
          q.explain ? stripTags(q.explain) : ''
        }`
    )
    .join(' ');
}

function clean(s: string): string {
  return decodeEntities(s).replace(/\s+/g, ' ').trim();
}

// Fold diacritics to plain ASCII so a visitor typing "kosa" still matches
// "Kośa", "Gita" matches "Gītā", and so on. Case is preserved so snippets read
// naturally; the client lower-cases when comparing.
function fold(s: string): string {
  return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

// Hand-written registry for the standalone pages (no .txt source of their own).
const STATIC_PAGES: SearchDoc[] = [
  {
    title: 'Home',
    url: '/',
    type: 'Page',
    category: '',
    excerpt: 'Higher answers for deeper questions — your quiet quest within.',
    body: clean(
      `Soul Seeking. Higher answers for deeper questions. Welcome to your quiet quest within.
       Explore life's bigger mysteries, spirituality and the inner Self. The desire to know the
       Soul is the desire that will end all others. Your Inward Guide. Walk the ancient path to
       life's highest truths and deepest secrets — wisdom, courses, reflections and resources on
       life, Spirit and the soul. For the soul is eternal, all-pervading, unchanging, immovable
       and primeval. Bhagavad Gita 2.23. Where to begin: the Knowledge Hub and the Courses.`
    ),
  },
  {
    title: 'About Soul Seeking',
    url: '/about',
    type: 'Page',
    category: '',
    excerpt: 'Who we are, what we value, and why this quiet quest exists.',
    body: clean(
      `About Soul Seeking. A quiet place for the oldest questions — uncovering life, truth and
       Spirit, step by step. An outreach for inward travellers: a self-contained library of
       wisdom, courses and reflections on the Self, the cosmos and the way to live. No membership,
       no fee, no contact to make. Our personality: Confronting, Authentic, Encouraging. Truth
       does not always console. No imitation, no spectacle, no hidden motive. For the earnest
       seeker there is always success. Our values, the threefold measure: Authenticity, Simplicity,
       Quality. Who looks outside, dreams; who looks inside, awakes. Carl Jung.`
    ),
  },
  {
    title: 'Give Onward',
    url: '/donate',
    type: 'Page',
    category: '',
    excerpt: 'No fee and no donation button — help three people and ask them to help three others.',
    body: clean(
      `Give Onward. Donate. This work is offered freely. There is nothing to buy and no button to
       press. Instead of thanking us, help three people and tell them to help three others. Help
       three people freely and without expectation. Ask each of them to help three others in turn.
       Tell no one to thank you — let the giving travel onward. A quiet chain of kindness with no
       end and no ledger. What you seek, you will attract; what you give, you set free.`
    ),
  },
  {
    title: 'Knowledge Hub',
    url: '/knowledge',
    type: 'Page',
    category: '',
    excerpt: 'Reflections and resources on life, Spirit and the soul — writings to read slowly.',
    body: clean(
      `Knowledge Hub. Writings, articles, reflections and resources on life, Spirit and the soul.
       Read slowly. The inward search, the five sheaths, who am I, the three gunas, the cosmos and
       creation, authentic seeking.`
    ),
  },
  {
    title: 'Courses',
    url: '/courses',
    type: 'Page',
    category: '',
    excerpt: 'Guided journeys, structured as books with chapters, glossaries and quizzes.',
    body: clean(
      `Courses. Guided journeys, structured as books with chapters, glossaries and quizzes. Walk
       at your own pace. Panca Maya Kosa, the five sheaths of the Self. The eternal soul.`
    ),
  },
];

let _docs: SearchDoc[] | null = null;

export function buildSearchDocs(): SearchDoc[] {
  if (_docs) return _docs;

  const articleDocs: SearchDoc[] = getArticles().map((a) => ({
    title: a.title,
    url: `/knowledge/${a.slug}`,
    type: 'Article',
    category: a.category,
    excerpt: clean(a.description),
    body: clean(
      [
        a.title,
        a.category,
        a.description,
        a.quote ?? '',
        blocksText(a.blocks),
        glossaryText(a.glossary),
      ].join(' ')
    ),
  }));

  const courseDocs: SearchDoc[] = getCourses().map((c) => ({
    title: c.title,
    url: `/courses/${c.slug}`,
    type: 'Course',
    category: 'Course',
    excerpt: clean(c.description || c.tagline),
    body: clean(
      [
        c.title,
        c.tagline,
        c.description,
        blocksText(c.brief),
        c.outcomes.map(stripTags).join(' '),
        c.modules
          .map(
            (m) =>
              `${m.title} ${blocksText(m.intro)} ${blocksText(m.body)} ${glossaryText(
                m.glossary
              )} ${blocksText(m.summary)} ${quizText(m.quiz)}`
          )
          .join(' '),
        blocksText(c.summary),
        quizText(c.finalQuiz),
      ].join(' ')
    ),
  }));

  // Fold the searchable body of every doc to ASCII so diacritic-free queries
  // still match (titles/excerpts keep their diacritics for display).
  _docs = [...STATIC_PAGES, ...articleDocs, ...courseDocs].map((d) => ({
    ...d,
    body: fold(d.body),
  }));
  return _docs;
}
