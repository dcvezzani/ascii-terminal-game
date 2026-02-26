# Publish @dcvezzani/ascii-tag to npm

## Pre-publish

1. **Tests**: Run the full test suite and ensure all tests pass.
   ```bash
   npm test
   ```

2. **Version**: Bump version in `package.json` using [semver](https://semver.org/):
   - **Major**: Breaking changes
   - **Minor**: New features or moderate changes with backward compatibility
   - **Patch**: Bug fixes and small changes

## Publish

1. **Log in** to npm (if not already):
   ```bash
   npm login
   ```

2. **Publish** (first publish of a scoped package may require `--access public`):
   ```bash
   npm publish --access public
   ```

   For subsequent publishes:
   ```bash
   npm publish
   ```

3. **Verify**: Install and run from another directory:
   ```bash
   npx @dcvezzani/ascii-tag --version
   npx @dcvezzani/ascii-tag init
   ```

## Smoke test (optional)

Before publishing, unpack the tarball and run the CLI:

```bash
npm pack
tar -xzf dcvezzani-ascii-tag-*.tgz
cd package
node bin/ascii-tag --version
node bin/ascii-tag --help
```
