<?php
declare(strict_types=1);

/**
 * Plugin Name:       DMG Read More
 * Description:       Insert stylised links to related articles.
 * Version:           0.1.0
 * Requires at least: 6.8.1
 * Requires PHP:      8.2
 * Author:            Paul Wong-Gibbs
 * License:           GPL-3.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain:       dmg-read-more
 */

namespace DMG;

defined( 'ABSPATH' ) || exit;

add_action( 'init', 'dmg_read_more_block_init' );

/**
 * Registers the block.
 *
 * @return void
 */
function dmg_read_more_block_init() : void {
	if ( ! file_exists( __DIR__ . '/build/blocks-manifest.php' ) ) {
		return;
	}

	wp_register_block_types_from_metadata_collection(
		__DIR__ . '/build',
		__DIR__ . '/build/blocks-manifest.php'
	);
}
