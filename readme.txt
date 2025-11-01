=== DMG Read More ===
Contributors:      DJPaul
Tags:              block, gutenberg, posts, links, wp-cli
Tested up to:      6.8.1
Stable tag:        0.1.0
License:           GPL-3.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-3.0.html

Adds a Gutenberg block for inserting stylised links to posts and a WP-CLI command for searching posts using the block.

== Description ==

DMG Read More lets you easily add "Read More" links to your posts and pages using a custom block. Editors can search for and select a published post to insert as a link.

The plugin also provides a WP-CLI command to search for posts containing the block, with optional date range filters.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/read-more` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.

== Frequently Asked Questions ==

= How do I use the block? =

Add the "Read More" block in the block editor. Use the sidebar to search for and select a post. The block will display a link to the selected post.

= What does the WP-CLI command do? =

Run `wp dmg-read-more search` to find posts containing the block. You can use `--date-before` and `--date-after` to filter by date.

== Changelog ==

= 0.1.0 =
* Initial release.
