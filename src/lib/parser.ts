// ---------------------------------------------------------------------------
// Soul Seeking — deterministic plain-text content parser.
// Pure logic, no AI. Turns a forgiving .txt convention into structured,
// render-ready data for Knowledge articles and Course "books".
// ---------------------------------------------------------------------------

export type Block =
  | { kind: 'heading'; level: 2 | 3 | 4; text: string; id: string }
  | { kind: 'para'; html: string }
  | { kind: 'lead'; html: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'quote'; html: string; cite?: string }
  | { kind: 'rule' };

export interface GlossaryItem {
  term: string;
  meaning: string;
}

export interface QuizQuestion {
  q: string;
  options: { text: string; correct: boolean }[];
  explain?: string;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  order: number;
  quote?: string;
  blocks: Block[];
  glossary: GlossaryItem[];
  readingMinutes: number;
  wordCount: number;
}

export interface CourseModule {
  slug: string;
  number: number;
  title: string;
  intro: Block[];
  body: Block[];
  glossary: GlossaryItem[];
  summary: Block[];
  quiz: QuizQuestion[];
}

export interface Course {
  slug: string;
  title: string;
  description: string;
  tagline: string;
  level: number;
  order: number;
  brief: Block[];
  outcomes: string[];
  modules: CourseModule[];
  summary: Block[];
  finalQuiz: QuizQuestion[];
  readingMinutes: number;
}

// --------------------------- small utilities -------------------------------

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Tiny, safe inline formatter: **bold**, *italic*, _italic_.
function inline(raw: string): string {
  let s = escapeHtml(raw.trim());
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
  return s;
}

function prettifyFilename(path: string): string {
  const base = path.split('/').pop() ?? path;
  const name = base.replace(/\.txt$/i, '');
  return name
    .replace(/^\d+[-_.\s]*/, '') // drop leading order prefix like "01-"
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function leadingOrderFromName(path: string): number | null {
  const base = path.split('/').pop() ?? path;
  const m = base.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

const KNOWN_META = new Set([
  'title',
  'course',
  'category',
  'order',
  'author',
  'quote',
  'description',
  'level',
  'tagline',
]);

interface ParsedHead {
  meta: Record<string, string>;
  bodyLines: string[];
}

// Pull recognised "Key: value" lines from the very top of the file.
function extractMeta(lines: string[]): ParsedHead {
  const meta: Record<string, string> = {};
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      // allow blank lines interleaved in the header
      if (Object.keys(meta).length === 0) continue;
      else continue;
    }
    const m = line.match(/^([A-Za-z][A-Za-z ]{0,20}):\s*(.*)$/);
    if (m && KNOWN_META.has(m[1].trim().toLowerCase())) {
      meta[m[1].trim().toLowerCase()] = m[2].trim();
    } else {
      break;
    }
  }
  return { meta, bodyLines: lines.slice(i) };
}

// --------------------------- block parsing ---------------------------------

