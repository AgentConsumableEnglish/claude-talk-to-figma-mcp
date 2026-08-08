# Changelog

This file records the changes worth knowing about.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-02-01

### Added
- **🚀 Unified Launcher**: A new `npx claude-talk-to-figma-mcp` command clones the repository, installs the dependencies and starts the server, in one step.
- **🛠️ Smart Bootstrapping**: The launcher looks for Bun, and offers to install it when it is missing.

### Fixed
- **🛡️ Type Safety**: The `FigmaCommand` union now lists every new tool, so TypeScript stops failing the build.
- **🏗️ CI/CD Permissions**: GitHub Actions now has write permission for DXT releases, which ends the 403 errors.

## [0.7.0] - 2026-01-31

### Added
- **🎨 Text Styles**: A new `set_text_style_id` tool applies a local text style to a node (Thanks to [Rob Dearborn](https://github.com/rfdearborn) - [PR #43](https://github.com/arinspunk/claude-talk-to-figma-mcp/pull/43))
- **🏷️ Rename Node**: A new `rename_node` tool helps keep a document tidy (Thanks to [Beomsu Koh](https://github.com/GoBeromsu) - [PR #36](https://github.com/arinspunk/claude-talk-to-figma-mcp/pull/36))
- **📑 Page Management**: Tools for a document's pages: `create_page`, `delete_page`, `rename_page`, `get_pages` and `set_current_page` (Thanks to [sk (kovalevsky)](https://github.com/kovalevsky) - [PR #32](https://github.com/arinspunk/claude-talk-to-figma-mcp/pull/32))

### Fixed
- **🚀 Performance**: Component lookup now uses `findAllWithCriteria`, which ends the timeouts at start-up (Thanks to [Rob Dearborn](https://github.com/rfdearborn) - [PR #42](https://github.com/arinspunk/claude-talk-to-figma-mcp/pull/42))
- **📸 SVG Export**: SVG exports now read the format parameter properly, and large exports get longer to finish (Thanks to [sk (kovalevsky)](https://github.com/kovalevsky) - [PR #32](https://github.com/arinspunk/claude-talk-to-figma-mcp/pull/32))
- **🛡️ Validation**: `join_channel` now demands its channel parameter (Thanks to [Timur](https://github.com/Mirsmog) - [PR #29](https://github.com/arinspunk/claude-talk-to-figma-mcp/pull/29))

## [0.6.1] - 2025-08-02

### Fixed
- **`set_stroke_color` Tool**: A rule wrongly rejected a `strokeWeight` of `0`. It no longer does, so you can make a stroke invisible, as Figma allows. (Thanks to [Taylor Smits](https://github.com/smitstay) - [PR #16](https://github.com/arinspunk/claude-talk-to-figma-mcp/pull/16))

## [0.6.0] - 2025-07-15

### Added
- **🚀 DXT Package Support**: The project now builds Anthropic's Desktop Extensions format for Claude Desktop
- **📦 Automated CI/CD Pipeline**: A GitHub Actions workflow builds the DXT package and attaches it to the release
- **🔧 DXT Build Scripts**: New npm scripts for DXT packaging: `pack`, `build:dxt` and `sync-version`
- **📋 .dxtignore Configuration**: Exclusions that cut the package to 11.6MB compressed
- **🎯 Dual Distribution Strategy**: the NPM registry for developers, DXT packages for everyone else

### Changed
- **⚡ Installation Experience**: One-click DXT installation cuts setup from 15-30 minutes to 2-5
- **📖 Documentation**: The README now covers DXT installation and what to do when it goes wrong
- **🏗️ Build Process**: `package.json` and `manifest.json` now keep the same version
- **🔄 Release Workflow**: The workflow attaches the DXT package to the GitHub release

### Technical Details
- Added the `@anthropic-ai/dxt@^0.2.0` development dependency for DXT packaging
- The CI/CD pipeline now handles errors and checks its work
- Build artifacts are kept 90 days, so you can test or roll back
- A DXT package only builds after the tests pass

### Credits
- **DXT Implementation**: [Taylor Smits](https://github.com/smitstay) - [PR #17](https://github.com/arinspunk/claude-talk-to-figma-mcp/pull/17)

## [0.5.3] - 2025-06-20

### Added
- A Windows build command, `build:win`, which runs `tsup`
- The build now works on Windows, where there is no `chmod`

### Fixed
- The build no longer fails on Windows, where `chmod` does not run
- Windows users get their own build script

### Changed
- The Unix build, which sets executable permissions, is now separate from the Windows build
- The install documentation now names the build command for each platform

## [0.5.2] - 2025-06-19

### Fixed
- `set_stroke_color` turned `a: 0`, which means transparent, into `a: 1`, which means opaque. It no longer does.
- It also turned `strokeWeight: 0`, which means no border, into `strokeWeight: 1`
- Both came from `||`, which treats a falsy value as a missing one

### Added
- `applyDefault()` now covers the stroke weight default
- A `FIGMA_DEFAULTS.stroke.weight` constant holds the stroke default in one place
- Tests for `set_stroke_color`, its edge cases and how it fits with the rest
- Stronger checks on the RGB components in stroke work

### Changed
- `set_stroke_color` now applies defaults the way `set_fill_color` does
- The MCP layer holds the logic; the Figma plugin only translates
- Renamed the `weight` parameter to `strokeWeight`
- The Figma plugin now expects complete data, and applies no defaults of its own

### Technical Details
- Replaced `strokeWeight: strokeWeight || 1` with `applyDefault(strokeWeight, FIGMA_DEFAULTS.stroke.weight)`
- Uses the `Color` and `ColorWithDefaults` interfaces properly
- Clearer error messages, and more checks

## [0.5.1] - 2025-06-15

### Fixed
- `set_fill_color` now respects the alpha value
- Added `applyColorDefaults`, which gives a colour its default values

### Added
- Tests for the colour functions and for node handling

### Changed
- Better TypeScript types for colours and their properties
- Tidied the code and the utilities

## [0.5.0] - 2025-05-28

### Changed
- The tools are now split into modules, which are easier to maintain
- Long operations now use timeouts and chunking
- Every tool handles and recovers from errors better
- Better TypeScript types, and one way of handling errors

### Fixed
- Channel connections hold, because the state is tracked better
- `flatten_node`, `create_component_instance` and `set_effect_style_id` no longer time out
- Reaching a remote component handles its errors better

### Added
- Documentation of what each group of tools does

## [0.4.0] - 2025-04-15

### Added
- New tools for shapes:
  - `create_ellipse`: ellipses and circles
  - `create_polygon`: polygons, with a side count you choose
  - `create_star`: stars, with a point count and an inner radius you choose
  - `create_vector`: vector shapes
  - `create_line`: straight lines
- More ways to work with text and fonts
- New commands for typography: font style, spacing, text case and more
- Access to team library components
- Better error handling, and better timeouts
- Better text scanning

### Changed
- Better documentation and examples

## [0.3.0] - 2025-03-10

### Added
- Added the `set_auto_layout` command, which sets auto layout on a frame or a group
- It sets layout direction, padding, item spacing, alignment and more

## [0.2.0] - 2025-02-01

### Added
- First public release, with Claude Desktop support
