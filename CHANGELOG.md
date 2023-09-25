# Change Log

All notable changes to the "Auctioneer Software" extension will be documented in this file.

## [Unreleased]

## [1.2.4] - 2023-09-24

### Changed

- Improved links

## [1.2.2] - 2023-08-14

### Fixed

- 🐛 Some postMessage calls were failing due to nested proxies

## [1.2.1] - 2023-08-13

### Fixed

- 🐛 IMAGE_KEY fallback bug introduced by the override changes

## [1.2.0] - 2023-08-13

- Client/Cluster links
- Migrate to new settings override
- CHANGELOG.md
- README.md

## [1.1.0] - 2023-08-04

### Added

- Support for new non-standard clusters
- Improved cluster tag accuracy
- Support for more customizations in settings

### Changed

- Development port to avoid conflicts

## [1.0.6] - 2023-05-14

### Added

- Panel now loads with currently open project if detected

### Changed

- improved contrast on tags
- improved theme compatability with icons

## [1.0.5] - 2023-04-28

### Fixed

- Fixed issue with Github code search api version

## [1.0.4] - 2023-04-23

### Added

- Panel settings menu and overflow

### Changed

- Use native loading indicator
- Sticky search input

### Fixed

- Search input now spans full width
- Catch and notify on Github auth errors
- Path override setting now follows [spec](https://code.visualstudio.com/api/references/contribution-points#contributes.configuration)

## [1.0.3] - 2023-04-20

### Changed

- UI tweaks for native consistency
- Auto focus input on open

### Fixed

- Fixed issue where loading would get stuck without displaying an uncaught error

## [1.0.1] - 2023-04-05

### Added

- Allow tilde paths for client paths
- Allow overriding client paths
- Thanks [@Borvik](https://github.com/jacobSND/as-vscode/pull/1)!

### Changed

- Terminals now automatically close when the process exits
- Prepare for publishing to marketplace

## [1.0.0] - 2023-03-08

- Initial release

[unreleased]: https://github.com/jacobSND/as-vscode/compare/v1.2.4...HEAD
[1.2.4]: https://github.com/jacobSND/as-vscode/compare/v1.2.2...v1.2.4
[1.2.2]: https://github.com/jacobSND/as-vscode/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/jacobSND/as-vscode/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/jacobSND/as-vscode/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/jacobSND/as-vscode/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/jacobSND/as-vscode/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/jacobSND/as-vscode/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/jacobSND/as-vscode/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/jacobSND/as-vscode/compare/v1.0.1...v1.0.3
[1.0.1]: https://github.com/jacobSND/as-vscode/compare/1.0.0...v1.0.1
[1.0.0]: https://github.com/jacobSND/as-vscode/releases/tag/1.0.0