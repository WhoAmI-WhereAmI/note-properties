---
"@quartz-community/note-properties": patch
---

The published bundle no longer contains gray-matter's JavaScript frontmatter parser (an `eval` that security scanners flag). It was never used: the plugin parses YAML and TOML itself and refuses JavaScript frontmatter. The bundle is also about 100 KB smaller.
