import React, { useEffect, useState } from "react";
import { useRoutes } from "react-router-dom";
import { useAuth } from "./utils/useAuthClient";
import routesList from './routes/routes';
import { useSelector } from 'react-redux';
import Loading from "./components/Loading";
import { usePageLoading } from "./components/useLoading";

export default function App() {
  const theme = useSelector((state) => state.theme.theme);
  const { reloadLogin } = useAuth();

  useEffect(() => {
    reloadLogin();
  }, []);


  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#070a18';
    }
  }, [theme]);



  const isLoading = usePageLoading();


  const routes = useRoutes(routesList)
  if (isLoading) {
    return <Loading isLoading={isLoading} />
  }

  return routes;

}