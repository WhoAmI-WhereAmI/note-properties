---
"@quartz-community/note-properties": minor
---

The properties block uses Obsidian's markup, so Obsidian themes (through @quartz-themes/core) style it as they style Obsidian's: `.metadata-container` with `.metadata-properties-heading` and `.metadata-content > .metadata-properties > .metadata-property[data-property-key]`, keys in `.metadata-property-key-input` after Obsidian's type icon (`.metadata-property-icon`), values in `.metadata-property-value[data-property-type]` as multi-select pills (tags, aliases, lists), long text, number, checkbox or date, and `is-collapsed` when collapsed. It still collapses without JavaScript and looks the same without an Obsidian theme. Custom CSS written for the previous `<table>` (`.note-properties-table`, `td`) needs updating; the `note-properties-*` classes are kept.
