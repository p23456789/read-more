import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Save function for the block.
 *
 * @param {Object} props Block props.
 * @return {Element} Saved block markup.
 */
export default function save( { attributes } ) {
	const { postId, postTitle, postUrl } = attributes;

	// If no post is selected, don't render anything.
	if ( ! postTitle || ! postUrl ) {
		return null;
	}

	const blockProps = useBlockProps.save( {
		className: 'dmg-read-more',
	} );

	return (
		<p { ...blockProps }>
			{ __( 'Read more:', 'dmg-read-more' ) }{ ' ' }
			<a href={ postUrl }>Read More: { postTitle }</a>
		</p>
	);
}
