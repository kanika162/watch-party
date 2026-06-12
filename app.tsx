import React from "react";
import AppRouter from "./router";
import Layout from "./components/Layout";
import Toast from "./components/Toast";

const App: React.FC = () => {
  return (
    <Layout>
      <AppRouter />
      <Toast />
    </Layout>
  );
};

export default App;