function isHeading(line: string): { level: 2 | 3 | 4; text: string } | null {
  const t = line.trim();
  const md = t.match(/^(#{1,4})\s+(.*)$/);
  if (md) {
    const lvl = Math.min(Math.max(md[1].length, 2), 4) as 2 | 3 | 4;
    return { level: lvl, text: md[2].trim() };
  }
  const eq = t.match(/^==+\s*(.*?)\s*==+$/);
  if (eq) return { level: 3, text: eq[1].trim() };
  // ALL-CAPS standalone line → section heading
  if (
    t.length >= 3 &&
    t.length <= 64 &&
    /[A-Z]/.test(t) &&
    /^[A-Z0-9][A-Z0-9 ,&'\u2019.\-:/()]+$/.test(t) &&
    !/^[-*]/.test(t)
  ) {
    return { level: 3, text: t.replace(/:\s*$/, '').trim() };
  }
  return null;
}

function isBulletItem(line: string): string | null {
  const m = line.match(/^\s*[-*\u2022]\s+(.*)$/);
  return m ? m[1].trim() : null;
}

function isOrderedItem(line: string): string | null {
  const m = line.match(/^\s*\d+[.)]\s+(.*)$/);
  return m ? m[1].trim() : null;
}

function isDefinition(line: string): GlossaryItem | null {
  // "term : meaning" / "term — meaning" / "term - meaning"
  const m = line.match(/^\s*([^:—\u2013-][^:—\u2013]*?)\s*(?::|—|\u2013|\s-\s)\s*(.+)$/);
  if (m && m[1].trim().length <= 40 && m[2].trim().length > 0) {
    return { term: m[1].trim(), meaning: m[2].trim() };
  }
  return null;
}

interface ParseOpts {
  firstParaAsLead?: boolean;
}

// Parse a region of lines into blocks. A "Glossary" heading switches the
// remaining lines into glossary definitions, returned separately.
function parseBlocks(
  lines: string[],
  opts: ParseOpts = {}
): { blocks: Block[]; glossary: GlossaryItem[] } {
  const blocks: Block[] = [];
  const glossary: GlossaryItem[] = [];
  let i = 0;
  let inGlossary = false;
  let leadAssigned = !opts.firstParaAsLead;
  const usedIds = new Set<string>();

  const mkId = (text: string): string => {
    let base = slugify(text) || 'section';
    let id = base;
    let n = 2;
    while (usedIds.has(id)) id = `${base}-${n++}`;
    usedIds.add(id);
    return id;
  };

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i++;
      continue;
    }

    // horizontal rule
    if (/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push({ kind: 'rule' });
      i++;
      continue;
    }

    const heading = isHeading(line);
    if (heading) {
      inGlossary = /^glossary\b/i.test(heading.text) || /sanskrit/i.test(heading.text) && /glossar|terms?/i.test(heading.text);
      if (!inGlossary) {
        blocks.push({
          kind: 'heading',
          level: heading.level,
          text: heading.text,
          id: mkId(heading.text),
        });
      }
      i++;
      continue;
    }

    if (inGlossary) {
      const def = isDefinition(line);
      if (def) {
        glossary.push(def);
        i++;
        continue;
      }
      // non-definition line ends glossary mode and is reprocessed
      inGlossary = false;
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      let cite: string | undefined;
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        const text = lines[i].replace(/^\s*>\s?/, '');
        const cm = text.match(/^[—\u2013-]{1,2}\s*(.+)$/);
        if (cm && buf.length > 0) cite = cm[1].trim();
        else buf.push(text);
        i++;
      }
      blocks.push({ kind: 'quote', html: inline(buf.join(' ')), cite });
      continue;
    }

    // unordered list
    if (isBulletItem(line) !== null) {
      const items: string[] = [];
      while (i < lines.length && isBulletItem(lines[i]) !== null) {
        items.push(inline(isBulletItem(lines[i]) as string));
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    // ordered list
    if (isOrderedItem(line) !== null) {
      const items: string[] = [];
      while (i < lines.length && isOrderedItem(lines[i]) !== null) {
        items.push(inline(isOrderedItem(lines[i]) as string));
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    // paragraph: gather until blank or structural line
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !isHeading(lines[i]) &&
      isBulletItem(lines[i]) === null &&
      isOrderedItem(lines[i]) === null &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(lines[i])
    ) {
      buf.push(lines[i].trim());
      i++;
    }
    if (buf.length) {
      const html = inline(buf.join(' '));
      if (!leadAssigned) {
        blocks.push({ kind: 'lead', html });
        leadAssigned = true;
      } else {
        blocks.push({ kind: 'para', html });
      }
    }
  }

  return { blocks, glossary };
}

// --------------------------- quiz parsing ----------------------------------

function parseQuiz(lines: string[]): QuizQuestion[] {
  const quiz: QuizQuestion[] = [];
  let current: QuizQuestion | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') continue;
    const qm = line.match(/^Q\s*[:.\)]\s*(.+)$/i);
    if (qm) {
      if (current) quiz.push(current);
      current = { q: qm[1].trim(), options: [] };
      continue;
    }
    const em = line.match(/^Explain\s*[:.\)]\s*(.+)$/i);
    if (em && current) {
      current.explain = em[1].trim();
      continue;
    }
    const opt = isBulletItem(line);
    if (opt !== null && current) {
      const correct = /\s*(\*|\[x\]|\(correct\))\s*$/i.test(opt);
      const text = opt.replace(/\s*(\*|\[x\]|\(correct\))\s*$/i, '').trim();
      current.options.push({ text, correct });
      continue;
    }
  }
  if (current) quiz.push(current);
  return quiz.filter((q) => q.options.length >= 2);
}

