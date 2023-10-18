import SidebarLayout from "@/components/layout/layout";
import { ParsedRole } from "@/helper/user";
import { Role } from "@prisma/client";
import { GetServerSideProps } from "next";

//Define a type for the cookie
type User = {
    username: string;
    email: string;
    role: ParsedRole;
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
      <SidebarLayout user={props.InitialState}>
          <h3>Hallo @{props.InitialState.username}</h3>
      </SidebarLayout>
    );
}