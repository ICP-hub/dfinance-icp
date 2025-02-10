import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.scss"
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import { store } from "./redux/store"
import { AuthProvider } from "./utils/useAuthClient"
import { StoicAuthProvider } from "./utils/useStoicAuth";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
    <StoicAuthProvider>
      <AuthProvider >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
      </StoicAuthProvider>
    </Provider>
  </React.StrictMode>
)