function countWords(blocks: Block[]): number {
  let n = 0;
  for (const b of blocks) {
    if (b.kind === 'para' || b.kind === 'lead' || b.kind === 'quote') {
      n += b.html.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
    } else if (b.kind === 'ul' || b.kind === 'ol') {
      n += b.items.join(' ').split(/\s+/).filter(Boolean).length;
    } else if (b.kind === 'heading') {
      n += b.text.split(/\s+/).length;
    }
  }
  return n;
}

function plainExcerpt(blocks: Block[], max = 180): string {
  for (const b of blocks) {
    if (b.kind === 'lead' || b.kind === 'para') {
      const text = b.html.replace(/<[^>]+>/g, '');
      return text.length > max ? text.slice(0, max).trim() + '\u2026' : text;
    }
  }
  return '';
}

// --------------------------- public parsers --------------------------------

export function parseArticle(path: string, content: string): Article {
  const norm = content.replace(/\r\n?/g, '\n');
  const { meta, bodyLines } = extractMeta(norm.split('\n'));

  let title = meta.title || '';
  let lines = bodyLines;
  if (!title) {
    // use a leading standalone heading if present, else the filename
    const firstNonBlank = bodyLines.findIndex((l) => l.trim() !== '');
    const h = firstNonBlank >= 0 ? isHeading(bodyLines[firstNonBlank]) : null;
    if (h) {
      title = h.text;
      lines = bodyLines.slice(firstNonBlank + 1);
    } else {
      title = prettifyFilename(path);
    }
  }

  const { blocks, glossary } = parseBlocks(lines, { firstParaAsLead: true });
  const wordCount = countWords(blocks);
  const order = meta.order ? parseInt(meta.order, 10) : leadingOrderFromName(path) ?? 0;

  return {
    slug: slugify(meta.title ? meta.title : prettifyFilename(path)),
    title,
    description: meta.description || plainExcerpt(blocks),
    category: meta.category || 'Reflections',
    author: meta.author || 'Soul Seeking',
    order: Number.isFinite(order) ? order : 0,
    quote: meta.quote || undefined,
    blocks,
    glossary,
    wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / 200)),
  };
}

interface RawSection {
  label: string; // '', 'intro', 'body', 'glossary', 'summary', 'quiz'
  lines: string[];
}

// Split a module's lines into labelled sub-sections (Intro:/Body:/...).
function splitLabelled(lines: string[]): RawSection[] {
  const sections: RawSection[] = [{ label: 'body', lines: [] }];
  for (const line of lines) {
    const m = line.match(/^\s*(Intro|Introduction|Body|Glossary|Summary|Quiz)\s*:\s*$/i);
    if (m) {
      let label = m[1].toLowerCase();
      if (label === 'introduction') label = 'intro';
      sections.push({ label, lines: [] });
    } else {
      sections[sections.length - 1].lines.push(line);
    }
  }
  return sections.filter((s) => s.lines.some((l) => l.trim() !== ''));
}

