# atom-perforce
Perforce integration for the Atom editor.

This package is pretty new. Issue reports and PRs are welcome.

**Features:**

* command to p4 edit the current file
* command to p4 add the current file
* command to p4 sync
* command to p4 revert
* automatically show diff marks when the file is opened/saved
* automatically show the name of the p4 client/workspace in the status bar

**TODO:**

* tree context menu actions
* tree item decoration based on whether file is opened, etc.
* view p4 diff in a new buffer
* when multiple changelists are open in the current project, present a menu for which one to open a file in