import Image from "next/image";
import "./style.scss"
import axios from "axios";
import router from "next/router";
import { GetServerSideProps } from "next";
import { Alert, Button, Checkbox, Form, Input } from 'antd';
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

    const onFinish = (values: any) => {
        axios.post('/api/login', {
            username: values.username,
            password: values.password
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
    };
    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
        setLoginFailed(true);
    };

    return(
        <main>
            <div style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
            }}>
                <div>
                    <img src={"/logo_wohnbau.svg"} alt="Logo" width={244} height={244}/>
                </div>
                <Form
                    name="basic"
                    labelCol={{
                        span: 8,
                    }}
                    wrapperCol={{
                        span: 24,
                    }}
                    style={{
                        width: 600,
                    }}
                    initialValues={{
                        remember: true,
                    }}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    onChange={() => {setLoginFailed(false)}}
                    autoComplete="off"
                    layout="vertical"
                >
                    <Form.Item
                    label="Benutzer"
                    name="username"
                    rules={[
                        {
                        required: true,
                        message: 'Bitte geben Sie einen Benutzernamen an!',
                        },
                    ]}
                    >
                    <Input />
                    </Form.Item>

                    <Form.Item
                    label="Passwort"
                    name="password"
                    rules={[
                        {
                        required: true,
                        message: 'Bitte geben Sie ein Passwort an!',
                        },
                    ]}
                    >
                    <Input.Password />
                    </Form.Item>

                    <Alert style={{marginBottom: 20, display: (loginFailed)? "block": "none"}} message="Beim Anmelden ist etwas schief gelaufen bitte versuchen Sie es noch einmal!" type="error" />

                    <Form.Item
                        wrapperCol={{
                            offset: 0,
                            span: 24,
                        }}
                        style={{
                            textAlign: "center"
                        }}
                    >
                        <Button type="primary" htmlType="submit">
                            Anmelden
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </main>
    );

    /*return(
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
    );*/
}