export function parseCourse(path: string, content: string): Course {
  const norm = content.replace(/\r\n?/g, '\n');
  const { meta, bodyLines } = extractMeta(norm.split('\n'));

  // Split on top-level module / course-section delimiters (## ...).
  type Seg = { head: string; lines: string[] };
  const intro: string[] = [];
  const segments: Seg[] = [];
  let cur: Seg | null = null;
  for (const line of bodyLines) {
    const hm = line.match(/^##\s+(.*)$/);
    if (hm) {
      cur = { head: hm[1].trim(), lines: [] };
      segments.push(cur);
    } else if (cur) {
      cur.lines.push(line);
    } else {
      intro.push(line);
    }
  }

  // The pre-module intro region may contain Brief:/Outcomes: labels.
  const briefBlocks: Block[] = [];
  const outcomes: string[] = [];
  {
    const labelled = splitBriefOutcomes(intro);
    const b = parseBlocks(labelled.brief, { firstParaAsLead: true });
    briefBlocks.push(...b.blocks);
    for (const item of labelled.outcomes) outcomes.push(item);
  }

  const modules: CourseModule[] = [];
  let courseSummary: Block[] = [];
  let finalQuiz: QuizQuestion[] = [];
  let moduleNo = 0;

  for (const seg of segments) {
    const headLc = seg.head.toLowerCase();
    if (/^course\s+summary/.test(headLc) || headLc === 'summary') {
      courseSummary = parseBlocks(seg.lines, { firstParaAsLead: true }).blocks;
      continue;
    }
    if (/^course\s+quiz/.test(headLc) || headLc === 'final quiz' || headLc === 'quiz') {
      finalQuiz = parseQuiz(seg.lines);
      continue;
    }
    moduleNo += 1;
    const title = seg.head.replace(/^module\s*\d*\s*[:.\-]?\s*/i, '').trim() || `Module ${moduleNo}`;
    const parts = splitLabelled(seg.lines);

    let introB: Block[] = [];
    let bodyB: Block[] = [];
    let gloss: GlossaryItem[] = [];
    let summaryB: Block[] = [];
    let quiz: QuizQuestion[] = [];

    for (const p of parts) {
      if (p.label === 'intro') {
        introB = parseBlocks(p.lines, { firstParaAsLead: true }).blocks;
      } else if (p.label === 'quiz') {
        quiz = parseQuiz(p.lines);
      } else if (p.label === 'summary') {
        summaryB = parseBlocks(p.lines).blocks;
      } else if (p.label === 'glossary') {
        const r = parseBlocks(['== Glossary ==', ...p.lines]);
        gloss = gloss.concat(r.glossary);
      } else {
        // 'body' (default): may itself contain an inline Glossary heading
        const r = parseBlocks(p.lines);
        bodyB = bodyB.concat(r.blocks);
        gloss = gloss.concat(r.glossary);
      }
    }

    modules.push({
      slug: slugify(title) || `module-${moduleNo}`,
      number: moduleNo,
      title,
      intro: introB,
      body: bodyB,
      glossary: gloss,
      summary: summaryB,
      quiz,
    });
  }

  const order = meta.order ? parseInt(meta.order, 10) : leadingOrderFromName(path) ?? 0;
  const level = meta.level ? parseInt(meta.level, 10) : 1;
  const title = meta.course || meta.title || prettifyFilename(path);

  let totalWords = countWords(briefBlocks) + countWords(courseSummary);
  for (const m of modules) {
    totalWords += countWords(m.intro) + countWords(m.body) + countWords(m.summary);
  }

  return {
    slug: slugify(title),
    title,
    description: meta.description || plainExcerpt(briefBlocks) || meta.tagline || '',
    tagline: meta.tagline || '',
    level: Number.isFinite(level) ? Math.min(Math.max(level, 1), 5) : 1,
    order: Number.isFinite(order) ? order : 0,
    brief: briefBlocks,
    outcomes,
    modules,
    summary: courseSummary,
    finalQuiz,
    readingMinutes: Math.max(1, Math.round(totalWords / 200)),
  };
}

function splitBriefOutcomes(lines: string[]): { brief: string[]; outcomes: string[] } {
  const brief: string[] = [];
  const outcomes: string[] = [];
  let mode: 'brief' | 'outcomes' = 'brief';
  for (const line of lines) {
    if (/^\s*(Brief|Introduction|Overview)\s*:\s*$/i.test(line)) {
      mode = 'brief';
      continue;
    }
    if (/^\s*(Outcomes|You will|Objectives|What you.?ll learn)\s*:\s*$/i.test(line)) {
      mode = 'outcomes';
      continue;
    }
    if (mode === 'outcomes') {
      const item = isBulletItem(line);
      if (item !== null) outcomes.push(inline(item));
      else if (line.trim() !== '') outcomes.push(inline(line.trim()));
    } else {
      brief.push(line);
    }
  }
  return { brief, outcomes };
}
