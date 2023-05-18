import { useParams } from '~/router';

const AuthenticatedProfileFollowingPage = () => {
	const params = useParams('/u/:uid/profile/:handle/following');

	return (
		<div>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<div class='flex flex-col gap-0.5'>
					<p class='text-base leading-5 font-bold'>Following</p>
					<p class='text-xs text-muted-fg'>@{params.handle}</p>
				</div>
			</div>
		</div>
	);
};

export default AuthenticatedProfileFollowingPage;
