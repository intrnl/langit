import { useContext } from 'solid-js';

import { ProfileContext } from '../u.$uid.profile.$actor/ProfileContext.tsx';
import ProfileTimeline from '../u.$uid.profile.$actor/ProfileTimeline.tsx';

const AuthenticatedProfileTimelinePage = () => {
	const { uid, profile } = useContext(ProfileContext)!;

	return <ProfileTimeline uid={uid} profile={profile} tab="posts" />;
};

export default AuthenticatedProfileTimelinePage;
