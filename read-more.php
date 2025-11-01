<?php
declare(strict_types=1);

/**
 * Plugin Name:       DMG Read More
 * Description:       Insert stylised posts links.
 * Version:           0.1.0
 * Requires at least: 6.8
 * Requires PHP:      8.4
 * Author:            Paul Wong-Gibbs
 * License:           GPL-3.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain:       dmg-read-more
 */

namespace DMG;

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/includes/block.php';
add_action( 'init', __NAMESPACE__ . '\\load_readmore_block' );

if ( class_exists( '\WP_CLI' ) ) {
	require_once __DIR__ . '/includes/class-wp-cli-read-more.php';
	\WP_CLI::add_command( 'dmg-read-more', WP_CLI_Read_More::class );
}

