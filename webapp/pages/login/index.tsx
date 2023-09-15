import Image from "next/image";
import "./style.scss"
import axios from "axios";
import router from "next/router";
import { GetServerSideProps } from "next";
import { Alert } from "react-bootstrap";
import { useState } from "react";


export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx
    //Get the cookies from the current request
    const {cookies} = req
    
    //Check if the login cookie is set
    if( cookies.login ){
        //Redirect if the cookie is not set
        res.writeHead(302, { Location: "/dashboard" });
        res.end();
    }

    return { props: { InitialState: {} } }
}

export default function Login(){
    const [ loginFailed, setLoginFailed ] = useState(false);

    const login = async (event: React.SyntheticEvent) => {
        event.preventDefault();
    
        const target = event.target as typeof event.target & {
            username: { value: string };
            password: { value: string };
        };
    
        axios.post('/api/login', {
            username: target.username.value,
            password: target.password.value
        })
          .then(function (response) {
            setLoginFailed(false);
    
            // Make sure we're in the browser
            if (typeof window !== 'undefined') {
                router.push('/');
                return; 
            }
    
        })
          .catch(function (error) {
            console.log(error);
            setLoginFailed(true);
        });
    }

    return(
        <div className="login-page">
            <div className="login-content">
                <Image src="logo_wohnbau.svg" width={250} height={100} alt="Logo"/>
                <div className="login-input">
                    <form onSubmit={(event) => {
                        login(event)
                    }}>
                        <div className="input-group mb-3">
                            <span className="input-group-text input-descr" id="username-description">Benutzername</span>
                            <input type="text" className="form-control" name="username" placeholder="Benutzername" aria-label="Username" onChange={() => {setLoginFailed(false)}} />
                        </div>

                        <div className="input-group mb-3">
                            <span className="input-group-text input-descr" id="passwort-description">Passwort</span>
                            <input type="password" className="form-control" name="password" placeholder="Passwort" aria-label="Passwort" onChange={() => {setLoginFailed(false)}}/>
                        </div>

                        <div className={`error-alert-row ${(!loginFailed)? "visible-error": ""}`}>
                            <Alert variant="danger">Die Kombination aus Benutzername und Passwort konnte nicht gefunden werden!</Alert>
                        </div>

                        <div className="d-grid gap-2 login-button-row">
                            <button className="btn btn-primary" type="submit">Login</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}