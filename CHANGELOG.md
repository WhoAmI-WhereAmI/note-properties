# Changelog

## 1.2.3

### Patch Changes

- ae56ee7: Bundles `@quartz-community/utils` 1.3.2: links to blocks are `#^id` (they were `#id`, which a heading of the same name could take), matching the block ids that rehype-obsidian 1.6 writes.

## 1.2.2

### Patch Changes

- ee3e5c6: Bundles utils 1.3.1: `slugs.stripDiacritics` now strips accents from Latin letters only and writes ł, ø, ß, æ … in ASCII; other scripts are left as written.

## 1.2.1

### Patch Changes

- a83f944: Bundles `@quartz-community/utils` 1.3, so `configuration.slugs.stripDiacritics` (Quartz 5.3) also applies to tags and links in properties. Before, the plugin bundled an older utils that ignored the option, and its slugs kept their diacritics.

## 1.2.0

### Minor Changes

- 9c0f291: The properties block uses Obsidian's markup, so Obsidian themes (through @quartz-themes/core) style it as they style Obsidian's: `.metadata-container` with `.metadata-properties-heading` and `.metadata-content > .metadata-properties > .metadata-property[data-property-key]`, keys in `.metadata-property-key-input` after Obsidian's type icon (`.metadata-property-icon`), values in `.metadata-property-value[data-property-type]` as multi-select pills (tags, aliases, lists), long text, number, checkbox or date, and `is-collapsed` when collapsed. It still collapses without JavaScript and looks the same without an Obsidian theme. Custom CSS written for the previous `<table>` (`.note-properties-table`, `td`) needs updating; the `note-properties-*` classes are kept.

## 1.1.5

### Patch Changes

- bb307e5: With `configuration.links.disableBrokenWikilinks`, links in properties to pages that don't exist get the `broken` class, as links in the note's body do (jackyzha0/quartz#2635).

## 1.1.4

### Patch Changes

- 6a70a55: Uses Quartz's own `preact` instead of bundling a second copy (`noExternal` in the build overrode the externals). Components now share one Preact instance with Quartz and other plugins, so hooks and context work across them, and the bundle is smaller.

## 1.1.3

### Patch Changes

- 49cfaea: Bundles `@quartz-community/utils` 1.1.0: a short wikilink to an Obsidian folder note (`[[Topic]]` for `Topic/Topic.md`) reaches the folder page, and anchors to headings use the same slug as heading ids. `github-slugger` is no longer a dependency of this plugin.

## 1.1.2

### Patch Changes

- 808892b: The published bundle no longer contains gray-matter's JavaScript frontmatter parser (an `eval` that security scanners flag). It was never used: the plugin parses YAML and TOML itself and refuses JavaScript frontmatter. The bundle is also about 100 KB smaller.

## 1.1.1

### Patch Changes

- d13bba8: Security: frontmatter can no longer run code during a build (#4). On Quartz versions without built-in frontmatter parsing, where this plugin parses frontmatter itself, a note starting with `---js` or `---javascript` had its frontmatter evaluated as JavaScript (gray-matter's default engine). It's now refused with an error. Quartz 5.1 parses frontmatter itself and has the same fix.

## 1.1.0

### Minor Changes

- 163c5f6: Use Quartz's built-in frontmatter parsing when available (Quartz 5.1+): the plugin then only builds the properties view from `file.data.frontmatter`, and disabling it no longer breaks titles, tags, aliases or drafts. On older Quartz versions it parses frontmatter itself as before. The `delimiters` / `language` options are deprecated in favour of `configuration.frontmatter`.

### Patch Changes

- 7719c30: Tags in the properties view link to their tag page only when the site has one (the tag-page plugin or a hand-written page); otherwise they are shown as text instead of a link to a missing page. A tag with child tags links straight to `tags/<tag>/`.
- d756c6b: `toml` 5 (prototype pollution and DoS advisories), matching Quartz core. Only used for TOML frontmatter on Quartz versions without built-in frontmatter.

## 1.0.0

### Major Changes

- Stable 1.0 release. All `@quartz-community/*` dependencies now use `^1.0.0` ranges.

  Pre-1.0 caret ranges pinned the minor version (`^0.2.1` means `>=0.2.1 <0.3.0`), so
  published fixes to shared packages could never be resolved by dependents. Moving the
  ecosystem to 1.0 makes caret ranges behave conventionally.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial Quartz community plugin template.

### Fixed

- Frontmatter wikilinks containing spaces are now correctly slugified instead of rendering with `%20` in the href. `[[My Note]]` in a frontmatter property now renders as `./my-note` instead of `./My%20Note`.

### Changed

- **BREAKING (inherited from `@quartz-community/utils`)**: tag URLs and frontmatter-wikilink slugs are now lowercased to match Obsidian's case-insensitive matching. Tags `#MyTag`, `#mytag`, and `#MYTAG` collapse into a single tag page `tags/mytag`.
- Replaced the plugin's local slugification helpers with the shared `@quartz-community/utils` versions to eliminate drift across the Quartz ecosystem.
