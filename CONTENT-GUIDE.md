# Adding content — drop in a `.txt`, get a finished page

Soul Seeking builds its Knowledge Hub and Courses **automatically** from plain
text files. Drop a `.txt` into the right folder, rebuild (or it rebuilds on
deploy), and a new article or course appears — in its hub/tab, with its own
URL, and laid out exactly like the others. No code, no config.

- **Articles** → `content/knowledge/*.txt` → appears in the Knowledge Hub and at
  `/knowledge/<slug>`.
- **Courses** → `content/courses/*.txt` → appears as a tab on `/courses` and as
  a full reader at `/courses/<slug>`.

The parser (`src/lib/parser.ts`) is **forgiving** — rough files still come out
consistent. The conventions below are all optional niceties on top of "just
write".

---

## File naming

`NN-some-title.txt` — the leading number sets the order (lower = earlier) and is
stripped from the title. Example: `07-the-breath-between-thoughts.txt`.

## Optional header (any of these, top of file)

```
Title: The Breath Between Thoughts      (else: first title-like line, else filename)
Category: Foundations                   (articles; groups them in the hub. default "Reflections")
Order: 7                                 (else taken from the NN- filename prefix)
Quote: A single line shown as an epigraph
Description: One-line summary for cards and search
Course: A Rough Test Course             (courses; the course title)
Tagline: A short subtitle               (courses)
Level: 1                                 (courses; 1–5 → Foundation…Mastery)
```

No header at all is fine. If the first line looks like a title (short, no ending
punctuation) it becomes the title; otherwise the filename is used.

## Body — write naturally

| You write | You get |
|---|---|
| `# Heading` / `== Heading ==` / a SHORT ALL-CAPS LINE | a section heading |
| a blank line between paragraphs | separate paragraphs (first = lead, drop-cap) |
| `- item` or `* item` | a bulleted list |
| `1. item` | a numbered list |
| `> quoted line` and `> — Source` | a pull-quote with citation |
| `**bold**`, `*italic*`, `_italic_` | inline emphasis |
| `---` | a divider |
| a `Glossary` heading, then `Term — meaning` lines | a glossary panel |

## Courses — chapters & quizzes

Split modules with `## Chapter Title`. Inside a module, optional labels:

```
## First Steps
Intro:
A short introduction.

Body:
The main text. **Bold** and lists work here too.
- a point
- another

Glossary:
Atman — the Self

Quiz:
Q: Does this build automatically?
- Yes (correct)
- No
Explain: Optional explanation shown after answering.
```

Also recognised at course level: `## Course Summary` and `## Course Quiz`.
Reading time, module/term/quiz counts and the course map are all derived
automatically.

---

That's it. Add a file, and the hub/tab, the route, the search index, the
sitemap and the layout update themselves on the next build.
