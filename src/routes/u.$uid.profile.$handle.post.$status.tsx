import { useParams } from '~/router';

const AuthenticatedPostPage = () => {
	const params = useParams('/u/:uid/profile/:handle/post/:status');

	return (
		<div>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<p class='font-bold text-base'>Post</p>
			</div>
		</div>
	);
};

export default AuthenticatedPostPage;
