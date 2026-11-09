# @quartz-community/note-properties

Renders frontmatter properties as a visible properties view on the page, similar to Obsidian's properties panel.

> [!NOTE]
> Quartz 5.1+ parses frontmatter itself (built-in, configured under `configuration.frontmatter`). On those
> versions this plugin only builds and renders the properties view; disabling it no longer breaks titles,
> tags, aliases or drafts. On older Quartz versions it still parses frontmatter as before.

## Installation

```bash
npx quartz plugin add @quartz-community/note-properties
```

## Usage

This plugin serves as both a **transformer** (collecting the properties to show, resolving links in them) and a **component** (displaying the properties view). One entry configures both: `options` applies to the transformer and the component, `layout` places the component. It is already enabled in the default `quartz.config.yaml`:

```yaml title="quartz.config.yaml"
plugins:
  - source: "@quartz-community/note-properties"
    enabled: true
    options:
      includeAll: false
      includedProperties:
        - description
        - tags
        - aliases
      excludedProperties: []
      hidePropertiesView: false
    order: 5
    layout:
      position: beforeBody
      priority: 15
      display: all
```

## Configuration

| Option               | Type                         | Default                              | Description                                                                                                                                   |
| -------------------- | ---------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `includeAll`         | `boolean`                    | `false`                              | Whether to include all frontmatter properties.                                                                                                |
| `includedProperties` | `string[]`                   | `["description", "tags", "aliases"]` | Properties to include when `includeAll` is `false`.                                                                                           |
| `excludedProperties` | `string[]`                   | `[]`                                 | Properties to always exclude, whether they come from `includeAll` or `includedProperties`.                                                    |
| `hidePropertiesView` | `boolean`                    | `false`                              | Hide the properties view by default (it can still be shown per note). To never show it, disable the plugin; frontmatter is parsed either way. |
| `collapsed`          | `boolean`                    | `false`                              | Start the properties view collapsed (it can still be expanded, and set per note).                                                             |
| `delimiters`         | `string \| [string, string]` | `"---"`                              | Quartz < 5.1 only: frontmatter delimiters. On 5.1+ set `configuration.frontmatter.delimiters`.                                                |
| `language`           | `"yaml" \| "toml"`           | `"yaml"`                             | Quartz < 5.1 only: frontmatter language. On 5.1+ set `configuration.frontmatter.language`.                                                    |

On Quartz 5.1+, `delimiters` and `language` left on this plugin are still applied; `npx quartz plugin doctor --fix` moves them to `configuration.frontmatter`.

### Per-note overrides

- `quartz-properties` (or `quartzProperties`): `true` force-shows the view, `false` force-hides it, overriding `hidePropertiesView`.
- `quartz-properties-collapse` (or `quartzPropertiesCollapse`): `true` starts the view collapsed, `false` expanded, overriding `collapsed`.

These keys are left out of the properties table.

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/NoteProperties) and its [properties panel section](https://quartz.jzhao.xyz/plugins/Frontmatter#properties-panel-plugin-note-properties) for more information.

## License

MIT
