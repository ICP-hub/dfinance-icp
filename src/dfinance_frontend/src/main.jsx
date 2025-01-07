import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.scss"
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import { store } from "./redux/store"
import { AuthProvider } from "./utils/useAuthClient"


ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
    <Provider store={store}>
      <AuthProvider >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  // </React.StrictMode>
)
