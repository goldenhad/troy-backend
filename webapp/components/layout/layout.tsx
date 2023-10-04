import { ReactNode, useState } from "react";
import Image from "next/image";
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
    HomeOutlined,
    FolderOutlined,
    CloudUploadOutlined,
    LogoutOutlined
  } from '@ant-design/icons';
import { Layout, Menu, Button, theme } from 'antd';
const { Header, Sider, Content } = Layout;
import "./layout.scss"
import Link from "next/link";
import { useRouter } from "next/router";
import { ParsedRole, UserRights } from "@/helper/user";
import { Role } from "@prisma/client";


type PrimitiveUser = {
    username: string,
    email: string,
    role: ParsedRole
}

type ComponentProps = {
    children: ReactNode,
    user: PrimitiveUser
}

const sidebarNavItems = [
    {
        display: 'Dashboard',
        icon: <HomeOutlined />,
        to: '/',
        reg: /^\/$/gm,
        caps: (userrights: {canEditUsers: boolean, canUnfreeze: boolean, canUploadFiles: boolean}) => {
            return true;
        }
    },
    {
        display: 'Benutzerverwaltung',
        icon: <UserOutlined />,
        to: '/users/1',
        reg: /\/users\/\[\[...page\]\]/gm,
        caps: (userrights: UserRights) => {
            return userrights.canEditUsers;
        }
    },
    {
        display: 'Archiv',
        icon: <FolderOutlined />,
        to: '/archive/1',
        reg: /(\/archive\/\[page\])|(\/archive\/details\/\[\[...page\]\])/gm,
        caps: (userrights: UserRights) => {
            return true;
        }
    },
    {
        display: 'Datenupload',
        icon: <CloudUploadOutlined />,
        to: '/upload',
        reg: /^\/upload$/gm,
        caps: (userrights: UserRights) => {
            return userrights.canUnfreeze || userrights.canUploadFiles;
        }
    },
    {
        display: 'Ausloggen',
        icon: <LogoutOutlined />,
        to: '/logout',
        reg: /^\/logout$/gm,
        caps: (userrights: UserRights) => {
            return true;
        }
    }
]

export default function SidebarLayout({children, user}: ComponentProps){
    const [collapsed, setCollapsed] = useState(false);
    const { token: { colorBgContainer }, } = theme.useToken();
    const router = useRouter();

    const navItemsToMenuItems = () => {
        let menuitems: Array<any> = [];

        let userRoleObj = user.role.capabilities;
        console.log(userRoleObj);

        sidebarNavItems.forEach((elm, idx) => {
            
            if(elm.caps(userRoleObj)){
                menuitems.push({
                    key: idx.toString(),
                    icon: elm.icon,
                    label: <Link href={elm.to}>{elm.display}</Link>
                });
            }
        })

        return menuitems;
    }

    const getActiveIndex = () => {
        let act = -1;

        sidebarNavItems.forEach((elm, idx) => {
            if(router.pathname.match(elm.reg)){
                act = idx;
            }
        })

        return act.toString();
    }

    return(
        <Layout hasSider>
            <Sider
                trigger={null} collapsible collapsed={collapsed}
                style={{
                    height: '100vh',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <div className="sidebar-logo">
                    <img src="/logo_klein.png" width={50} height={50} alt="Logo" />
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={[getActiveIndex()]}
                    items={navItemsToMenuItems()}
                >
                </Menu>
            </Sider>
            <Layout className="site-layout">
                <Header
                style={{
                    padding: 0,
                    background: colorBgContainer,
                    paddingBottom: 20
                  }}
                >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                        fontSize: '16px',
                        width: 64,
                        height: 64,
                        }}
                    />
                </Header>
                <Content
                style={{
                    background: colorBgContainer,
                    overflow: 'scroll'
                }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}