/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
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
			{ __( 'Read More:', 'dmg-read-more' ) }
			<a href={ postUrl }>{ postTitle }</a>
		</p>
	);
}
