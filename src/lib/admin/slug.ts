/**
 * A URL slug from a title: `Dormência 48h` → `dormencia-48h`. Its own module so the
 * admin's browser script can preview the address without pulling in the YAML parser.
 */
export const slugFrom = (title: string): string =>
  title.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
