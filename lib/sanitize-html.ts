import DOMPurify from 'isomorphic-dompurify'

const RICH_TEXT_ALLOWED_TAGS = [
  'a',
  'b',
  'blockquote',
  'br',
  'caption',
  'code',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]

const RICH_TEXT_ALLOWED_ATTR = [
  'alt',
  'class',
  'colspan',
  'href',
  'rel',
  'rowspan',
  'src',
  'target',
  'title',
]

const EMBED_ALLOWED_TAGS = ['a', 'div', 'iframe', 'img', 'p', 'span', 'strong']

const EMBED_ALLOWED_ATTR = [
  'allow',
  'allowfullscreen',
  'alt',
  'class',
  'frameborder',
  'height',
  'href',
  'loading',
  'rel',
  'sandbox',
  'src',
  'target',
  'title',
  'width',
]

const SANITIZE_URI_REGEX =
  /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i

function sanitizeHtml(
  value: string | null | undefined,
  allowedTags: string[],
  allowedAttrs: string[],
) {
  if (!value) {
    return ''
  }

  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttrs,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style'],
    FORBID_ATTR: ['style'],
    USE_PROFILES: { html: true },
    ALLOWED_URI_REGEXP: SANITIZE_URI_REGEX,
  })
}

export function sanitizeRichHtml(value: string | null | undefined) {
  return sanitizeHtml(value, RICH_TEXT_ALLOWED_TAGS, RICH_TEXT_ALLOWED_ATTR)
}

export function sanitizeEmbedHtml(value: string | null | undefined) {
  return sanitizeHtml(value, EMBED_ALLOWED_TAGS, EMBED_ALLOWED_ATTR)
}
