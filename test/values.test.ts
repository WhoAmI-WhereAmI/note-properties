import { describe, expect, it, vi } from "vitest";

vi.mock("../src/components/styles/noteProperties.scss", () => ({ default: "" }));
vi.mock("../src/components/scripts/noteProperties.inline", () => ({ default: "" }));

import NotePropertiesComponent from "../src/components/NoteProperties";

type VNode = { type: unknown; props: Record<string, unknown> & { children?: unknown } };

/** Render a vnode tree to HTML-ish text (enough to compare the values' markup). */
function html(node: unknown): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(html).join("");
  const v = node as VNode;
  if (typeof v.type === "function") return html((v.type as (p: unknown) => unknown)(v.props));
  const attrs = Object.entries(v.props)
    .filter(([k, val]) => k !== "children" && val !== undefined && val !== false)
    .map(([k, val]) => ` ${k}="${String(val)}"`)
    .join("");
  return `<${String(v.type)}${attrs}>${html(v.props.children)}</${String(v.type)}>`;
}

type NoteProps = {
  properties: Record<string, unknown>;
  hideView?: boolean;
  showProperties?: boolean;
  resolvedLinks?: Record<string, string>;
  brokenLinks?: string[];
};

function render(noteProperties: NoteProps, slug = "folder/page") {
  const fileData = { slug, noteProperties };
  return NotePropertiesComponent()({
    fileData,
    allFiles: [fileData],
    cfg: { locale: "en-US" },
  } as never);
}

/** The markup inside the value cell of property `key`. */
function value(properties: Record<string, unknown>, extra: Partial<NoteProps> = {}): string {
  const out = html(render({ properties, ...extra }));
  const cell = out.match(
    /data-property-type="[^"]*">(.*?)<\/div><\/div>(?=<div class="note-properties-row|<\/div><\/div><\/details>)/,
  );
  return cell?.[1] ?? out;
}

describe("links in text values", () => {
  it("links a wikilink to the page it resolves to, by its alias", () => {
    expect(
      value(
        { up: "See [[Other Note|the other]] too" },
        {
          resolvedLinks: { "other-note": "../notes/other-note" },
        },
      ),
    ).toBe(
      '<div class="metadata-input-longtext"><span class="note-properties-text">See <a href="../notes/other-note" class="internal internal-link note-properties-link">the other</a> too</span></div>',
    );
  });

  it("links an unresolved wikilink relative to the page", () => {
    expect(value({ up: "[[Other Note]]" })).toContain(
      '<a href="../other-note" class="internal internal-link note-properties-link">Other Note</a>',
    );
  });

  it("marks a link to a page that doesn't exist (disableBrokenWikilinks)", () => {
    expect(value({ up: "[[Gone]]" }, { brokenLinks: ["gone"] })).toContain(
      'class="internal internal-link note-properties-link broken"',
    );
  });

  it("links Markdown links: internal ones as resolved, external ones in a new tab", () => {
    const out = value(
      { src: "[home](index.md) and [docs](https://example.com/docs) and [](x.md)" },
      { resolvedLinks: { "index.md": "../", "x.md": "../x" } },
    );
    expect(out).toContain(
      '<a href="../" class="internal internal-link note-properties-link">home</a> and ',
    );
    expect(out).toContain(
      '<a href="https://example.com/docs" class="external external-link note-properties-link" target="_blank" rel="noopener noreferrer">docs</a>',
    );
    // an empty label shows the target
    expect(out).toContain(">x.md</a>");
  });

  it("links bare URLs, but not the URL of a Markdown link a second time", () => {
    const out = value({ src: "Visit https://a.example/x, or [b](https://b.example)." });
    expect(out.match(/<a /g)).toHaveLength(2);
    expect(out).toContain('<a href="https://a.example/x," class="external');
    expect(out).toContain(">b</a>.</span>");
  });

  it("keeps the text around links in order", () => {
    const out = value({ src: "https://u.example [[A]] mid [m](m.md) end" });
    expect(out.replace(/<[^>]+>/g, "")).toBe("https://u.example A mid m end");
  });

  it("leaves plain text as it is", () => {
    expect(value({ s: "no links" })).toBe(
      '<div class="metadata-input-longtext"><span class="note-properties-text">no links</span></div>',
    );
  });
});

describe("other values", () => {
  it("shows empty list items as Obsidian's empty marker, and objects as JSON", () => {
    expect(value({ list: [null, 3, { a: 1 }] })).toBe(
      '<div class="multi-select-container note-properties-list">' +
        '<div class="multi-select-pill"><div class="multi-select-pill-content"><span class="note-properties-empty">—</span></div></div>' +
        '<div class="multi-select-pill"><div class="multi-select-pill-content"><span class="note-properties-number">3</span></div></div>' +
        '<div class="multi-select-pill"><div class="multi-select-pill-content"><span class="note-properties-object"><code>{"a":1}</code></span></div></div>' +
        "</div>",
    );
  });

  it("shows a number as Obsidian's number input", () => {
    expect(value({ n: 0 })).toBe(
      '<div class="metadata-input metadata-input-number note-properties-number">0</div>',
    );
  });

  it("shows an empty value as the empty marker", () => {
    expect(value({ x: null })).toContain('<span class="note-properties-empty">—</span>');
  });

  // bug: a note with an empty `tags:` (or `aliases:`) line, common in Obsidian templates, keeps
  // `tags: null` in its frontmatter (Quartz's Frontmatter built-in only replaces non-empty
  // values), and the properties view, which shows tags and aliases by default, calls `.map` on
  // it: rendering the page throws.
  it.fails("renders an empty tags or aliases property", () => {
    expect(() => render({ properties: { tags: null } })).not.toThrow();
    expect(() => render({ properties: { aliases: null } })).not.toThrow();
  });
});

describe("whether the properties view is shown", () => {
  const props = { properties: { a: "b" } };
  it("hides it with hidePropertiesView, unless the note says to show it", () => {
    expect(render({ ...props, hideView: true })).toBeNull();
    expect(render({ ...props, hideView: true, showProperties: true })).not.toBeNull();
    expect(render({ ...props, showProperties: false })).toBeNull();
    expect(render({ ...props })).not.toBeNull();
  });

  it("hides it for a note without properties", () => {
    expect(render({ properties: {} })).toBeNull();
  });

  it("counts the properties", () => {
    const out = html(render({ properties: { a: 1, b: 2 } }));
    expect(out).toContain('data-property-count="2"');
    expect(out).toContain('<span class="note-properties-count">2</span>');
  });
});
