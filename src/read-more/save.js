/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialised by the block
 * editor into `post_content`.
 *
 * @param {Object} props            Block props.
 * @param {Object} props.attributes
 * @return {Element} Element to render.
 */
export default function save( { attributes } ) {
	const { postId, postTitle, postUrl } = attributes;

	// If no post is selected, don't render anything
	if ( ! postId || ! postTitle || ! postUrl ) {
		return null;
	}

	const blockProps = useBlockProps.save( {
		className: 'dmg-read-more',
	} );

	return (
		<p { ...blockProps }>
			{ __( 'Read More: ', 'dmg-read-more' ) }
			<a href={ postUrl }>{ postTitle }</a>
		</p>
	);
}
