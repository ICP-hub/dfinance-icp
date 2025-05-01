import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.scss"
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import { store } from "./redux/store"
import { AuthProvider } from "./utils/useAuthClient"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider >
      <BrowserRouter>
          <App />
          <ToastContainer
            className="custom-toast"
            position="top-center"
            autoClose={3000}
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
            draggable
            progress={undefined}
          />
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
)
