import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth, AuthProvider } from "./utils/useAuthClient";
import routes from './routes/routes';


function App() {
  const { reloadLogin } = useAuth();

  useEffect(() => {
    reloadLogin();
  }, []);

  return (

    <Router>
      <Routes>
        {routes.map((route, index) => (
          <Route
            key={index}
            path={route.path}
            element={route.component}
          />
        ))}

      </Routes>
    </Router>
  );
}

export default () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);