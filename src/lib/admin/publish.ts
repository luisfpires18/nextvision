/**
 * Can the owners publish what is waiting on `dev` — and what is it, in their words?
 *
 * Publishing merges ALL of `dev` into `master`. So the owners' button may only do it when
 * everything waiting is theirs: every commit made by the admin's GitHub App, and every
 * changed file a page-content file. Anything else waiting — code merged by the developer,
 * a workflow change, a commit by a person — and the button refuses and says why, so an
 * owner can never release technical work by accident (decision A3).
 *
 * Both conditions, not either: the author is what GitHub maps the commit to, and the file
 * list is what the merge would actually change.
 *
 * Pure: the GitHub answers come in as data, so `npm run test:admin` proves every rule.
 */

import { SCREEN_LABELS, type PageFileName } from './fields.ts';

/** The admin's GitHub App, as GitHub names it on the commits it makes. */
export const ADMIN_BOT = 'nvf-admin-luisfpires18[bot]';
/**
 * What an owner action may change: page content, and — since A4 — the uploads list and
 * the media manifest that processing an upload writes. Nothing else, ever.
 */
const CONTENT_FILE = /^(src\/content\/page-content\/[a-z-]+\.json|src\/data\/media-uploads\.json|src\/data\/media-manifest\.json)$/;

export interface Waiting {
  commits: { sha: string; author: string | null; message: string; date: string }[];
  files: string[];
}

export interface Assessment {
  /** Owner saves, newest first, as the owners would describe them. */
  items: { sha: string; page: string; fields: string; by: string | null; date: string }[];
  /** Why publishing is refused. Empty means it may go ahead. */
  blocked: string[];
}

export function assess({ commits, files }: Waiting): Assessment {
  const blocked: string[] = [];
  const foreignCommits = commits.filter((c) => c.author !== ADMIN_BOT);
  const foreignFiles = files.filter((f) => !CONTENT_FILE.test(f));
  if (foreignCommits.length) {
    blocked.push(`${foreignCommits.length} ${foreignCommits.length === 1 ? 'alteração técnica' : 'alterações técnicas'} do programador ainda por rever.`);
  }
  if (foreignFiles.length && !foreignCommits.length) {
    // Owner commits that touched something other than content: should be impossible, so say so.
    blocked.push('Há ficheiros alterados fora dos conteúdos das páginas.');
  }

  const items = commits
    .filter((c) => c.author === ADMIN_BOT)
    .map((c) => {
      const [subject = '', ...rest] = c.message.split('\n');
      const m = /^content\(([a-z-]+)\): (.*)$/.exec(subject);
      const by = /Guardado no admin por (.+)\.$/m.exec(rest.join('\n'))?.[1] ?? null;
      return {
        sha: c.sha,
        page: m ? (SCREEN_LABELS[m[1] as PageFileName] ?? m[1]!) : subject,
        fields: m?.[2] ?? '',
        by,
        date: c.date,
      };
    })
    .reverse();

  return { items, blocked };
}
