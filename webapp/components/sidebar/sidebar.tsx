import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import './sidebar.scss';
import { faHome, faUser, faAddressCard, faDoorOpen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { User } from '@prisma/client';

type ComoponentProps = {
    user: PrimitiveUser,
}

type PrimitiveUser = {
    username: string,
    email: string
}

const sidebarNavItems = [
    {
        display: 'Dashboard',
        icon: <FontAwesomeIcon icon={faHome} />,
        to: '/',
    },
    {
        display: 'Benutzerverwaltung',
        icon: <FontAwesomeIcon icon={faUser} />,
        to: '/users',
    }
]

const isElementActive = (route: string) => {
    const router = useRouter();

    console.log(router.pathname);
    return router.pathname == route;
}

const getContent = (active: boolean) => {
    if(active){
        return(
            <div className='nav-items'>
                <div className={`${sidebarName(active)}__logo`}>
                    <Image src="/logo_klein.png" width={50} height={50} alt={''}/>
                </div>
                <div className={`${sidebarName(active)}__menu`}>
                    {
                        sidebarNavItems.map((item, index) => (
                            <Link href={item.to} key={index} style={{ textDecoration: 'none' }}>
                                <div className={`${sidebarName(active)}__menu__item`}>
                                    <div className={`${sidebarName(active)}__menu__item__icon ${isElementActive(item.to)? "active": ""}`}>
                                        {item.icon}
                                    </div>
                                    <div className={`${sidebarName(active)}__menu__item__text ${isElementActive(item.to)? "active": ""}`}>
                                        {item.display}
                                    </div>
                                </div>
                            </Link>
                        ))
                    }
                </div>
            </div>
        );
    }else{
        return(
            <div className='nav-items'>
                <div className={`${sidebarName(active)}__logo`}>
                    <Image src="/logo_klein.png" width={50} height={50} alt={''}/>
                </div>
                <div className={`${sidebarName(active)}__menu`}>
                    {
                        sidebarNavItems.map((item, index) => (
                            <Link href={item.to} key={index} style={{ textDecoration: 'none' }}>
                                <div className={`${sidebarName(active)}__menu__item`}>
                                    <div className={`${sidebarName(active)}__menu__item__icon ${isElementActive(item.to)? "active": ""}`}>
                                        {item.icon}
                                    </div>
                                </div>
                            </Link>
                        ))
                    }
                </div>
            </div>
        );
    }
}

const sidebarName = (active: boolean) => {
    return active ? "sidebar-full": "sidebar-reduced"
}

const getPopOverState = (active: boolean) => {
    return (active)? "popover": "popover-hidden"
}

const getProfileInformation = (active: boolean, username: string, email: string) => {
    console.log(active)
    if(active){
        return(
            <div className='profile-information'>
                <div className='profile-username'>{username}</div>
                <div className='profile-email'>{email}</div>
            </div>
        );
    }else{
        return <></>;
    }
}

const Sidebar = (props: ComoponentProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [stepHeight, setStepHeight] = useState(0);
    const [active, setActive] = useState(false);
    const [navModeText, setNavModeText] = useState(">");
    const [popOverShow, setPopOverShow] = useState(false);


    return(
        <>
            <div className={`sidebar ${sidebarName(active)}`}>
                {getContent(active)}

                <div className='bottom-box'>
                    <div className='sidebar-bottom'>
                        <div className='profile-image' onClick={() => {setPopOverShow(!popOverShow)}}>
                            <Image src="/profile-placeholder.jpg" width={50} height={50} alt={''}/>
                        </div>
                        {getProfileInformation(active, props.user.username, props.user.email)}
                    </div>
                    <div className='nav-mode-switcher' onClick={() => {setActive(!active); (active)? setNavModeText(">"):setNavModeText("<") }}>{navModeText}</div>
                </div>

                <div className={getPopOverState(popOverShow)}>
                    <div className={`${getPopOverState(popOverShow)}__title`}>Optionen</div>
                    <Link href={"/profile"} style={{ textDecoration: 'none', color: "black" }}>
                        <div className={`${getPopOverState(popOverShow)}__entry`}>
                            <FontAwesomeIcon className={`${getPopOverState(popOverShow)}__entry__icon`} icon={faAddressCard} />
                            <div className={`${getPopOverState(popOverShow)}__entry__text`}>Profil</div>
                        </div>
                    </Link>
                    <Link href={"/logout"} style={{ textDecoration: 'none', color: "black"  }}>
                        <div className={`${getPopOverState(popOverShow)}__entry`}>
                            <FontAwesomeIcon className={`${getPopOverState(popOverShow)}__entry__icon`} icon={faDoorOpen} />
                            <div className={`${getPopOverState(popOverShow)}__entry__text`}>Ausloggen</div>
                        </div>
                    </Link>
                </div>
            </div>
        </>
    );
};

export default Sidebar;