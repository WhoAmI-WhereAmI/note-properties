import { describe, expect, it } from "vitest";
import { VFile } from "vfile";
import { NoteProperties } from "../src/transformer";
import type { BuildCtx, FullSlug } from "@quartz-community/types";
import type { NotePropertiesOptions } from "../src/types";

/** The properties view's data for a note whose frontmatter Quartz's built-in parsed. */
function propertiesOf(
  frontmatter: Record<string, unknown>,
  opts: Partial<NotePropertiesOptions> = {},
  { allSlugs = [] as string[], slug = "page", links = undefined as unknown } = {},
) {
  const ctx = {
    allSlugs: allSlugs as FullSlug[],
    cfg: {
      plugins: { transformers: [{ name: "Frontmatter" }] },
      configuration: { links },
    },
  } as unknown as BuildCtx;
  const plugin = NoteProperties(opts);
  const step = (plugin.markdownPlugins!(ctx)[0] as () => (t: unknown, f: VFile) => void)();
  const file = new VFile({ value: "", path: `${slug}.md` });
  file.data = { frontmatter, slug: slug as FullSlug } as VFile["data"];
  step(null, file);
  (plugin.htmlPlugins!(ctx)[0] as () => (t: unknown, f: VFile) => void)()(null, file);
  return file.data.noteProperties!;
}

const fm = { title: "T", description: "D", tags: ["a"], aliases: ["x"], status: "draft" };

describe("which properties are shown", () => {
  it("shows description, tags and aliases by default, in that order, if the note has them", () => {
    expect(propertiesOf(fm).properties).toEqual({ description: "D", tags: ["a"], aliases: ["x"] });
    expect(propertiesOf({ title: "T", tags: ["a"] }).properties).toEqual({ tags: ["a"] });
  });

  it("shows the includedProperties in their order, except the excludedProperties", () => {
    const opts = {
      includedProperties: ["status", "tags", "missing"],
      excludedProperties: ["tags"],
    };
    expect(Object.keys(propertiesOf(fm, opts).properties)).toEqual(["status"]);
  });

  it("with includeAll, shows every property except the excluded ones", () => {
    const opts = { includeAll: true, excludedProperties: ["title", "aliases"] };
    expect(Object.keys(propertiesOf(fm, opts).properties)).toEqual([
      "description",
      "tags",
      "status",
    ]);
  });
});

describe("per-note overrides", () => {
  it("reads quartz-properties and quartz-properties-collapse in either spelling", () => {
    expect(propertiesOf({ ...fm, quartzProperties: false })).toMatchObject({
      showProperties: false,
    });
    expect(propertiesOf({ ...fm, "quartz-properties-collapse": "true" })).toMatchObject({
      collapseProperties: true,
    });
    expect(propertiesOf({ ...fm, quartzPropertiesCollapse: "False" })).toMatchObject({
      collapseProperties: false,
    });
  });

  it("ignores values that are not booleans", () => {
    const data = propertiesOf({ ...fm, "quartz-properties": "maybe", quartzPropertiesCollapse: 1 });
    expect(data.showProperties).toBeUndefined();
    expect(data.collapseProperties).toBeUndefined();
  });

  it("keeps the override keys out of the table, also with includeAll", () => {
    const data = propertiesOf(
      {
        a: 1,
        quartzProperties: true,
        "quartz-properties-collapse": true,
        quartzPropertiesCollapse: true,
      },
      { includeAll: true },
    );
    expect(data.properties).toEqual({ a: 1 });
  });
});

describe("broken links in properties", () => {
  it("counts a link to a folder as a link to its index page", () => {
    const data = propertiesOf(
      { up: "[folder](notes/)", gone: "[g](missing/)" },
      { includeAll: true },
      { allSlugs: ["page", "notes/index"], links: { disableBrokenWikilinks: true } },
    );
    expect(data.brokenLinks).toEqual(["missing/"]);
  });
});
