import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import './sidebar.scss';
import { faHome, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const sidebarNavItems = [
    {
        display: 'Dashboard',
        icon: <FontAwesomeIcon icon={faHome} />,
        to: '/dashboard',
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
                    Wohnbau
                </div>
                <div className={`${sidebarName(active)}__menu`}>
                    {
                        sidebarNavItems.map((item, index) => (
                            <Link href={item.to} key={index}>
                                <div className={`${sidebarName(active)}__menu__item`}>
                                    <div className={`${sidebarName(active)}__menu__item__icon ${isElementActive(item.to)? "active": ""}`}>
                                        {item.icon}
                                    </div>
                                    <div className={`${sidebarName(active)}__menu__item__text`}>
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
                            <Link href={item.to} key={index}>
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

const Sidebar = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [stepHeight, setStepHeight] = useState(0);
    const [active, setActive] = useState(false);


    return(
        <div className={`sidebar ${sidebarName(active)}`}>
            {getContent(active)}
            <div className='sidebar-bottom'>
                <div className='profile-image'>
                    <Image src="/profile-placeholder.jpg" width={50} height={50} alt={''}/>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;