import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Search from "./pages/Search";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import MechanicProfile from "./pages/MechanicProfile";
import Book from "./pages/Book";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />
  },
  {
    path: "/about",
    element: <About />
  },
  {
    path: "/contact",
    element: <Contact />
  },
  {
    path: "/services",
    element: <Services />
  },
  {
    path: "/search",
    element: <Search />
  },
  {
    path: "/mechanic/:id",
    element: <MechanicProfile />
  },
  {
    path: "/book/:id",
    element: <Book />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    path: "/dashboard/*",
    element: <Dashboard />
  },
  {
    path: "*",
    element: <NotFound />
  }
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
