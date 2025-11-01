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

require_once __DIR__ . '/includes/block.php';

add_action( 'init', __NAMESPACE__ . '\\dmg_read_more_block_init' );
