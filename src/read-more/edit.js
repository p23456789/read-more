import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	Button,
	Spinner,
	Placeholder,
	Notice,
	SearchControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { dateI18n } from '@wordpress/date';

/**
 * Styles
 */
import './editor.scss';

/**
 * Debounce helper function.
 *
 * @param {*}      value   The input value to debounce.
 * @param {number} delayMs Delay in milliseconds.
 * @return {*}             The debounced value.
 */
function useDebouncedValue( value, delayMs ) {
	const [ debounced, setDebounced ] = useState( value );

	useEffect( () => {
		const id = setTimeout( () => setDebounced( value ), delayMs );
		return () => clearTimeout( id );
	}, [ value, delayMs ] );

	return debounced;
}

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
	const abortRef = useRef( null );
	const cacheRef = useRef( new Map() );

	// Debounced inputs to avoid firing requests on every keystroke
	const debouncedTerm = useDebouncedValue( searchTerm, 300 );
	const debouncedId = useDebouncedValue( searchId, 300 );

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

	/**
	 * Unified fetch function for term search and direct ID search.
	 *
	 * @param {Object}        [params]      Parameters object.
	 * @param {string}        [params.term]  Search term for title.
	 * @param {string|number} [params.id]    Direct post ID to fetch.
	 * @param {number}        [params.page]  Page number for pagination.
	 * @return {Promise<void>}               Promise that resolves when fetch completes.
	 */
	const fetchPosts = async ( {
		term = '',
		id = '',
		page: pageNumber = 1,
	} = {} ) => {
		setIsSearching( true );
		setErrorMessage( '' );

		const cacheKey = `${ id ? 'id' : 'term' }:${
			id || term
		}:${ pageNumber }`;
		if ( cacheRef.current.has( cacheKey ) ) {
			const { posts, pages } = cacheRef.current.get( cacheKey );
			setSearchResults( posts );
			setTotalPages( pages );
			setIsSearching( false );
			return;
		}

		// Cancel any in-flight request
		if ( abortRef.current ) {
			abortRef.current.abort();
		}
		const controller = new AbortController();
		abortRef.current = controller;

		try {
			if ( id ) {
				const post = await apiFetch( {
					path: `/wp/v2/posts/${ id }?_fields=id,title,date,link`,
					signal: controller.signal,
				} );
				const posts = post ? [ post ] : [];
				setSearchResults( posts );
				setTotalPages( 1 );
				cacheRef.current.set( cacheKey, { posts, pages: 1 } );
				if ( posts.length === 0 ) {
					setErrorMessage(
						__(
							'Post not found. Please check the ID and try again.',
							'dmg-read-more'
						)
					);
				}
				return;
			}

			const searchParams = new URLSearchParams( {
				search: term,
				page: pageNumber.toString(),
				per_page: postsPerPage.toString(),
				status: 'publish',
				_fields: 'id,title,date,link',
			} );

			const response = await apiFetch( {
				path: `/wp/v2/posts?${ searchParams.toString() }`,
				parse: false,
				signal: controller.signal,
			} );

			const pages = parseInt(
				response.headers.get( 'X-WP-TotalPages' ) || '1',
				10
			);
			const posts = await response.json();

			setSearchResults( posts );
			setTotalPages( pages );
			cacheRef.current.set( cacheKey, { posts, pages } );
			if ( posts.length === 0 ) {
				setErrorMessage( __( 'No posts found.', 'dmg-read-more' ) );
			}
		} catch ( error ) {
			if ( error && error.name === 'AbortError' ) {
				return;
			}
			setSearchResults( [] );
			setTotalPages( 0 );
			setErrorMessage(
				__(
					'Error searching posts. Please try again later.',
					'dmg-read-more'
				)
			);
			console.error( 'API Error:', error );
		} finally {
			setIsSearching( false );
		}
	};

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
				const pages = parseInt(
					response.headers.get( 'X-WP-TotalPages' ) || 1,
					10
				);

				// Parse the JSON response body
				return response.json().then( ( posts ) => {
					setSearchResults( posts );
					setTotalPages( pages );
					setIsSearching( false );

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
				<ul
					className="dmg-read-more-search-results"
					role="listbox"
					aria-label={ __( 'Posts list', 'dmg-read-more' ) }
				>
					{ searchResults.map( ( post ) => (
						<li
							key={ post.id }
							className="dmg-read-more-search-result"
							onClick={ () => selectPost( post ) }
							onKeyDown={ ( e ) => {
								if ( e.key === 'Enter' || e.key === ' ' ) {
									e.preventDefault();
									selectPost( post );
								}
							} }
							tabIndex="0"
							role="option"
							aria-selected={ post.id === postId }
						>
							<h4>
								<span
									dangerouslySetInnerHTML={ {
										__html: post.title.rendered,
									} }
								/>
							</h4>
							<span className="dmg-read-more-text-muted">
								{ dateI18n( 'M j, Y', post.date ) }
							</span>
						</li>
					) ) }
				</ul>

				{ totalPages > 1 && (
					<div className="dmg-read-more-pagination">
						<Button
							variant="secondary"
							onClick={ () => setPage( Math.max( 1, page - 1 ) ) }
							disabled={ page <= 1 || isSearching }
							icon={ chevronLeft }
							label={ __( 'Previous page', 'dmg-read-more' ) }
							showTooltip
						/>
						<span className="dmg-read-more-text-muted">
							{ sprintf(
								/* translators: 1: Current page number. 2: Total number of pages. */
								__( 'Page %1$s of %2$s', 'dmg-read-more' ),
								page,
								totalPages
							) }
						</span>
						<Button
							variant="secondary"
							onClick={ () =>
								setPage( Math.min( totalPages, page + 1 ) )
							}
							disabled={ page >= totalPages || isSearching }
							icon={ chevronRight }
							label={ __( 'Next page', 'dmg-read-more' ) }
							showTooltip
						/>
					</div>
				) }
			</>
		);
	};

	// Auto-search when debounced inputs change (reset to page 1)
	useEffect( () => {
		if ( ! debouncedTerm && ! debouncedId ) {
			return;
		}
		if ( page !== 1 ) {
			setPage( 1 );
			return;
		}
		// Enforce minimum length for term search
		if ( debouncedTerm && debouncedTerm.length < 2 ) {
			return;
		}
		fetchPosts( { term: debouncedTerm, id: debouncedId, page: 1 } );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ debouncedTerm, debouncedId ] );

	// Trigger search when page changes using current debounced inputs
	useEffect( () => {
		if ( ! debouncedTerm && ! debouncedId ) {
			return;
		}
		// Enforce minimum length for term search
		if ( debouncedTerm && debouncedTerm.length < 2 ) {
			return;
		}
		fetchPosts( { term: debouncedTerm, id: debouncedId, page } );
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
						<h3>
							{ searchTerm || searchId
								? __( 'Search Results', 'dmg-read-more' )
								: __( 'Recent Posts', 'dmg-read-more' ) }
						</h3>
						<div>{ renderPostList() }</div>
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
