import Image from "next/image";
import "./style.scss"
import axios from "axios";
import router from "next/router";
import { GetServerSideProps } from "next";


type User = {
    username: string;
    email: string;
    roleid: number;
};

type PresentationData = {

}

interface InitialProps {
    InitialState: User;
    Data: PresentationData;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx;
    //Get the cookies from the current request
    const { cookies } = req;

    //Check if the login cookie is set
    if (!cookies.login) {
        //Redirect if the cookie is not set
        res.writeHead(302, { Location: "/login" });
        res.end();

        return { props: { InitialState: {} } };
    } else {

        let guvdata = await axios.get('/api/data/guv');

        return {
            props: {
                InitialState: JSON.parse(
                Buffer.from(cookies.login, "base64").toString("ascii")
                ),
                data: guvdata,
            },
        };
    }
};

export default function Guv(){
    return(
        <div className="presentation-page">

        </div>
    );
}