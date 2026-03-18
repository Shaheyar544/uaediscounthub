'use client'

// FIX 3B: Lightweight rich text editor for product descriptions
// Uses Tiptap (already installed) with Bold, Italic, Lists, Headings, Links

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit                    from '@tiptap/starter-kit'
import Link                          from '@tiptap/extension-link'
import {
  Bold, Italic, List, ListOrdered,
  Heading2, Heading3, Link as LinkIcon, Unlink,
} from 'lucide-react'
import { useEffect, useCallback } from 'react'

interface ProductRichEditorProps {
  value:       string
  onChange:    (html: string) => void
  placeholder?: string
  dir?:        'ltr' | 'rtl'
}

const BTN = 'p-1.5 rounded-[6px] hover:bg-[#E8EEFF] text-[#4B5675] hover:text-[#0057FF] transition-colors'
const BTN_ACTIVE = 'bg-[#E8F0FF] text-[#0057FF]'

export function ProductRichEditor({
  value,
  onChange,
  placeholder = 'Write a detailed description...',
  dir = 'ltr',
}: ProductRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({ openOnClick: false }),
    ],
    content:          value || '',
    immediatelyRender: false,
    onUpdate:  ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: `min-h-[140px] px-3 py-2.5 text-[13px] text-[#0D1117] leading-relaxed focus:outline-none`,
        dir,
        'data-placeholder': placeholder,
      },
    },
  })

  // Sync external value changes (e.g. when edit page loads initial data)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current && value !== '<p></p>') {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href
    const url  = window.prompt('URL', prev || 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className="border-[1.5px] border-[#DDE3EF] rounded-[8px] overflow-hidden focus-within:border-[#0057FF] transition-colors bg-[#F6F8FC]">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#DDE3EF] bg-white flex-wrap">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${BTN} ${editor.isActive('bold') ? BTN_ACTIVE : ''}`} title="Bold">
          <Bold size={13} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${BTN} ${editor.isActive('italic') ? BTN_ACTIVE : ''}`} title="Italic">
          <Italic size={13} />
        </button>

        <div className="w-px h-4 bg-[#DDE3EF] mx-1" />

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${BTN} ${editor.isActive('heading', { level: 2 }) ? BTN_ACTIVE : ''}`} title="Heading 2">
          <Heading2 size={13} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${BTN} ${editor.isActive('heading', { level: 3 }) ? BTN_ACTIVE : ''}`} title="Heading 3">
          <Heading3 size={13} />
        </button>

        <div className="w-px h-4 bg-[#DDE3EF] mx-1" />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${BTN} ${editor.isActive('bulletList') ? BTN_ACTIVE : ''}`} title="Bullet list">
          <List size={13} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${BTN} ${editor.isActive('orderedList') ? BTN_ACTIVE : ''}`} title="Numbered list">
          <ListOrdered size={13} />
        </button>

        <div className="w-px h-4 bg-[#DDE3EF] mx-1" />

        <button type="button" onClick={setLink}
          className={`${BTN} ${editor.isActive('link') ? BTN_ACTIVE : ''}`} title="Add link">
          <LinkIcon size={13} />
        </button>
        {editor.isActive('link') && (
          <button type="button" onClick={() => editor.chain().focus().unsetLink().run()}
            className={BTN} title="Remove link">
            <Unlink size={13} />
          </button>
        )}

        <span className="ml-auto text-[10px] text-[#8A94A6]">
          {editor.storage.characterCount?.characters?.() ?? editor.getText().length} chars
        </span>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  )
}
