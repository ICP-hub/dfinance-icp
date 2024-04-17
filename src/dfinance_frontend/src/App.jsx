import React, { useEffect, useState } from "react";
import {useRoutes } from "react-router-dom";
import { useAuth, AuthProvider } from "./utils/useAuthClient";
import routesList from './routes/routes';

export default function App() {
  // const { reloadLogin } = useAuth();

  // useEffect(() => {
  //   reloadLogin();
  // }, []);


  const routes = useRoutes(routesList)

  return routes;
}