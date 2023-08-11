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
import { faBinoculars, faTrash } from '@fortawesome/free-solid-svg-icons';
import { prisma } from '../../db';
import Layout from '@/components/layout/layout';



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

    console.log(!isNaN(parseInt(param)));
    console.log(param);

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

    const deleteUser = async (userId: number) => {
        
        axios.delete('/api/users/' + userId, {})
        .then(function (response) {
            //reload data
            console.log(response);
            refreshData();
        })
        .catch(function (error) {

            //TODO Add error handling
        });

        //Close popup
        handleDeleteClose();
    }

    const searchForUser = (val: string) => {
        if(val != ""){
            router.push('/users/' + val);
        }
    }

    //Method used to create a new user if the current user submits the form
    const createNewUser = async (event: React.SyntheticEvent) => {
        event.preventDefault();

        //Define a type for the supplied form-data
        const target = event.target as typeof event.target & {
            username: { value: string };
            email: { value: string };
            role: { value: number };
            password: { value: string };
            passwordwdhl: { value: string };
            branch: { value: number };
        };

        //Define a default case for the error
        let error = false;
        //Define a array so save error-messages
        let msg: any = [];

        //if both supplied passwords do not match, mark error as true and add a error message to the error list
        if(target.password.value != target.passwordwdhl.value){
            error = true;
            msg.push("Passwörter stimmen nicht überein!");
        }

        //Query the api if the entered username is already in use
        let isUsernameInUse = await axios.get('/api/users/username/' + target.username.value);

        //Test if the username is in use, if so mark error as true and add a error message to the error list
        if(isUsernameInUse.data.errorcode == -2){
            error = true;
            msg.push("Username bereits vergeben!");
        }

        //Query the api if the entered e-mail is already in use
        let isEmailInUse = await axios.get('/api/users/email/' + target.email.value);

        //Test if the e-mail is used, if so mark error as true and add a error message to the error list
        if(isEmailInUse.data.errorcode == -2){
            error = true;
            msg.push("E-Mail bereits in benutzung!");
        }

        //If no error has been trown by the ifs above...
        if(!error){
            axios.post('/api/users', {
                username: target.username.value,
                role: target.role.value,
                email: target.email.value,
                password: target.password.value,
            })
            .then(function (response) {
                //reload data
                refreshData();
            })
            .catch(function (error) {
    
                //TODO Add error handling
            });

            //Set the error-message array to the default state
            setErrMsg([]);
            //Close popup
            handleClose();
        }else{
            //Update the state of error messages
            setErrMsg(msg);
        }

    }

    //Maps the roles so we can display them in the corresponding select
    const roles = props.Data.roles.map((rol: Role, key: number) => {
        return(
            <option key={key} value={rol.id}>{rol.name}</option>
        );
    });

    const paginationItems = (page: string, count: number) =>{
        if( !isNaN(parseInt( page )) ){
            let pageNo = parseInt( page );

            let isThereApageLeft = (elementesPerPage*pageNo < count)? <><li className="page-item"><a className="page-link" href={"/users/" + (pageNo+1)}>{pageNo+1}</a></li><li className="page-item"><a className="page-link" href={"/users/" + (pageNo+1)}>Next</a></li></>: <></>;

            if( pageNo > 1 ){
                return(
                    <ul className="pagination">
                        <li className="page-item"><a className="page-link" href="#">Previous</a></li>
                        <li className="page-item"><a className="page-link" href={"/users/" + (pageNo-1)}>{pageNo-1}</a></li>
                        <li className="page-item"><a className="page-link" href={"/users/" + pageNo}>{pageNo}</a></li>
                        {isThereApageLeft}
                    </ul>
                );
            }else{
                return(
                    <ul className="pagination">
                        <li className="page-item"><a className="page-link" href={"/users/" + pageNo}>{pageNo}</a></li>
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
                        <Button variant="success" onClick={handleShow}>
                                + Hinzufügen
                        </Button>
                            <div className="searchBarBox">
                                <div className="input-group mb-3">
                                    <input value={searchVal} onChange={(event) => {setSearchVal(event.target.value)}} type="text" className="form-control" placeholder="suchen..." aria-label="search" aria-describedby="basic-addon1" />
                                    <div className="input-group-prepend">
                                        <span className="input-group-text" id="basic-addon1"><button onClick={() => {searchForUser(searchVal)}} className="searchButton" ><FontAwesomeIcon icon={faBinoculars} className="elementicon" size="xs" fixedWidth/></button></span>
                                    </div>
                                </div>
                            </div>
                    </div>
                    <table className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Username</th>
                                <th scope="col">Email</th>
                                <th scope="col">Role</th>
                                <th scope="col"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {props.Data.users.map((user: User) => {
                                const deleteButton = (user.id != 1)? <button onClick={(event) =>{deleteUser(user.id)}} type="button" className="btn btn-danger"><FontAwesomeIcon icon={faTrash} className="elementicon" size="xs" fixedWidth/></button> : <div></div>;
                                
                                return(
                                    <tr key={user.id}>
                                        <th scope="row">{user.id}</th>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role.name}</td>
                                        <td>
                                            {deleteButton}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <Modal show={show} onHide={handleClose}>
                            <Form onSubmit={(event) => {
                                createNewUser(event);
                            }}>
                                <Modal.Header closeButton>
                                    <Modal.Title>Einen neuen User hinzufügen</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <InputGroup className="mb-3">
                                        <InputGroup.Text className="inputPrepend" id="productname">Username</InputGroup.Text>
                                        <FormControl
                                            placeholder="Der Username des Users"
                                            aria-label="Der Username des Users"
                                            aria-describedby="username"
                                            name="username"
                                        />
                                    </InputGroup>

                                    <InputGroup className="mb-3">
                                        <InputGroup.Text className="inputPrepend" id="productname">E-Mail</InputGroup.Text>
                                        <FormControl
                                            placeholder="Die E-Mail des Users"
                                            aria-label="Die E-Mail des Users"
                                            aria-describedby="useremail"
                                            name="email"
                                        />
                                    </InputGroup>

                                    <InputGroup className="mb-3">
                                        <InputGroup.Text className="inputPrepend" id="userrole">Rolle</InputGroup.Text>
                                        <Form.Select aria-label="Kategorie" name="role">
                                            {roles}
                                        </Form.Select>
                                    </InputGroup>

                                    <InputGroup className="mb-3">
                                        <InputGroup.Text className="inputPrepend" id="productprice">Passwort</InputGroup.Text>
                                        <FormControl
                                            type="password"
                                            aria-label="Das Passwort des Users"
                                            aria-describedby="userpassword"
                                            name="password"
                                        />
                                    </InputGroup>

                                    <InputGroup className="mb-3">
                                        <InputGroup.Text className="inputPrepend" id="productprice">Passwort (wdhl.)</InputGroup.Text>
                                        <FormControl
                                            type="password"
                                            aria-label="Passwort wiederholen"
                                            aria-describedby="userpasswordwdhl"
                                            name="passwordwdhl"
                                        />
                                    </InputGroup>

                                    {errMsg.map((err: String, key: number) => {
                                        return (<div key={key} className="alert alert-danger" role="alert">{err}</div>);
                                    })}
                                    
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button variant="secondary" onClick={handleClose}>
                                        Schließen
                                    </Button>
                                    <Button variant="primary" type="submit" >
                                        Hinzufügen
                                    </Button>
                                </Modal.Footer>
                            </Form>
                        </Modal>
                    </table>

                    <div className="paginationFooter">
                        <nav aria-label="Page navigation users">
                            {paginationItems(props.Data.pageNo, props.Data.userCount)}
                        </nav>
                    </div>
                </div>
            </Layout>
        </div>
    );

}