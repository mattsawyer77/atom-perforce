# atom-perforce
Perforce integration for the Atom editor.

This package is pretty new. Issue reports and PRs are welcome.

**Features:**

* command to p4 edit the current file
* command to p4 add the current file
* command to p4 sync
* command to p4 revert
* command to load all files currently opened (as in p4 opened) in the workspace
* automatically show diff marks when the file is opened/saved
* automatically show the name of the p4 client/workspace in the status bar
* tree item decoration based on whether file is opened, etc.
* automatic open (edit/add) and automatic revert

**Usage:**

1. install the Perforce CLI utilities or P4V (which should come with the CLI utilities)
2. ensure at least one of the following is true:
    * you have installed the p4 command in its default location
    * the `p4` command's location is in your PATH environment variable
    * you have set that location in the atom-perforce settings
3. ensure that you can login to perforce via CLI and execute p4 commands from your project's directory, as the plugin does not (yet?) attempt to manage perforce authentication
4. use Atom's command palette (`shift+cmd+p` or `shift+ctrl+p`) then type either "perforce" or "p4" to see and execute available commands and/or use the keymappings

**TODO:**

* tree context menu actions
* view p4 diff output in a new buffer
* when multiple pending changelists are open in the current project, present a menu for which one to open a file in
