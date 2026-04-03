import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import { AuthPage } from "@/pages/AuthPage";
import { ContactPage } from "@/pages/ContactPage";
import { HomePage } from "@/pages/HomePage";
import { GalleryPage } from "@/pages/GalleryPage";
import { ProfilePage } from "@/pages/ProfilePage";

export const Router = createBrowserRouter([
    {
        path: "/auth",
        element: <AuthPage />,
    },
    {
        path: "/contact",
        element: <ContactPage />,
    },
    {
        element: <App />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: "profile/:slug",
                element: <ProfilePage />,
            },
            {
                path: "gallery",
                element: <GalleryPage />,
            },
        ],
    },
]);
