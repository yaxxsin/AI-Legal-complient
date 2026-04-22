import { redirect } from 'next/navigation';

/**
 * /checklist is now merged into /oss-wizard under the "Checklist KBLI" tab.
 * This redirect preserves existing bookmarks.
 */
export default function ChecklistPage() {
  redirect('/oss-wizard');
}
