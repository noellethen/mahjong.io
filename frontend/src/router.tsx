import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Homepage from "./components/Homepage";
import Gamemode from "./components/Gamemode";
import ShopPage from "./components/Shop";
import CustomisePage from "./components/Customise";
import QuizPage from "./components/Quiz";
import TutorialPage from "./components/Tutorial";
import PrivateRoute from "./components/PrivateRoute";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signin", element: <Signin /> },
  {
    path: "/homepage",
    element: (
      <PrivateRoute>
        <Homepage />{" "}
      </PrivateRoute>
    ),
  },
  { path: "/gamemode", element: <Gamemode /> },
  { path: "/shop", element: <ShopPage /> },
  { path: "/customise", element: <CustomisePage /> },
  { path: "/quiz", element: <QuizPage /> },
  { path: "/tutorial", element: <TutorialPage /> },
  { path: "*", element: <Homepage /> },
]);
