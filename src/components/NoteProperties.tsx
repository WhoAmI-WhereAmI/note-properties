import type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
} from "@quartz-community/types";
import { classNames } from "../util/lang";
import { resolveRelative, slugifyWikilinkTarget } from "../util/path";
import { i18n } from "../i18n";
import { PropertyIcon } from "./icons";
import style from "./styles/noteProperties.scss";
// @ts-expect-error - inline script import handled by Quartz bundler
import script from "./scripts/noteProperties.inline.ts";

export interface NotePropertiesComponentOptions {
  collapsed?: boolean;
}

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const MDLINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;
const URL_RE = /https?:\/\/[^\s<>]+/g;

type RenderCtx = {
  slug: string;
  resolvedLinks: Record<string, string>;
  /** Link targets whose page doesn't exist, with `disableBrokenWikilinks` on. */
  brokenLinks: Set<string>;
  /** The page listing a tag, if the site has one (see `tagPageFor`). */
  tagPage: (tag: string) => string | undefined;
};

/** Slugs of every page, generated tag pages included, cached per build's page list. */
const slugsOf = new WeakMap<object, Set<string>>();

/**
 * The page listing `tag`, if the site has one: `tags/<tag>`, or `tags/<tag>/index` for a tag with
 * child tags. Without the tag-page plugin (or a hand-written page) there is none, and the tag is
 * shown without a link rather than as a link to a page that does not exist.
 */
export function tagPageFor(tag: string, allFiles: { slug?: unknown }[]): string | undefined {
  let slugs = slugsOf.get(allFiles);
  if (!slugs) {
    slugs = new Set(allFiles.flatMap((file) => (typeof file.slug === "string" ? [file.slug] : [])));
    slugsOf.set(allFiles, slugs);
  }
  const found = slugs;
  return [`tags/${tag}`, `tags/${tag}/index`].find((slug) => found.has(slug));
}

function lookupHref(ctx: RenderCtx, slugifiedTarget: string): string {
  return ctx.resolvedLinks[slugifiedTarget] ?? resolveRelative(ctx.slug, slugifiedTarget);
}

function linkClass(ctx: RenderCtx, key: string): string {
  return classNames(
    "internal",
    "internal-link",
    "note-properties-link",
    ctx.brokenLinks.has(key) ? "broken" : undefined,
  );
}

function renderTextWithLinks(text: string, ctx: RenderCtx): (preact.JSX.Element | string)[] {
  const segments: { start: number; end: number; node: preact.JSX.Element }[] = [];
  for (const match of text.matchAll(WIKILINK_RE)) {
    const target = match[1]!;
    const display = match[2] ?? target;
    const key = slugifyWikilinkTarget(target);
    const href = lookupHref(ctx, key);
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      node: (
        <a href={href} class={linkClass(ctx, key)}>
          {display}
        </a>
      ),
    });
  }

  for (const match of text.matchAll(MDLINK_RE)) {
    const overlaps = segments.some(
      (s) => match.index < s.end && match.index + match[0].length > s.start,
    );
    if (overlaps) continue;
    const display = match[1]!;
    const href = match[2]!;
    const isExternal = href.startsWith("http://") || href.startsWith("https://");
    const resolvedHref = isExternal ? href : lookupHref(ctx, href);
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      node: (
        <a
          href={resolvedHref}
          class={
            isExternal
              ? classNames("external external-link", "note-properties-link")
              : linkClass(ctx, href)
          }
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {display || href}
        </a>
      ),
    });
  }

  for (const match of text.matchAll(URL_RE)) {
    const overlaps = segments.some(
      (s) => match.index < s.end && match.index + match[0].length > s.start,
    );
    if (overlaps) continue;

    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      node: (
        <a
          href={match[0]}
          class="external external-link note-properties-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {match[0]}
        </a>
      ),
    });
  }

  if (segments.length === 0) return [text];

  segments.sort((a, b) => a.start - b.start);

  const result: (preact.JSX.Element | string)[] = [];
  let cursor = 0;
  for (const seg of segments) {
    if (seg.start > cursor) {
      result.push(text.slice(cursor, seg.start));
    }
    result.push(seg.node);
    cursor = seg.end;
  }
  if (cursor < text.length) {
    result.push(text.slice(cursor));
  }

  return result;
}

/**
 * Obsidian's property types, inferred from the value (Obsidian reads them from
 * the vault's types.json). Themes style values by `data-property-type`.
 */
export function propertyType(key: string, value: unknown): string {
  if (key === "tags") return "tags";
  if (key === "aliases") return "aliases";
  if (Array.isArray(value)) return "multitext";
  if (typeof value === "boolean") return "checkbox";
  if (typeof value === "number") return "number";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "date";
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return "datetime";
  }
  return "text";
}

function renderScalar(value: unknown, ctx: RenderCtx): preact.JSX.Element | string {
  if (value === null || value === undefined) {
    return <span class="note-properties-empty">—</span>;
  }
  if (typeof value === "string") {
    return <span class="note-properties-text">{renderTextWithLinks(value, ctx)}</span>;
  }
  if (typeof value === "number") {
    return <span class="note-properties-number">{value}</span>;
  }
  if (typeof value === "boolean") {
    return <span class="note-properties-text">{String(value)}</span>;
  }
  if (typeof value === "object") {
    return (
      <span class="note-properties-object">
        <code>{JSON.stringify(value)}</code>
      </span>
    );
  }
  return String(value);
}

