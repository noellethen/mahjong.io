import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Homepage from "./pages/Homepage";
import Gamemode from "./pages/Gamemode";
import ShopPage from "./pages/shop";
import CustomisePage from "./pages/Customise";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signin", element: <Signin /> },
  { path: "/homepage", element: <Homepage /> },
  { path: "/gamemode", element: <Gamemode /> },
  { path: "/shop", element: <ShopPage /> },
  { path: "/customise", element: <CustomisePage /> },
  { path: "*", element: <Homepage /> },
]);
