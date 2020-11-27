import React from 'react';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useLocation
} from "react-router-dom";
import LoginComponent from "./components/Login";
import SignUpComponent from "./components/Sign-up";
import Room from './components/Room';



function App() {
  let location = useLocation();

  return (
    <Router>
      <div>
        <Switch>
          <Route path="/" exact component={LoginComponent} />
          <Route path="/sign-up" component={SignUpComponent} />
          <Route path="/room">
            <Room />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
