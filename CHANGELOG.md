# Change Log

## [v1.6.6](https://github.com/mattsawyer77/atom-perforce/tree/v1.6.6)

[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.6.5...v1.6.6)

**Fixed bugs:**

- No commands working after 1.6.0 when P4-related environment variables are not set [\#34](https://github.com/mattsawyer77/atom-perforce/issues/34)

**Merged pull requests:**

- Fixes \#34 [\#38](https://github.com/mattsawyer77/atom-perforce/pull/38) ([mdouglass](https://github.com/mdouglass))

## [v1.6.5](https://github.com/mattsawyer77/atom-perforce/tree/v1.6.5) (2015-11-16)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.6.4...v1.6.5)

**Merged pull requests:**

- Fix not in client v3 [\#37](https://github.com/mattsawyer77/atom-perforce/pull/37) ([unional](https://github.com/unional))

## [v1.6.4](https://github.com/mattsawyer77/atom-perforce/tree/v1.6.4) (2015-11-16)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.6.3...v1.6.4)

**Merged pull requests:**

- Fix not in client v2 \(use p4Info.currentDirectory\) [\#36](https://github.com/mattsawyer77/atom-perforce/pull/36) ([unional](https://github.com/unional))

## [v1.6.3](https://github.com/mattsawyer77/atom-perforce/tree/v1.6.3) (2015-11-13)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.6.2...v1.6.3)

**Fixed bugs:**

- auto revert setting inadvertently reverts integrated/merged files [\#19](https://github.com/mattsawyer77/atom-perforce/issues/19)

**Closed issues:**

- Incorrectly invoke windows file handling when not in p4 repo [\#33](https://github.com/mattsawyer77/atom-perforce/issues/33)

**Merged pull requests:**

- Add checks when file is not under the client workspace [\#35](https://github.com/mattsawyer77/atom-perforce/pull/35) ([unional](https://github.com/unional))

## [v1.6.2](https://github.com/mattsawyer77/atom-perforce/tree/v1.6.2) (2015-11-10)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.6.1...v1.6.2)

## [v1.6.1](https://github.com/mattsawyer77/atom-perforce/tree/v1.6.1) (2015-11-09)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.6.0...v1.6.1)

**Fixed bugs:**

- Failed to activate the atom-perforce package [\#32](https://github.com/mattsawyer77/atom-perforce/issues/32)

## [v1.6.0](https://github.com/mattsawyer77/atom-perforce/tree/v1.6.0) (2015-11-08)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.5.3...v1.6.0)

**Fixed bugs:**

- Perforce commands error out with Atom [\#27](https://github.com/mattsawyer77/atom-perforce/issues/27)
- Reverting a file whilst open causes the file to not subsequently check out [\#26](https://github.com/mattsawyer77/atom-perforce/issues/26)

**Closed issues:**

- Source .bash\_profile on OS X [\#31](https://github.com/mattsawyer77/atom-perforce/issues/31)
- Automatic edit causes multiple errors [\#30](https://github.com/mattsawyer77/atom-perforce/issues/30)

## [v1.5.3](https://github.com/mattsawyer77/atom-perforce/tree/v1.5.3) (2015-07-18)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.5.2...v1.5.3)

**Closed issues:**

- CWD and using project-specific .p4config files [\#24](https://github.com/mattsawyer77/atom-perforce/issues/24)

## [v1.5.2](https://github.com/mattsawyer77/atom-perforce/tree/v1.5.2) (2015-07-17)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.5.1...v1.5.2)

**Fixed bugs:**

- TypeError: Cannot read property 'realPath' of undefined [\#23](https://github.com/mattsawyer77/atom-perforce/issues/23)

## [v1.5.1](https://github.com/mattsawyer77/atom-perforce/tree/v1.5.1) (2015-07-14)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.5.0...v1.5.1)

**Closed issues:**

- Exception thrown when clicking back and forward to Settings panel. [\#21](https://github.com/mattsawyer77/atom-perforce/issues/21)

## [v1.5.0](https://github.com/mattsawyer77/atom-perforce/tree/v1.5.0) (2015-07-13)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.4.0...v1.5.0)

## [v1.4.0](https://github.com/mattsawyer77/atom-perforce/tree/v1.4.0) (2015-07-13)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.3.0...v1.4.0)

## [v1.3.0](https://github.com/mattsawyer77/atom-perforce/tree/v1.3.0) (2015-07-10)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.2.3...v1.3.0)

**Implemented enhancements:**

- Automatically check-out files during project search/replace [\#17](https://github.com/mattsawyer77/atom-perforce/issues/17)
- there should be a notification after syncing if files need to be resolved [\#12](https://github.com/mattsawyer77/atom-perforce/issues/12)

**Closed issues:**

- Node-Perforce version [\#20](https://github.com/mattsawyer77/atom-perforce/issues/20)

## [v1.2.3](https://github.com/mattsawyer77/atom-perforce/tree/v1.2.3) (2015-07-09)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.2.2...v1.2.3)

**Fixed bugs:**

- environmental problem with bash [\#18](https://github.com/mattsawyer77/atom-perforce/issues/18)

## [v1.2.2](https://github.com/mattsawyer77/atom-perforce/tree/v1.2.2) (2015-06-29)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.2.1...v1.2.2)

**Closed issues:**

- Failed to load the atom-perforce package [\#16](https://github.com/mattsawyer77/atom-perforce/issues/16)

## [v1.2.1](https://github.com/mattsawyer77/atom-perforce/tree/v1.2.1) (2015-06-16)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.2.0...v1.2.1)

**Fixed bugs:**

- Load All Opened Files command loads duplicate files if the project has multiple roots [\#13](https://github.com/mattsawyer77/atom-perforce/issues/13)

## [v1.2.0](https://github.com/mattsawyer77/atom-perforce/tree/v1.2.0) (2015-05-13)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.1.0...v1.2.0)

**Merged pull requests:**

- Update atom engine version constraint [\#14](https://github.com/mattsawyer77/atom-perforce/pull/14) ([zimme](https://github.com/zimme))

## [v1.1.0](https://github.com/mattsawyer77/atom-perforce/tree/v1.1.0) (2015-04-19)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.0.1...v1.1.0)

## [v1.0.1](https://github.com/mattsawyer77/atom-perforce/tree/v1.0.1) (2015-04-15)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v1.0.0...v1.0.1)

**Implemented enhancements:**

- Checkout on save/modified [\#4](https://github.com/mattsawyer77/atom-perforce/issues/4)

## [v1.0.0](https://github.com/mattsawyer77/atom-perforce/tree/v1.0.0) (2015-04-15)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.11.2...v1.0.0)

**Fixed bugs:**

- there should be an error notification when the user is not logged in to perforce [\#8](https://github.com/mattsawyer77/atom-perforce/issues/8)

## [v0.11.2](https://github.com/mattsawyer77/atom-perforce/tree/v0.11.2) (2015-04-11)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.11.1...v0.11.2)

**Closed issues:**

- TypeError: Cannot read property 'file' of undefined [\#10](https://github.com/mattsawyer77/atom-perforce/issues/10)

## [v0.11.1](https://github.com/mattsawyer77/atom-perforce/tree/v0.11.1) (2015-04-11)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.11.0...v0.11.1)

**Implemented enhancements:**

- display a helpful error message when the p4 command is not found in the path [\#7](https://github.com/mattsawyer77/atom-perforce/issues/7)
- Configurable path for p4 executable [\#5](https://github.com/mattsawyer77/atom-perforce/issues/5)
- windows compatibility [\#2](https://github.com/mattsawyer77/atom-perforce/issues/2)

**Closed issues:**

- TextEditor.decorateMarker is deprecated. [\#11](https://github.com/mattsawyer77/atom-perforce/issues/11)

## [v0.11.0](https://github.com/mattsawyer77/atom-perforce/tree/v0.11.0) (2015-04-02)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.10.0...v0.11.0)

## [v0.10.0](https://github.com/mattsawyer77/atom-perforce/tree/v0.10.0) (2015-03-28)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.9.3...v0.10.0)

## [v0.9.3](https://github.com/mattsawyer77/atom-perforce/tree/v0.9.3) (2015-03-25)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.9.2...v0.9.3)

## [v0.9.2](https://github.com/mattsawyer77/atom-perforce/tree/v0.9.2) (2015-03-25)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.9.1...v0.9.2)

**Fixed bugs:**

- When atom-perforce is enabled, the new tab behavior is disrupted. [\#3](https://github.com/mattsawyer77/atom-perforce/issues/3)

## [v0.9.1](https://github.com/mattsawyer77/atom-perforce/tree/v0.9.1) (2015-03-09)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.9.0...v0.9.1)

## [v0.9.0](https://github.com/mattsawyer77/atom-perforce/tree/v0.9.0) (2015-03-06)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.8.0...v0.9.0)

## [v0.8.0](https://github.com/mattsawyer77/atom-perforce/tree/v0.8.0) (2015-02-27)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.7.0...v0.8.0)

## [v0.7.0](https://github.com/mattsawyer77/atom-perforce/tree/v0.7.0) (2015-02-27)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.6.0...v0.7.0)

## [v0.6.0](https://github.com/mattsawyer77/atom-perforce/tree/v0.6.0) (2015-02-24)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.5.0...v0.6.0)

## [v0.5.0](https://github.com/mattsawyer77/atom-perforce/tree/v0.5.0) (2015-02-20)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.4.0...v0.5.0)

## [v0.4.0](https://github.com/mattsawyer77/atom-perforce/tree/v0.4.0) (2015-02-20)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.3.0...v0.4.0)

**Fixed bugs:**

- Uncaught TypeError: object is not a function [\#1](https://github.com/mattsawyer77/atom-perforce/issues/1)

## [v0.3.0](https://github.com/mattsawyer77/atom-perforce/tree/v0.3.0) (2015-02-18)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.2.0...v0.3.0)

## [v0.2.0](https://github.com/mattsawyer77/atom-perforce/tree/v0.2.0) (2015-02-12)
[Full Changelog](https://github.com/mattsawyer77/atom-perforce/compare/v0.1.0...v0.2.0)

## [v0.1.0](https://github.com/mattsawyer77/atom-perforce/tree/v0.1.0) (2015-02-11)


\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*
