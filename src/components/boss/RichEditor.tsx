'use client';

// tiptap 리치 에디터 — Industry 패턴
//
// 툴바: 사각 28px 버튼, 활성 = bg-boss-elevated text-boss-primary, 구분선은 보더색.
// 에디터 영역: boss-input 과 같은 톤(면색 #f2f2f3 · 테두리 16% · focus 시 accent 테두리).
// 본문 서식(p · h2 · h3 · 목록 · 인용 · 코드 · 링크)과 placeholder 는 tailwind 임의 변형으로 직접 준다 —
// 이 프로젝트에는 @tailwindcss/typography 가 없어 `prose` 는 아무 것도 하지 않는다.

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
      aria-pressed={active}
      className={`grid h-7 w-7 place-items-center transition-colors duration-[120ms] ease-out disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'bg-boss-elevated text-boss-primary'
          : 'text-boss-text-dim hover:bg-boss-hover hover:text-boss-text'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-4 w-px bg-boss-border" />;
}

// 에디터 본문(.ProseMirror) 서식 — 클래스는 tiptap 이 contenteditable 루트에 붙인다
const CONTENT_CLASS = [
  'min-h-[inherit] px-3 py-2.5 text-[14px] leading-[1.65] text-boss-text focus:outline-none',
  // 문단 · 제목
  '[&_p]:my-1.5',
  '[&_h2]:mt-4 [&_h2]:mb-1.5 [&_h2]:font-boss-head [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:tracking-[0.01em]',
  '[&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-boss-head [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:leading-tight [&_h3]:tracking-[0.01em]',
  // 목록
  '[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5',
  // 인용 · 코드
  '[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-boss-primary [&_blockquote]:pl-3 [&_blockquote]:text-boss-text-secondary',
  '[&_code]:bg-boss-hover [&_code]:px-1 [&_code]:py-px [&_code]:font-boss-head [&_code]:text-[13px]',
  '[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-boss-border [&_pre]:bg-boss-hover [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_hr]:my-3 [&_hr]:border-boss-border',
  '[&_a]:text-boss-primary [&_a]:underline [&_a]:underline-offset-2',
  // placeholder — tiptap 은 빈 첫 문단에 is-editor-empty + data-placeholder 를 붙인다
  '[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-boss-text-faint [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
].join(' ');

export default function RichEditor({ value, onChange, placeholder, minHeight = 220 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? '내용을 입력하세요…' }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-boss-primary underline' } }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: CONTENT_CLASS,
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
        className="border border-boss-border-strong bg-boss-inset"
        style={{ minHeight: minHeight + 40 }}
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
    <div className="border border-boss-border-strong bg-boss-inset transition-colors duration-[120ms] ease-out hover:border-boss-border-hover focus-within:!border-boss-primary">
      <div
        role="toolbar"
        aria-label="서식"
        className="sticky top-0 z-10 flex flex-wrap items-center gap-px border-b border-boss-border bg-boss-bg px-1.5 py-1"
      >
        <ToolButton
          label="실행 취소"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 size={14} strokeWidth={1.75} />
        </ToolButton>
        <ToolButton
          label="다시 실행"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 size={14} strokeWidth={1.75} />
        </ToolButton>

        <Divider />

        <ToolButton
          label="제목 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 size={14} strokeWidth={1.75} />
        </ToolButton>
        <ToolButton
          label="제목 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
        >
          <Heading3 size={14} strokeWidth={1.75} />
        </ToolButton>

        <Divider />

        <ToolButton
          label="굵게"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <Bold size={14} strokeWidth={1.75} />
        </ToolButton>
        <ToolButton
          label="기울임"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <Italic size={14} strokeWidth={1.75} />
        </ToolButton>
        <ToolButton
          label="취소선"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
        >
          <Strikethrough size={14} strokeWidth={1.75} />
        </ToolButton>
        <ToolButton
          label="코드"
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
        >
          <Code size={14} strokeWidth={1.75} />
        </ToolButton>

        <Divider />

        <ToolButton
          label="순서 없는 목록"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <List size={14} strokeWidth={1.75} />
        </ToolButton>
        <ToolButton
          label="순서 있는 목록"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          <ListOrdered size={14} strokeWidth={1.75} />
        </ToolButton>
        <ToolButton
          label="인용"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <Quote size={14} strokeWidth={1.75} />
        </ToolButton>

        <Divider />

        <ToolButton label="링크" onClick={setLink} active={editor.isActive('link')}>
          <LinkIcon size={14} strokeWidth={1.75} />
        </ToolButton>
      </div>

      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
