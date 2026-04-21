'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Quote } from 'lucide-react';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 mb-2 border rounded-xl bg-muted/30">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded-lg hover:bg-muted transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}`}
        title="H1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-lg hover:bg-muted transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}`}
        title="H2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded-lg hover:bg-muted transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}`}
        title="H3"
      >
        <Heading3 className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-border mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg hover:bg-muted transition-colors ${editor.isActive('bold') ? 'bg-muted' : ''}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg hover:bg-muted transition-colors ${editor.isActive('italic') ? 'bg-muted' : ''}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-border mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg hover:bg-muted transition-colors ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
        title="Bulleted List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg hover:bg-muted transition-colors ${editor.isActive('orderedList') ? 'bg-muted' : ''}`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded-lg hover:bg-muted transition-colors ${editor.isActive('blockquote') ? 'bg-muted' : ''}`}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
    </div>
  );
};

export function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3 rounded-xl border border-input bg-background',
      },
    },
    onUpdate: ({ editor }) => {
      // Tiptap outputs HTML. Given that the knowledge base currently uses simple markdown,
      // using HTML output requires us to NOT pass it through renderBody if it's already HTML.
      // Easiest is to output HTML directly.
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="w-full relative">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
