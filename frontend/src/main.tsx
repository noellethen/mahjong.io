import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.jsx";
import { AuthContextProvider } from "./context/AuthContext.tsx";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="min-h-screen flex flex-col items-center">
      <h1 className="pt-4 text-3xl">mahjong.io</h1>
      <AuthContextProvider>
        <RouterProvider router={router} />
      </AuthContextProvider>
    </div>
  </React.StrictMode>
);
