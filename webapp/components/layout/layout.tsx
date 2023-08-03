import Sidebar from "../sidebar/sidebar";
import "./layout.scss"

export default function Layout({children}){
    return(
        <div className="layout-container">
            <Sidebar />
            <div className="page-content">
                {children}
            </div>
            
        </div>
    );
}