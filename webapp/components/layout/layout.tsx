import { ReactNode } from "react";
import Sidebar from "../sidebar/sidebar";
import "./layout.scss"

type PrimitiveUser = {
    username: string,
    email: string
}

type ComponentProps = {
    children: ReactNode,
    user: PrimitiveUser
}

export default function Layout({children, user}: ComponentProps){
    return(
        <div className="layout-container">
            <Sidebar user={user}/>
            <div className="page-content">
                {children}
            </div>
            
        </div>
    );
}