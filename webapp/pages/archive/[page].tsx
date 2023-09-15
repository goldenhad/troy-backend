import './style.scss'
import { GetServerSideProps } from 'next'
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { prisma } from '../../db';
import Layout from '@/components/layout/layout';
import { Table, Button, Input, Modal, Form, Space, Alert, Select } from 'antd';
import {
    StopOutlined,
    SearchOutlined
} from '@ant-design/icons';







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



export default function Users(props: InitialProps){
    const [searchVal, setSearchVal] = useState("");
    const router = useRouter();
    

    const searchForFile = () => {
        if(searchVal != ""){
            router.push('/archive/' + searchVal);
        }
    }


    const columns = [
        {
            title: '#',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Jahr',
            dataIndex: 'year',
            key: 'year',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (_: any, obj: any) =>{
                return (obj.status)? "Freigegeben": "In Bearbeitung"
            }
        },
        {
            title: 'Aktion',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, obj: any) => {
                return (
                    <Space direction='horizontal'>
                        <Button href={`/archive/details/${obj.year}`}>Ansehen</Button>
                    </Space>
                );
            }
        },
    ]


    return(
        <div>
            <Layout user={props.InitialState}>
                <div className="content">
                    <div className="addButtonRow">
                        <div className="searchBarBox">
                            <Space.Compact style={{ width: '100%' }}>
                                <Input placeholder="Suche..." onChange={(event) => {setSearchVal(event.target.value)}}/>
                                <Button onClick={() => {searchForFile()}}><SearchOutlined /></Button>
                            </Space.Compact>
                        </div>
                    </div>
                    <Table className="data-table" columns={columns} dataSource={props.Data.entries} />
                </div>
            </Layout>
        </div>
    );

}