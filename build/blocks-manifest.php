<?php
// This file is generated. Do not modify it manually.
return array(
	'read-more' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'dmg/read-more',
		'version' => '0.1.0',
		'title' => 'DMG Read More',
		'category' => 'text',
		'icon' => 'admin-links',
		'description' => 'Insert a stylised link to a published post.',
		'example' => array(
			
		),
		'attributes' => array(
			'postId' => array(
				'type' => 'number',
				'default' => 0
			),
			'postTitle' => array(
				'type' => 'string',
				'default' => ''
			),
			'postUrl' => array(
				'type' => 'string',
				'default' => ''
			)
		),
		'supports' => array(
			'html' => false
		),
		'textdomain' => 'dmg-read-more',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css'
	)
);
