<?php
declare(strict_types=1);

namespace DMG;

defined( 'ABSPATH' ) || exit;

/**
 * Search for posts containing the DMG Read More block within a date range.
 */
class WP_CLI_Read_More extends WPCOM_VIP_CLI_Command {

	/**
	 * Find posts containing the DMG Read More block, within a date range.
	 * ## OPTIONS
	 *
	 * [--date-after=<date>]
	 * : Find posts published after this date. Format: YYYY-MM-DD.
	 * If not specified, defaults to 30 days ago.
	 *
	 * [--date-before=<date>]
	 * : Find posts published before this date. Format: YYYY-MM-DD.
	 * If not specified, defaults to current date.
	 *
	 * [--format=<format>]
	 * : Render output in a particular format.
	 * ---
	 * default: ids
	 * options:
	 *   - table
	 *   - csv
	 *   - json
	 *   - count
	 *   - ids
	 * ---
	 *
	 * [--batch_size=<number>]
	 * : Maximum number of posts to process at once.
	 * ---
	 * default: 2000
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     # Search for posts with the Read More block in the last 30 days.
	 *     wp dmg-read-more search
	 *
	 *     # Search for posts with the Read More block in a specific date range.
	 *     wp dmg-read-more search --date-after=2024-04-01 --date-before=2024-05-31
	 *
	 *     # Export results as JSON.
	 *     $ wp dmg-read-more search --format=json
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 *
	 * @return void
	 */
	public function search( $args, $assoc_args ) : void {
		global $wpdb;

		// Date range.
		$date_before = $assoc_args['date-before'] ?? gmdate( 'Y-m-d' );
		$date_after  = $assoc_args['date-after']  ?? gmdate( 'Y-m-d', strtotime( '-30 days' ) );

		if ( ! $this->validate_date_format( $date_before ) || ! $this->validate_date_format( $date_after ) ) {
			\WP_CLI::error( 'Invalid date format. Use YYYY-MM-DD.' );
		}

		// Batching required: be kind to memory/execution limits.
		$offset   = 0;
		$per_page = isset( $assoc_args['batch_size'] ) ? absint( $assoc_args['batch_size'] ) : 2000;
		$results  = [];

		if ( $per_page < 1 ) {
			\WP_CLI::error( 'Batch size must be a positive number.' );
		}

		\WP_CLI::log( sprintf( 'Searching posts from %s to %s...', $date_after, $date_before ) );

		do {
			$query_args = [
				'post_type'              => 'post',
				'post_status'            => 'publish',
				'date_query'             => [
					[
						'after'     => $date_after . ' 00:00:00',
						'before'    => $date_before . ' 23:59:59',
						'inclusive' => true,
					],
				],
				'cache_results'          => false,
				'fields'                 => 'ids',
				'no_found_rows'          => true,
				'offset'                 => $offset,
				'order'                  => 'DESC',
				'orderby'                => 'date',
				'posts_per_page'         => $per_page,
				's'                      => '<!-- wp:dmg/read-more',
				'search_columns'         => [ 'post_content' ],
				'update_menu_item_cache' => false,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			];

			$posts = get_posts( $query_args );
			$found = is_array( $posts ) ? count( $posts ) : 0;

			foreach ( $posts as $post_id ) {
				$results[] = (int) $post_id;
			}

			$offset += $per_page;
			\WP_CLI::log( sprintf( 'Processed %d posts...', $offset ) );
		} while ( $found === $per_page );

		if ( empty( $results ) ) {
			\WP_CLI::warning( 'No posts found with the Read More block in the specified date range.' );
			return;
		}

		// Format and display results.
		$format = isset( $assoc_args['format'] ) ? $assoc_args['format'] : 'ids';

		if ( $format === 'ids' ) {
			\WP_CLI::line( implode( ' ', $results ) );
		} elseif ( $format === 'count' ) {
			\WP_CLI::line( (string) count( $results ) );
		} else {
			$formatted_results = array_map(
				function( $id ) {
					return [ 'ID' => (int) $id ];
				},
				$results
			);
			\WP_CLI\Utils\format_items( $format, $formatted_results, [ 'ID' ] );
		}
	}

	/**
	 * Validates a date string format.
	 *
	 * @param string $date|null Date string to validate.
	 *
	 * @return bool True if date format is matchin, false otherwise.
	 */
	protected function validate_date_format( $date ) : bool {
		return (bool) preg_match( '/^\d{4}-\d{2}-\d{2}$/', $date );
	}
}
