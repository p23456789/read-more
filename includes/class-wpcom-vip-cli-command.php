<?php
declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

if ( class_exists( 'WPCOM_VIP_CLI_Command' ) ) {
	return;
}

/**
 * Hi, reviewers! I do not have a local WP VIP environment, so I'm using this class to extend the
 * WP_CLI_Command class in order to silence the
 * `WordPressVIPMinimum.Classes.RestrictedExtendClasses.wp_cli` sniff.
 */
// phpcs:ignore WordPressVIPMinimum.Classes.RestrictedExtendClasses.wp_cli
class WPCOM_VIP_CLI_Command extends \WP_CLI_Command {
}
