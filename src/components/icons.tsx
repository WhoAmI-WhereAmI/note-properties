/**
 * The icons Obsidian shows before each property, by type (Lucide, ISC licence:
 * https://lucide.dev/license). Obsidian themes size and colour them through
 * `.metadata-property-icon` and `.svg-icon`.
 */
const ICONS: Record<string, [name: string, svg: string]> = {
  text: ["text", "<path d='M21 5H3'/><path d='M15 12H3'/><path d='M17 19H3'/>"],
  multitext: [
    "list",
    "<path d='M3 5h.01'/><path d='M3 12h.01'/><path d='M3 19h.01'/><path d='M8 5h13'/><path d='M8 12h13'/><path d='M8 19h13'/>",
  ],
  number: [
    "binary",
    "<rect x='14' y='14' width='4' height='6' rx='2'/><rect x='6' y='4' width='4' height='6' rx='2'/><path d='M6 20h4'/><path d='M14 10h4'/><path d='M6 14h2v6'/><path d='M14 4h2v6'/>",
  ],
  checkbox: [
    "check-square",
    "<path d='M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344'/><path d='m9 11 3 3L22 4'/>",
  ],
  date: [
    "calendar",
    "<path d='M8 2v3'/><path d='M16 2v3'/><rect x='3' y='3' width='18' height='18' rx='2'/><path d='M3 9h18'/>",
  ],
  datetime: ["clock", "<circle cx='12' cy='12' r='10'/><path d='M12 6v6l4 2'/>"],
  tags: [
    "tags",
    "<path d='M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z'/><path d='M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193'/><circle cx='10.5' cy='6.5' r='.5' fill='currentColor'/>",
  ],
  aliases: ["forward", "<path d='m15 17 5-5-5-5'/><path d='M4 18v-2a4 4 0 0 1 4-4h12'/>"],
};

export function PropertyIcon({ type }: { type: string }) {
  const [name, svg] = ICONS[type] ?? ICONS.text!;
  return (
    <span class="metadata-property-icon" aria-hidden="true">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class={`svg-icon lucide-${name}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </span>
  );
}
