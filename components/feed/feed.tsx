'use client';

import React from 'react';
import Image from 'next/image';
import { CreatePost } from './createpost';

interface Post {
	id: number;
	author: {
		name: string;
		title: string;
		avatar: string;
	};
	content: string;
	timestamp: string;
	likes: number;
	comments: number;
}

const SAMPLE_POSTS: Post[] = [
	{
		id: 1,
		author: {
			name: 'Jane Cooper',
			title: 'Failed Startup Founder',
			avatar:
				'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
		},
		content:
			'Just shut down my startup after 2 years. Key learning: Market validation before building is crucial. We built something nobody wanted. Here\'s to failing forward! 🚀💫',
		timestamp: '2h ago',
		likes: 234,
		comments: 56,
	},
	{
		id: 2,
		author: {
			name: 'Alex Morgan',
			title: 'Software Engineer',
			avatar:
				'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
		},
		content:
			'Failed my dream company\'s tech interview today. Froze on a simple algorithm question. Time to get back to practicing and come back stronger! 💪',
		timestamp: '4h ago',
		likes: 156,
		comments: 23,
	},
];

export function Feed() {
	return (
		<div className="container max-w-4xl mx-auto px-4 py-8">
			<div className="space-y-6">
				<CreatePost />
				{SAMPLE_POSTS.map((post) => (
					<div
						key={post.id}
						className="bg-card text-card-foreground rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 space-y-4"
					>
						<div className="flex items-center space-x-4">
							<div className="relative h-12 w-12 rounded-full overflow-hidden">
								<Image
									src={post.author.avatar}
									alt={post.author.name}
									fill
									className="object-cover"
									sizes="48px"
								/>
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="font-semibold text-foreground truncate">
									{post.author.name}
								</h3>
								<p className="text-sm text-muted-foreground truncate">
									{post.author.title}
								</p>
							</div>
							<span className="text-sm text-muted-foreground">
								{post.timestamp}
							</span>
						</div>

						<div className="text-base text-foreground leading-relaxed">
							{post.content}
						</div>

						<div className="flex items-center pt-4 border-t border-border space-x-6">
							<button className="group flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
								<svg
									className="w-5 h-5 transform transition-transform group-hover:scale-110"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
									/>
								</svg>
								<span className="font-medium">{post.likes}</span>
							</button>

							<button className="group flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
								<svg
									className="w-5 h-5 transform transition-transform group-hover:scale-110"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
									/>
								</svg>
								<span className="font-medium">{post.comments}</span>
							</button>

							<button className="group flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors ml-auto">
								<svg
									className="w-5 h-5 transform transition-transform group-hover:scale-110"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
									/>
								</svg>
								<span className="font-medium">Share</span>
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}