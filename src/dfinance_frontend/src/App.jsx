import React, { useEffect, useState } from "react";
import {useRoutes } from "react-router-dom";
import { useAuth } from "./utils/useAuthClient";
import routesList from './routes/routes';
import { useSelector } from 'react-redux';

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

  


  const routes = useRoutes(routesList)

  return routes;
}