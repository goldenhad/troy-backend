import type { NextPage } from 'next'
import Head from 'next/head'
import 'bootstrap/dist/css/bootstrap.css';
import './style.scss'
import { GetServerSideProps } from 'next'
import React, { useState } from 'react';
import Sidebar from '@/components/sidebar/sidebar';
import { Modal, Button, InputGroup, FormControl, Form } from 'react-bootstrap';
import axios from 'axios';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBinoculars, faTrash, faArrowRight, faEye } from '@fortawesome/free-solid-svg-icons';
import { prisma } from '../../db';
import Layout from '@/components/layout/layout';
import Link from 'next/link';



const elementesPerPage = 50;

//Define a user type for the cookie
type Login = {
    id: number,
    username: string,
    email: string,
    roleid: number
}

type User = {
    username: string;
    email: string;
    roleid: number;
};

type Files = {
    id: number;
    year: number;
    status: boolean;
}
  
interface InitialProps {
    Data: PropsData;
    InitialState: User;
}

//Define a type for the Data of the NextJS Page props
type PropsData = {
    entries: Array<Files>,
    pageNo: string,
    entryCount: number,
}


export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx
    //Get the cookies from the current request
    const {cookies} = req
    
    //Check if the login cookie is set
    if( !cookies.login ){
        //Redirect if the cookie is not set
        return {
            redirect: {
              permanent: false,
              destination: "/login",
            },
            props: { InitialState: {} }
          }
    }

    let param = "";

    if( ctx.query.page ){
        param = ctx.query.page[0] as string;
    }

    let entries: any = [];

    const entrycount = await prisma.files.count();

    if( !isNaN(parseInt(param)) ){
        let pageno = parseInt(param);

        if( pageno > 0 && pageno <= Math.floor(entrycount / elementesPerPage )+1){
            //Query the users from the database
            entries = await prisma.files.findMany({
                take: elementesPerPage,
                skip: elementesPerPage*(pageno-1),
                orderBy: {
                    id: 'desc'
                },
            });
    
        }else{
            return {
                redirect: {
                  permanent: false,
                  destination: "/archive/1",
                },
                props: { InitialState: {} }
              }
        }
    }else{
        let searchParam = param;

        if( searchParam != "" ){
            //Query the users from the database
            entries = await prisma.files.findMany({
                //Define the fields we are querieng
                orderBy: {
                    id: 'desc'
                },
                where: { 
                    year: parseInt(searchParam)
                }
            });

        }else{
            return {
                redirect: {
                  permanent: false,
                  destination: "/archive/1",
                },
                props: { InitialState: {} }
              }
        }
    }

    return { props: { InitialState: JSON.parse(Buffer.from((cookies.login)? cookies.login: "", 'base64').toString('ascii')), Data: {entries: entries, entryCount: entrycount, pageNo: param} } }
}



export default function Archive(props: InitialProps){
    //Define a state to handle the popups state
    const [show, setShow] = useState(false);
    //Helper functions to handle setState for the popup
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [showDelete, setShowDelete] = useState(false);
    const handleDeleteClose = () => setShowDelete(false);
    const handleDeleteShow = () => setShowDelete(true);

    const [searchVal, setSearchVal] = useState("");


    const [ errMsg, setErrMsg ] = useState([]);

    const router = useRouter();

    const refreshData = () => {
        router.replace(router.asPath);
    }

    const searchForEntry = (val: string) => {
        if(val != ""){
            router.push('/archive/' + val);
        }
    }

    const paginationItems = (page: string, count: number) =>{
        if( !isNaN(parseInt( page )) ){
            let pageNo = parseInt( page );

            let isThereApageLeft = (elementesPerPage*pageNo < count)? <><li className="page-item"><a className="page-link" href={"/archive/" + (pageNo+1)}>{pageNo+1}</a></li><li className="page-item"><a className="page-link" href={"/archive/" + (pageNo+1)}>Next</a></li></>: <></>;

            if( pageNo > 1 ){
                return(
                    <ul className="pagination">
                        <li className="page-item"><a className="page-link" href="#">Previous</a></li>
                        <li className="page-item"><a className="page-link" href={"/archive/" + (pageNo-1)}>{pageNo-1}</a></li>
                        <li className="page-item"><a className="page-link" href={"/archive/" + pageNo}>{pageNo}</a></li>
                        {isThereApageLeft}
                    </ul>
                );
            }else{
                return(
                    <ul className="pagination">
                        <li className="page-item"><a className="page-link" href={"/archive/" + pageNo}>{pageNo}</a></li>
                        {isThereApageLeft}
                    </ul>
                );
            }
        }
    }

    return(
        <div>
            <Layout user={props.InitialState}>
                <div className="content">
                    <div className="addButtonRow">
                        
                        <div className="searchBarBox">
                            <div className="input-group mb-3">
                                <input value={searchVal} onChange={(event) => {setSearchVal(event.target.value)}} type="text" className="form-control" placeholder="suchen..." aria-label="search" aria-describedby="basic-addon1" />
                                <div className="input-group-prepend">
                                    <span className="input-group-text" id="basic-addon1"><button onClick={() => {searchForEntry(searchVal)}} className="searchButton" ><FontAwesomeIcon icon={faBinoculars} className="elementicon" size="xs" fixedWidth/></button></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <table className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Jahr</th>
                                <th scope="col">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {props.Data.entries.map((entry: Files) => {
                                
                                const currentyear = new Date().getFullYear();

                                if(entry.year != currentyear){
                                    return(
                                        <tr key={entry.id}>
                                            <th scope="row">{entry.id}</th>
                                            <td>{entry.year}</td>
                                            <td><Link href={`/archive/details/${entry.year}`}><FontAwesomeIcon icon={faEye}/></Link></td>
                                        </tr>
                                    );
                                }
                            })}
                        </tbody>
                    </table>

                    <div className="paginationFooter">
                        <nav aria-label="Page navigation users">
                            {paginationItems(props.Data.pageNo, props.Data.entryCount)}
                        </nav>
                    </div>
                </div>
            </Layout>
        </div>
    );

}