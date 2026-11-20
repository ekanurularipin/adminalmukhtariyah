
import { IconUser, IconMail, IconListCheck, IconProps, Icon } from '@tabler/icons-react';

//  Profile Data
interface ProfileType {
  title: string;
  img: string;
  subtitle: string;
  url: string;
  icon: string
}


const profileDD: ProfileType[] = [
  {
    img: "/images/svgs/icon-account.svg",
    title: "My Profile",
    subtitle: "Account settings",
    icon: "tabler:user",
    url: "/user-profile",
  },
];

const Notifications = [
  {
    avatar: '/images/profile/user-1.jpg',
    title: 'Roman Joined the Team!',
    subtitle: 'Congratulate him',
  },
  
];

export {
  Notifications,
  profileDD,
};
