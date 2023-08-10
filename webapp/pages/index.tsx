import Layout from "@/components/layout/layout";
import Sidebar from "@/components/sidebar/sidebar";
import { GetServerSideProps } from "next";

//Define a type for the cookie
type User = {
    username: string;
    email: string;
    roleid: number;
  };
  
  interface InitialProps {
    InitialState: User;
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
      return {
        props: {
          InitialState: JSON.parse(
            Buffer.from(cookies.login, "base64").toString("ascii")
          ),
        },
      };
    }
  };

export default function Dashboard(props: InitialProps){
    return(
        <div>
            <Layout user={props.InitialState}>
                <h3>Hallo @{props.InitialState.username}</h3>
            </Layout>
        </div>
    );
}