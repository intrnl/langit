import { createWindowVirtualizer } from '@tanstack/solid-virtual';

import MoreHorizIcon from '~/icons/baseline-more-horiz';
import RepeatIcon from '~/icons/baseline-repeat';
import ShareIcon from '~/icons/baseline-share';
import ChatBubbleOutlinedIcon from '~/icons/outline-chat-bubble';
import FavoriteOutlinedIcon from '~/icons/outline-favorite';

const AuthenticatedHome = () => {
	return (
		<div>
			<div class='flex items-center h-13 px-4 border-b border-divider sticky top-0'>
				<p class='font-bold text-base'>Home</p>
			</div>

			<div>
				<div class='px-4 hover:bg-hinted'>
					<div class='pt-3'></div>
					<div class='flex gap-3'>
						<div class='shrink-0'>
							<div class='h-12 w-12 rounded-full bg-muted-fg'>
							</div>
						</div>

						<div class='grow min-w-0 pb-3'>
							<div class='flex gap-4 items-center justify-between mb-0.5'>
								<div class='flex items-center text-sm'>
									<div>
										<a class='flex gap-1'>
											<span class='font-bold break-all whitespace-pre-wrap break-words line-clamp-1'>
												non aesthetic things
											</span>
											<span class='text-muted-fg break-all whitespace-pre-wrap line-clamp-1'>
												@PicturesFolder
											</span>
										</a>
									</div>

									<span class='text-muted-fg'>
										<span class='px-1'>·</span>
										<span>16h</span>
									</span>
								</div>
								<div class='shrink-0'>
									<button class='flex items-center justify-center h-8 w-8 -my-1.5 -mr-2 rounded-full text-base text-muted-fg hover:bg-secondary'>
										<MoreHorizIcon />
									</button>
								</div>
							</div>

							<div class='text-sm whitespace-pre-wrap'>
								<p>
									{'I\'m looking for the correct terminology for Haskell fuse function in Rust , but apparently Rust fuse is entirely another thing.\n\nfuse means: map f . map g --> map (f . g); an optimizer method that merges some function calls into one.\n\nI want to merge AST passes in Rust'}
								</p>
							</div>

							<div class='flex mt-3 text-muted-fg'>
								<div class='flex items-center flex-grow gap-0.5'>
									<button class='flex items-center justify-center h-8 w-8 -my-1.5 -ml-2 rounded-full text-base hover:bg-secondary'>
										<ChatBubbleOutlinedIcon />
									</button>
									<span class='text-[0.8125rem]'>189</span>
								</div>
								<div class='flex items-center flex-grow gap-0.5'>
									<button class='flex items-center justify-center h-8 w-8 -my-1.5 -ml-2 rounded-full text-base hover:bg-secondary'>
										<RepeatIcon />
									</button>
									<span class='text-[0.8125rem]'>1,995</span>
								</div>
								<div class='flex items-center flex-grow gap-0.5'>
									<button class='flex items-center justify-center h-8 w-8 -my-1.5 -ml-2 rounded-full text-base hover:bg-secondary'>
										<FavoriteOutlinedIcon />
									</button>
									<span class='text-[0.8125rem]'>59.3K</span>
								</div>
								<div class='flex-shrink'>
									<button class='flex items-center justify-center h-8 w-8 -my-1.5 -mx-2 rounded-full text-base hover:bg-secondary'>
										<ShareIcon />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AuthenticatedHome;
