<?php
declare(strict_types=1);

namespace DMG;

defined( 'ABSPATH' ) || exit;

/**
 * WP-CLI commands for the plugin.
 */
class WP_CLI_Read_More extends \WP_CLI_Command {

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
	 * [--per-page=<number>]
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
	 * @when after_wp_load
	 *
	 * @return void
	 */
	public function search( $args, $assoc_args ) : void {
		global $wpdb;

		// Date range.
		$date_before = $assoc_args['date-before'] ?? date( 'Y-m-d' );
		$date_after  = $assoc_args['date-after']  ?? date( 'Y-m-d', strtotime( '-30 days' ) );

		if ( ! $this->validate_date_format( $date_before ) || ! $this->validate_date_format( $date_after ) ) {
			\WP_CLI::error( 'Invalid date format. Use YYYY-MM-DD.' );
		}

		// Pagination.
		$offset   = 0;
		$per_page = isset( $assoc_args['per-page'] ) ? absint( $assoc_args['per-page'] ) : 2000;
		$results  = [];

		do {
			// Use direct SQL for performance; uses the type_status_date index.
			$sql = $wpdb->prepare(
				"SELECT ID FROM {$wpdb->posts}
				WHERE post_type = 'post'
				AND post_status = 'publish'
				AND post_date >= %s
				AND post_date <= %s
				AND post_content LIKE %s
				ORDER BY post_date DESC
				LIMIT %d OFFSET %d",
				$date_after . ' 00:00:00',
				$date_before . ' 23:59:59',
				'%' . $wpdb->esc_like( '<!-- wp:dmg/read-more' ) . '%',
				$per_page,
				$offset
			);

			$posts = $wpdb->get_col( $sql );
			$found = count( $posts );

			foreach ( $posts as $post_id ) {
				$results[] = (int) $post_id;
			}

			$offset += $per_page;
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
	 * @param string $date Date string to validate.
	 * @return bool True if date format is valid, false otherwise.
	 */
	protected function validate_date_format( string $date ) : bool {
		return (bool) preg_match( '/^\d{4}-\d{2}-\d{2}$/', $date );
	}
}
