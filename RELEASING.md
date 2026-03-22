# Releasing

## Steps

1. Bump the version in `library/package.json`
2. Update `library/CHANGELOG.md` with the new version and changes
3. Run `node scripts/run.js` from the repo root to update:
   - Coverage badge in `library/README.md`
   - Bundle size badge in `library/README.md`
   - Version badge in `library/README.md`
   - Version string on the website (`gorgonjs.dev/src/pages/index.astro`)
4. Commit all changes and tag the release (e.g. `git tag v1.6.0`)
5. Push the commit and tag (`git push && git push --tags`)
6. Publish from the library directory: `cd library && npm publish`

## Sub-packages

If releasing sub-packages (`clients/react`, `providers/file`, `plugins/clearlink`), bump their versions and publish separately from their directories. They each have their own `CHANGELOG.md` and `prepublish` script that runs `vite build`.
