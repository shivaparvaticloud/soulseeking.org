SOUL SEEKING — HOW TO ADD CONTENT
=================================

You never touch code to publish. Drop a plain .txt file into one of these
folders and the site rebuilds it into a fully formatted, searchable page:

  content/knowledge/   ->  an article in the Knowledge Hub
  content/courses/     ->  a course "book" in the Courses Hub

On the live site, "rebuild" happens automatically: commit + push the file and
Cloudflare Pages redeploys in a minute or two. While editing locally, run
`npm run dev` and the page updates the instant you save.

Filenames: a leading number sets the order, e.g. "01-the-inward-search.txt".
The rest of the name becomes a fallback title if you don't give one.

The parser is forgiving — even plain prose looks good. The more of the simple
conventions below you use, the richer the layout becomes.


-----------------------------------------------------------------------------
1) KNOWLEDGE ARTICLE
-----------------------------------------------------------------------------

Optional header lines at the very top (any you omit are auto-filled):

  Title: The Inward Search
  Category: Foundations
  Order: 1
  Author: Soul Seeking
  Quote: Who looks outside, dreams; who looks inside, awakes. — C.G. Jung
  Description: A short summary used for previews and search.

Then write freely. Formatting the parser understands:

  == A Section Heading ==        (or use  ## Heading  or a LINE IN ALL CAPS)
  Plain paragraphs separated by a blank line.
  The first paragraph becomes a large lead with a drop-cap.

  - bullet lists start with a dash
  1. numbered lists start with a number

  > A line beginning with > becomes a pull-quote.
  > — Attribution on its own > line becomes the citation.

  **bold**, *italic* and _italic_ work inside any paragraph.

  ---  on its own line draws a decorative divider.

Glossary: add a heading called "Glossary" and list terms underneath as
"term : meaning" (a colon, dash or em-dash all work):

  == Glossary ==
  Atman : the true Self; the eternal soul
  Kosa : a sheath or covering that veils the Self


-----------------------------------------------------------------------------
2) COURSE
-----------------------------------------------------------------------------

Header lines:

  Course: Pañca Maya Kośa
  Tagline: The Five Sheaths of the Embodied Soul
  Level: 2
  Order: 1
  Description: A short summary for the Courses Hub.

A course brief (shown on the title page) and learning outcomes:

  Brief:
  One or more paragraphs introducing the course.

  Outcomes:
  - What the seeker will understand by the end
  - Another outcome

Each module is a chapter. Start one with a level-2 heading "## ":

  ## Module: The Model of the Embodied Soul

Inside a module, switch parts with a label on its own line:

  Intro:
  Overview paragraphs for the module.

  Body:
  == A Sub-heading ==
  In-depth teaching. Use headings, lists and quotes freely.

  Glossary:
  Ksetra : the field; the body
  Ksetrajna : the knower of the field

  Summary:
  - A conclusive statement
  - Another key point

  Quiz:
  Q: What does kosa mean?
  - a sheath or covering *
  - a planet
  - a mantra
  Explain: Kosa means sheath; the Self is veiled by five of them.

Mark the correct quiz option with a trailing  *  (or [x]).

Close the book with a course summary and a final quiz:

  ## Course Summary:
  Concluding paragraphs that tie the whole journey together.

  ## Course Quiz:
  Q: ...
  - option *
  - option

That's it. Save the file, and the title page, table of contents, journey map,
chapter layouts, glossaries, quizzes and the scroll progress bar are all
generated for you.
