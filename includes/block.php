<?php
declare(strict_types=1);

namespace DMG;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the block.
 *
 * @return void
 */
function load_readmore_block() : void {

	$build_path = plugin_dir_path( __DIR__ ) . 'build';
	if ( ! file_exists( $build_path . '/blocks-manifest.php' ) ) {
		return;
	}

	wp_register_block_types_from_metadata_collection(
		$build_path,
		$build_path . '/blocks-manifest.php'
	);
}
