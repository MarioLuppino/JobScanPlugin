# JobScan config

**Fixed location:** this file must live at `~/.claude/jobscan-data/jobscan-config.md`. The `job-search` and
`job-applications` skills read it first, every run, to resolve where your files are. Edit the values if you
move things.

```yaml
data_path: {{DATA_PATH}}        # where profile.md, profile-core.md, base-resumes/, cover-letter-voice.md,
                                # sources.md and ats/ (scanner config + caches) live
archive_path: {{ARCHIVE_PATH}}  # where numbered application folders, Job Search Digests/, and Applied Index.md live
```

Both paths are also how the ATS scripts find their files: `paths.mjs` reads `data_path` for
`<data_path>/ats/` and `archive_path` for `Applied Index.md`. Nothing personal is ever stored inside the
plugin, which a `/plugin update` replaces.

## Field/search overrides (optional)
- word_or_pages: {{word | pages}}   # which app they edit documents in; both open .docx
- firecrawl: {{connected | not-connected}}
- split_quota: {{e.g. 5 domestic / 5 international, or none}}
- fit_floor: {{e.g. 50}}

<!-- Personal/config data — never commit this file. It is git-ignored by default. -->
