'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Code,
} from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

type ToolButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
};

function ToolButton({ onClick, active, disabled, label, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-boss-text-muted transition-colors hover:bg-boss-elevated hover:text-boss-text disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-boss-primary/20 text-boss-primary' : ''
      }`}
    >
      {children}
    </button>
  );
}

export default function RichEditor({ value, onChange, placeholder, minHeight = 220 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? '내용을 입력하세요...' }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-boss-primary underline' } }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-sm max-w-none px-4 py-3 focus:outline-none prose-p:my-2 prose-headings:text-boss-text prose-strong:text-boss-text prose-blockquote:border-l-emerald-500',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) {
    return (
      <div
        className="rounded-lg border border-boss-border bg-boss-surface"
        style={{ minHeight: minHeight + 44 }}
      />
    );
  }

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL을 입력하세요', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-boss-border bg-boss-surface focus-within:border-boss-primary/30 focus-within:ring-2 focus-within:ring-emerald-500/10">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-boss-border bg-boss-elevated/60 px-2 py-1.5">
        <ToolButton
          label="실행 취소"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 size={15} />
        </ToolButton>
        <ToolButton
          label="다시 실행"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 size={15} />
        </ToolButton>

        <span className="mx-1 h-5 w-px bg-boss-elevated" />

        <ToolButton
          label="제목 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 size={15} />
        </ToolButton>
        <ToolButton
          label="제목 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
        >
          <Heading3 size={15} />
        </ToolButton>

        <span className="mx-1 h-5 w-px bg-boss-elevated" />

        <ToolButton
          label="굵게"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <Bold size={15} />
        </ToolButton>
        <ToolButton
          label="기울임"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <Italic size={15} />
        </ToolButton>
        <ToolButton
          label="취소선"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
        >
          <Strikethrough size={15} />
        </ToolButton>
        <ToolButton
          label="코드"
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
        >
          <Code size={15} />
        </ToolButton>

        <span className="mx-1 h-5 w-px bg-boss-elevated" />

        <ToolButton
          label="순서 없는 목록"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <List size={15} />
        </ToolButton>
        <ToolButton
          label="순서 있는 목록"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          <ListOrdered size={15} />
        </ToolButton>
        <ToolButton
          label="인용"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <Quote size={15} />
        </ToolButton>

        <span className="mx-1 h-5 w-px bg-boss-elevated" />

        <ToolButton label="링크" onClick={setLink} active={editor.isActive('link')}>
          <LinkIcon size={15} />
        </ToolButton>
      </div>

      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
