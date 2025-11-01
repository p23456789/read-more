/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	Button,
	Spinner,
	Placeholder,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	Pagination,
	SearchControl,
	Notice,
	Card,
	CardBody,
	CardHeader,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Styles
 */
import './editor.scss';

/**
 * Edit component for the Read More block.
 *
 * @param {Object}   props               Block props.
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @return {Element} Element to render.
 */
export default function Edit( { attributes, setAttributes } ) {
	const { postId, postTitle, postUrl } = attributes;

	// State for search
	const [ searchTerm, setSearchTerm ] = useState( '' );
	const [ searchId, setSearchId ] = useState( '' );
	const [ searchResults, setSearchResults ] = useState( [] );
	const [ isSearching, setIsSearching ] = useState( false );
	const [ page, setPage ] = useState( 1 );
	const [ totalPages, setTotalPages ] = useState( 1 );
	const [ errorMessage, setErrorMessage ] = useState( '' );
	const postsPerPage = 5;

	// Get recent posts for initial display - limited fetch with only needed fields
	const recentPosts = useSelect( ( select ) => {
		return select( coreDataStore ).getEntityRecords( 'postType', 'post', {
			per_page: postsPerPage,
			_fields: 'id,title,date,link',
			status: 'publish',
			orderby: 'date',
			order: 'desc',
		} );
	}, [] );

	// Set search results to recent posts initially
	useEffect( () => {
		const checkAndUpdateResults = () => {
			if ( recentPosts && ! searchTerm && ! searchId ) {
				setSearchResults( recentPosts );
				setTotalPages( 1 );
				setErrorMessage( '' );
			}
		};

		checkAndUpdateResults();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ recentPosts ] );

	// Fetch post details if postId is set but we don't have title/URL
	useEffect( () => {
		if ( postId && ( ! postTitle || ! postUrl ) ) {
			setIsSearching( true );
			apiFetch( {
				path: `/wp/v2/posts/${ postId }?_fields=id,title,link`,
			} )
				.then( ( post ) => {
					setAttributes( {
						postTitle: post.title.rendered,
						postUrl: post.link,
					} );
					setIsSearching( false );
					setErrorMessage( '' );
				} )
				.catch( ( error ) => {
					// Reset attributes if post not found
					setAttributes( {
						postId: 0,
						postTitle: '',
						postUrl: '',
					} );
					setIsSearching( false );
					setErrorMessage(
						__(
							'Error loading post data. The post may have been deleted.',
							'dmg-read-more'
						)
					);
					console.error( 'API Error:', error );
				} );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ postId, postTitle, postUrl ] );

	// Search posts by title
	const searchPosts = () => {
		setIsSearching( true );
		setErrorMessage( '' );

		// If searching by ID
		if ( searchId ) {
			apiFetch( {
				path: `/wp/v2/posts/${ searchId }?_fields=id,title,date,link`,
			} )
				.then( ( post ) => {
					setSearchResults( [ post ] );
					setTotalPages( 1 );
					setIsSearching( false );
				} )
				.catch( ( error ) => {
					setSearchResults( [] );
					setTotalPages( 0 );
					setIsSearching( false );
					setErrorMessage(
						__(
							'Post not found. Please check the ID and try again.',
							'dmg-read-more'
						)
					);
					console.error( 'API Error:', error );
				} );
			return;
		}

		// Search by term
		const searchParams = new URLSearchParams( {
			search: searchTerm,
			page: page.toString(),
			per_page: postsPerPage.toString(),
			status: 'publish',
			_fields: 'id,title,date,link',
		} );

		apiFetch( {
			path: `/wp/v2/posts?${ searchParams.toString() }`,
			parse: false,
		} )
			.then( ( response ) => {
				// Get total pages from headers
				const totalItems = parseInt(
					response.headers.get( 'X-WP-Total' ) || 0,
					10
				);
				const pages = parseInt(
					response.headers.get( 'X-WP-TotalPages' ) || 1,
					10
				);

				// Parse the JSON response body
				return response.json().then( ( posts ) => {
					setSearchResults( posts );
					setTotalPages( pages );
					setIsSearching( false );

					// Show helpful message if no results
					if ( posts.length === 0 ) {
						setErrorMessage(
							__(
								'No posts found matching your search criteria.',
								'dmg-read-more'
							)
						);
					}
				} );
			} )
			.catch( ( error ) => {
				setSearchResults( [] );
				setTotalPages( 0 );
				setIsSearching( false );
				setErrorMessage(
					__(
						'Error searching posts. Please try again later.',
						'dmg-read-more'
					)
				);
				console.error( 'API Error:', error );
			} );
	};

	// Handle post selection
	const selectPost = ( post ) => {
		setAttributes( {
			postId: post.id,
			postTitle: post.title.rendered,
			postUrl: post.link,
		} );
		setErrorMessage( '' );
	};

	// Render post list
	const renderPostList = () => {
		if ( isSearching ) {
			return <Spinner />;
		}

		if ( ! searchResults || searchResults.length === 0 ) {
			return <p>{ __( 'No posts found.', 'dmg-read-more' ) }</p>;
		}

		return (
			<>
				<div
					className="dmg-read-more-search-results"
					role="listbox"
					aria-label={ __( 'Posts list', 'dmg-read-more' ) }
				>
					{ searchResults.map( ( post ) => (
						<Card
							key={ post.id }
							className="dmg-read-more-search-result"
							onClick={ () => selectPost( post ) }
							onKeyDown={ ( e ) => {
								// Handle keyboard accessibility
								if ( e.key === 'Enter' || e.key === ' ' ) {
									e.preventDefault();
									selectPost( post );
								}
							} }
							tabIndex="0"
							role="option"
							aria-selected={ post.id === postId }
							isBorderless={ post.id !== postId }
							size="small"
							isRounded
						>
							<CardBody>
								<Heading level={ 4 }>
									<span
										dangerouslySetInnerHTML={ {
											__html: post.title.rendered,
										} }
									/>
								</Heading>
								<Text variant="muted">
									{ new Date(
										post.date
									).toLocaleDateString() }
								</Text>
							</CardBody>
						</Card>
					) ) }
				</div>

				{ totalPages > 1 && (
					<Pagination
						currentPage={ page }
						totalPages={ totalPages }
						onChange={ setPage }
					/>
				) }
			</>
		);
	};

	// Trigger search when page changes
	useEffect( () => {
		if ( searchTerm || searchId ) {
			searchPosts();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ page ] );

	// Render block content
	const blockProps = useBlockProps( {
		className: 'dmg-read-more',
	} );

	return (
		<>
			{ ' ' }
			<InspectorControls>
				<PanelBody title={ __( 'Select Post', 'dmg-read-more' ) }>
					<SearchControl
						label={ __( 'Search posts', 'dmg-read-more' ) }
						value={ searchTerm }
						onChange={ ( value ) => {
							setSearchTerm( value );
							setSearchId( '' );
							setPage( 1 );
							setErrorMessage( '' );
						} }
					/>

					<TextControl
						label={ __( 'Or search by Post ID', 'dmg-read-more' ) }
						value={ searchId }
						onChange={ ( value ) => {
							setSearchId( value );
							setSearchTerm( '' );
							setPage( 1 );
							setErrorMessage( '' );
						} }
						type="number"
					/>

					<Button
						variant="primary"
						onClick={ searchPosts }
						disabled={
							( ! searchTerm && ! searchId ) || isSearching
						}
						className="dmg-read-more-search-button"
						aria-busy={ isSearching }
					>
						{ __( 'Search', 'dmg-read-more' ) }
					</Button>

					{ errorMessage && (
						<Notice status="error" isDismissible={ false }>
							{ errorMessage }
						</Notice>
					) }

					<div className="dmg-read-more-results-container">
						<Card>
							<CardHeader size="small">
								<Heading level={ 3 }>
									{ searchTerm || searchId
										? __(
												'Search Results',
												'dmg-read-more'
										  )
										: __(
												'Recent Posts',
												'dmg-read-more'
										  ) }
								</Heading>
							</CardHeader>
							<CardBody size="small">
								{ renderPostList() }
							</CardBody>
						</Card>
					</div>
				</PanelBody>
			</InspectorControls>
			{ ! postId ? (
				<Placeholder
					label={ __( 'DMG Read More', 'dmg-read-more' ) }
					instructions={ __(
						'Select a post from the sidebar to create a stylised link.',
						'dmg-read-more'
					) }
					icon="admin-links"
				/>
			) : (
				<p { ...blockProps }>
					{ __( 'Read more:', 'dmg-read-more' ) }{ ' ' }
					<a href={ postUrl }>{ postTitle }</a>
				</p>
			) }
		</>
	);
}
