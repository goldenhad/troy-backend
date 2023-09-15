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
    id: number,
    username: string,
    email: string,
    role: Role,
}

//Redefine the product type for the product query
type Role = {
    id: number,
    name: string
}
  
interface InitialProps {
    Data: any;
    InitialState: User;
}

//Define a type for the Data of the NextJS Page props
type PropsData = {
    users: Array<User>,
    roles: Array<Role>,
    pageNo: string,
    userCount: number,
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

    let users: any = [];
    let roles: any = [];

    const userCount = await prisma.user.count();

    if( !isNaN(parseInt(param)) ){
        let pageno = parseInt(param);

        if( pageno > 0 && pageno <= Math.floor(userCount / elementesPerPage )+1){
            //Query the users from the database
            users = await prisma.user.findMany({
                //Define the fields we are querieng
                include: {
                    role: true,
                },
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
                  destination: "/users/1",
                },
                props: { InitialState: {} }
              }
        }
    }else{
        let searchParam = param;

        if( searchParam != "" ){
            //Query the users from the database
            users = await prisma.user.findMany({
                //Define the fields we are querieng
                include: {
                    role: true,
                },
                orderBy: {
                    id: 'desc'
                },
                where: { 
                    OR: [
                        {
                            username: {
                                contains: searchParam,
                            },
                            email: {
                                contains: searchParam,
                            },
                        },
                    ]
                }
            });

        }else{
            return {
                redirect: {
                  permanent: false,
                  destination: "/users/1",
                },
                props: { InitialState: {} }
              }
        }
    }

    roles = await prisma.role.findMany({});

    return { props: { InitialState: JSON.parse(Buffer.from((cookies.login)? cookies.login: "", 'base64').toString('ascii')), Data: {users: users, roles: roles, userCount: userCount, pageNo: param} } }
}