/** Obsidian's list values: pills in a `multi-select-container`. */
function renderPills(items: preact.JSX.Element[]): preact.JSX.Element {
  return (
    <div class="multi-select-container note-properties-list">
      {items.map((content) => (
        <div class="multi-select-pill">
          <div class="multi-select-pill-content">{content}</div>
        </div>
      ))}
    </div>
  );
}

function renderTags(tags: string[], ctx: RenderCtx): preact.JSX.Element {
  return renderPills(
    tags.map((tag) => {
      const page = ctx.tagPage(tag);
      return page ? (
        <a href={resolveRelative(ctx.slug, page)} class="internal tag-link note-properties-tag">
          {tag}
        </a>
      ) : (
        <span class="tag-link note-properties-tag">{tag}</span>
      );
    }),
  );
}

/** A list property's items: a single value counts as a one-item list. */
function listItems(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

function renderValue(type: string, value: unknown, ctx: RenderCtx): preact.JSX.Element {
  // An empty property (`key:` with no value, or an empty list), of any type: Obsidian's empty
  // marker rather than an empty or broken input. Quartz keeps `tags: null` / `aliases: null`
  // from an empty `tags:` line as they are.
  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
    return <div class="metadata-input-longtext">{renderScalar(null, ctx)}</div>;
  }
  switch (type) {
    case "tags":
      return renderTags(listItems(value).map(String), ctx);
    case "aliases":
    case "multitext":
      return renderPills(listItems(value).map((item) => <>{renderScalar(item, ctx)}</>));
    case "checkbox":
      return (
        <input
          type="checkbox"
          class="metadata-input-checkbox note-properties-boolean"
          checked={value as boolean}
          disabled
        />
      );
    case "number":
      return (
        <div class="metadata-input metadata-input-number note-properties-number">
          {String(value)}
        </div>
      );
    case "date":
    case "datetime":
      return (
        <div class="metadata-input metadata-input-text mod-date note-properties-text">
          {String(value)}
        </div>
      );
    default:
      return <div class="metadata-input-longtext">{renderScalar(value, ctx)}</div>;
  }
}

/** Obsidian's collapse chevron (lucide `right-triangle`). */
const CollapseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    stroke-width="0"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="svg-icon right-triangle"
    aria-hidden="true"
  >
    <path d="M3 8L12 17L21 8"></path>
  </svg>
);

export default ((opts?: NotePropertiesComponentOptions) => {
  const { collapsed = false } = opts ?? {};

  const Component: QuartzComponent = (props: QuartzComponentProps) => {
    const noteProps = props.fileData?.noteProperties as
      | {
          properties: Record<string, unknown>;
          hideView: boolean;
          showProperties?: boolean;
          collapseProperties?: boolean;
          resolvedLinks?: Record<string, string>;
          brokenLinks?: string[];
        }
      | undefined;
    if (!noteProps) return null;

    // Per-note override takes precedence over global config
    // showProperties: true = force show, false = force hide, undefined = follow hideView config
    if (noteProps.showProperties === false) return null;
    if (noteProps.showProperties !== true && noteProps.hideView) return null;

    const properties = noteProps.properties;
    const entries = Object.entries(properties);
    if (entries.length === 0) return null;

    const locale = props.cfg?.locale || "en-US";
    const i18nData = i18n(locale);
    const ctx: RenderCtx = {
      slug: (props.fileData?.slug as string) ?? "",
      resolvedLinks: noteProps.resolvedLinks ?? {},
      brokenLinks: new Set(noteProps.brokenLinks ?? []),
      tagPage: (tag) => tagPageFor(tag, props.allFiles ?? []),
    };

    // Per-note collapse override takes precedence over component option
    const isCollapsed = noteProps.collapseProperties ?? collapsed;
    // Obsidian's markup (`metadata-*`), which Obsidian themes style, in a
    // <details> so it collapses without JavaScript.
    return (
      <details
        class={classNames(
          props.displayClass,
          "note-properties",
          "metadata-container",
          isCollapsed ? "is-collapsed" : undefined,
        )}
        open={!isCollapsed}
        data-collapsed={isCollapsed}
        data-property-count={entries.length}
      >
        <summary class="note-properties-header metadata-properties-heading">
          <div class="collapse-indicator collapse-icon">
            <CollapseIcon />
          </div>
          <div class="note-properties-title metadata-properties-title">
            {i18nData.components.noteProperties.title}
          </div>
          <span class="note-properties-count">{entries.length}</span>
        </summary>
        <div class="metadata-content">
          <div class="metadata-properties">
            {entries.map(([key, value]) => {
              const type = propertyType(key, value);
              return (
                <div
                  key={key}
                  class="note-properties-row metadata-property"
                  data-property-key={key}
                >
                  <div class="note-properties-key metadata-property-key">
                    <PropertyIcon type={type} />
                    <span class="metadata-property-key-input">{key}</span>
                  </div>
                  <div
                    class="note-properties-value metadata-property-value"
                    data-property-type={type}
                  >
                    {renderValue(type, value, ctx)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </details>
    );
  };

  Component.css = style;
  Component.afterDOMLoaded = script;

  return Component;
}) satisfies QuartzComponentConstructor;
