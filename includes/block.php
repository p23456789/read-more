<?php
declare(strict_types=1);

namespace DMG;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the block.
 *
 * @return void
 */
function dmg_read_more_block_init() : void {
	if ( ! file_exists( __DIR__ . '/../build/blocks-manifest.php' ) ) {
		return;
	}

	wp_register_block_types_from_metadata_collection(
		__DIR__ . '/../build',
		__DIR__ . '/../build/blocks-manifest.php'
	);
}
