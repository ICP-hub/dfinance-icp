import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.scss"

import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import { store } from "./redux/store"
import { AuthProvider } from "./utils/useAuthClient"

// init
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider >
      <Provider store={store}>
        <BrowserRouter>
          <App/>
        </BrowserRouter>
      </Provider>
    </AuthProvider>
  </React.StrictMode>
)
