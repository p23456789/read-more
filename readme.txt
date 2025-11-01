=== DMG Read More ===
Contributors:      DJPaul
Tags:              block, gutenberg, posts, links, wp-cli
Tested up to:      6.8.1
Stable tag:        0.1.0
License:           GPL-3.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-3.0.html

Adds a Gutenberg block for inserting stylised links to posts and a WP-CLI command for searching posts using the block.

== Description ==

DMG Read More lets you easily add "Read More" links to your posts and pages using a custom block:

- Search: posts by title or content with live results
- Direct ID lookup: Enter a specific post ID for quick selection
- Pagination: browse through search results with prev/next controls.
- Recent posts: Shows recent posts by default when no search is active.
- Live preview: link updates in the editor as you select different posts.

The plugin also provides a WP-CLI command to search for posts containing the block, with optional date range filters.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/read-more` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.

== Frequently Asked Questions ==

= How do I use the block? =

Add the "Read More" block in the block editor. Use the block sidebar to search posts by keywords or ID, browse results, and insert a link to the selected post.

= What does the WP-CLI command do? =

Use the command to find posts containing the block. You can use `--date-before` and `--date-after` to filter by date: ```wp dmg-read-more search```

With custom date range: `wp dmg-read-more search --date-after=2025-01-01 --date-before=2025-01-31`
With custom batch size (for very large databases): `wp dmg-read-more search --batch-size=500`

All dates must be in `Y-m-d` format (e.g., `2025-10-29`). Invalid date formats will trigger an error.

== Changelog ==

= 0.1.0 =
* Initial release.
