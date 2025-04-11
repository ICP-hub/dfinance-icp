import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.scss"
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import { store } from "./redux/store"
import { AuthProvider } from "./utils/useAuthClient"
import { ToastContainer } from "react-toastify"


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider >

        <BrowserRouter>
          <App />
          <ToastContainer
            position="top-right"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          ></ToastContainer>
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
)
