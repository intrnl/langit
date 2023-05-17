import { useParams } from '~/router';

const AuthenticatedPostPage = () => {
	const params = useParams('/u/:uid/profile/:handle');

	return (
		<div>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<p class='font-bold text-base'>Profile</p>
			</div>
		</div>
	);
};

export default AuthenticatedPostPage;