export default function Users(props: InitialProps){
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(-1);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [searchVal, setSearchVal] = useState("");
    const [ errMsg, setErrMsg ] = useState([]);
    const router = useRouter();
    
    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const showDeleteModal = () => {
        setIsDeleteModalOpen(true);
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);
    };


    const refreshData = () => {
        router.replace(router.asPath);
    }

    const deleteUser = async (values: any) => {
        
        axios.delete('/api/users/' + userToDelete, {})
        .then(function (response) {
            refreshData();
        })
        .catch(function (error) {

        });

        handleDeleteCancel();
    }

    const searchForUser = () => {
        if(searchVal != ""){
            router.push('/users/' + searchVal);
        }
    }

    //Method used to create a new user if the current user submits the form
    const createNewUser = async (values: any) => {
        //Define a default case for the error
        let error = false;
        //Define a array so save error-messages
        let msg: any = [];

        if(values.userpassword != values.userpasswordwdhl){
            error = true;
            msg.push("Die eingegebenen Passwörter stimmen nicht überein!");
        }

        let isUsernameInUse = await axios.get('/api/users/username/' + values.username);

        if(isUsernameInUse.data.errorcode == -2){
            error = true;
            msg.push("Der Benutzername ist bereits vergeben!");
        }

        let isEmailInUse = await axios.get('/api/users/email/' + values.email);

        if(isEmailInUse.data.errorcode == -2){
            error = true;
            msg.push("E-Mail bereits in benutzung!");
        }

        if(!error){
            axios.post('/api/users', {
                username: values.username,
                role: values.role,
                email: values.email,
                password: values.userpassword,
            })
            .then(function (response) {
                //reload data
                refreshData();
            })
            .catch(function (error) {
    
                //TODO Add error handling
            });

            setErrMsg([]);
            handleCancel();
        }else{
            setErrMsg(msg);
        }

    }

    //Maps the roles so we can display them in the corresponding select
    const getRoles = () => {
        let roles = [{value: "-1", label: "Bitte wählen Sie eine Rolle"}]
        props.Data.roles.forEach((rol: Role, key: number) => {
            roles.push(
                {
                    value: rol.id.toString(),
                    label: rol.name
                }
            );
        })

        return roles;
    }


    const columns = [
        {
            title: '#',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Benutzername',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'E-mail',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Rolle',
            dataIndex: 'role',
            key: 'role',
            render: (_: any, obj: any) => {
                return obj.role.name;
            }
        },
        {
            title: 'Aktion',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, obj: any) => {
                if(obj.role.name == "admin"){
                    return (
                        <Space direction='horizontal'>
                            <Button >Bearbeiten</Button>
                            <Button onClick={() => {setUserToDelete(obj.id); showDeleteModal()}}>Löschen</Button>
                        </Space>
                    );
                }else{
                    return <StopOutlined style={{color: "red"}}/>
                }
            }
        },
    ]


    return(
        <div>
            <Layout user={props.InitialState}>
                <div className="content">
                    <div className="addButtonRow">
                        <Button className='addButton' type="primary" onClick={() => {showModal()}}>
                                + Hinzufügen
                        </Button>
                            <div className="searchBarBox">
                                <Space.Compact style={{ width: '100%' }}>
                                    <Input placeholder="Suche..." onChange={(event) => {setSearchVal(event.target.value)}}/>
                                    <Button onClick={() => {searchForUser()}}><SearchOutlined /></Button>
                                </Space.Compact>
                            </div>
                    </div>
                    <Table className="data-table" columns={columns} dataSource={props.Data.users} />
                    <Modal
                        title="Benutzer hinzufügen"
                        open={isModalOpen}
                        onCancel={handleCancel}
                        footer = {[]}
                    >
                        <Form 
                            layout='vertical'
                            onFinish={createNewUser}
                        >
                            <Form.Item
                                label="Benutzername"
                                name="username"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte geben Sie einen Benutzernamen an!',
                                    },
                                ]}
                            >
                                <Input placeholder="Benutzername..." />
                            </Form.Item>

                            <Form.Item
                                label="E-Mail"
                                name="email" 
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte geben Sie eine gültige E-Mail an!',
                                    },
                                ]}
                            >
                                <Input placeholder="E-Mail..." />
                            </Form.Item>

                            <Form.Item
                                label="Rolle"
                                name="role"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte wählen Sie eine Rolle aus!',
                                    },
                                ]}
                            >
                                <Select
                                    defaultValue="-1"
                                    options={getRoles()}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Passwort"
                                name="userpassword"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte geben Sie ein Password an!',
                                    },
                                ]}
                            >
                                <Input placeholder="Passwort..." type="password"/>
                            </Form.Item>

                            <Form.Item
                                label="Passwort wdhl."
                                name="userpasswordwdhl"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte wiederholen Sie das Passwort an!',
                                    },
                                ]}
                            >
                                <Input placeholder=" wiederholen..." type="password"/>
                            </Form.Item>
                        
                            {errMsg.map((err: String, key: number) => {
                                return (<Alert key={key} message={err} type="error" />);
                            })}

                            <Form.Item className='modal-buttom-row'>
                                <Space direction='horizontal'>
                                    <Button key="close" onClick={handleCancel}>
                                        Abbrechen
                                    </Button>
                                    <Button htmlType="submit"  key="submit" type="primary">
                                        Speichern
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Modal>

                    <Modal
                        title="Benutzer löschen"
                        open={isDeleteModalOpen}
                        onCancel={handleDeleteCancel}
                        footer = {[]}
                    >
                        <Form 
                            layout='vertical'
                            onFinish={deleteUser}
                        >
                            <div className='information-text'>
                                Nach dem Löschen des Benutzers kann dieser nur durch erneutes Hinzufügen wieder hergestellt werden!
                            </div>

                            <Form.Item className='delete-modal-buttom-row'>
                                <Space direction='horizontal'>
                                    <Button key="close" onClick={handleDeleteCancel}>
                                        Abbrechen
                                    </Button>
                                    <Button htmlType="submit"  key="submit" type="primary">
                                        Löschen
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Modal>
                </div>
            </Layout>
        </div>
    );

}