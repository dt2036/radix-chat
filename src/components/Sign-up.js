import React, { Component } from 'react';

import axios from 'axios';

import { ToastContainer, toast, Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth } from "../services/firebase";
import moment from 'moment';
import { db } from "../services/firebase"
const timestamp = moment()
    .valueOf()
    .toString()


export default class SignUpComponent extends Component {
    constructor(props) {  
        super(props);
        this.state = {
            email: '',
            password: '',
            displayName: '',
            errors: {}
        }
    }

    onChangeHandler = (event) => {
        let nam = event.target.name;
        let val = event.target.value;
        this.setState({ [nam]: val });

    }

    onSubmit = async (e) => {
        const { email, password, displayName } = this.state;
        e.preventDefault();
        if (this.validateForm()) {
            axios.post(
                'http://localhost:3001/users/AddUser', {
                email,
                password
            },
            )
                .then((response) => {
                    debugger;
                    // Success
                    if (response.status === 200) {
                        auth.auth().createUserWithEmailAndPassword(email, password).then(result => {
                            const userData = {
                                userId:response.data.userId.toString(),
                                email: email,
                                displayName: displayName,
                                created_at: timestamp,
                                last_logins: timestamp,
                                profileUrl: "",
                                aboutMe: "",
                                role: "Developer",
                                // assignGroups:["1603968906457","1603968906434"]
                            };
                            debugger;
                            db.collection("users")
                                .doc(response.data.userId.toString())
                                .set(userData)
                                .then((ref) => {
                                    debugger;
                                    toast.success("User Added Successfully!", { transition: Flip, autoClose: 3000 });
                                    setTimeout(function () {
                                        window.history.pushState(null, null, window.location.replace('/'));
                                    }, 2000);
                                })
                                .catch(error => {
                                    debugger;
                                    toast.error(error, { transition: Flip, autoClose: 3000 });
                                });
                        }).catch(error => {
                            toast.error(error, { transition: Flip, autoClose: 3000 });
                        });

                    }
                })
                .catch((error) => {
                    toast.error(error, { transition: Flip, autoClose: 3000 });
                });
        }
    }

    validateForm() {
        let fields = this.state;
        let errors = {};
        let formIsValid = true;
        if (!fields["email"]) {
            formIsValid = false;
            errors["email"] = "*Please enter your email.";
        }
        if (fields["email"] !== "") {
            //regular expression for email validation
            var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
            if (!pattern.test(fields["email"])) {
                formIsValid = false;
                errors["email"] = "*Please enter valid email.";
            }
        }
        if (!fields["password"]) {
            formIsValid = false;
            errors["password"] = "*Please enter your password.";
        }
        if (fields["password"] !== "") {
            if (!fields["password"].match(/^.*(?=.{8,})(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&]).*$/)) {
                formIsValid = false;
                errors["password"] = "*Please enter secure and strong password.";
            }
        }
        if (!fields["displayName"]) {
            formIsValid = false;
            errors["displayName"] = "*Please enter display name.";
        }
        this.setState({
            errors: errors
        });
        console.log(this.state.errors);
        return formIsValid;
    }

    render() {
        return (
            <div id="logreg-forms">
                <form onSubmit={this.onSubmit} className="form-signin" >
                    <center><h1 className="h3 mb-3 font-weight-normal" > Sign Up</h1></center>
                    <br></br>
                    <input type="email" id="email" className="form-control"
                        placeholder="Email address" name="email"
                        value={this.state.email}
                        onChange={this.onChangeHandler} />
                    <span className="errorMsg">{this.state.errors.email}</span>
                    <br></br>
                    <input type="password" id="password" className="form-control"
                        placeholder="Password" required="" name="password"
                        value={this.state.password}
                        onChange={this.onChangeHandler} />
                    <span className="errorMsg">{this.state.errors.password}</span>
                    <br></br>
                    <input type="text" id="displayName" className="form-control"
                        placeholder="Display Name" required="" name="displayName"
                        value={this.state.displayName}
                        onChange={this.onChangeHandler} />
                    <span className="errorMsg">{this.state.errors.displayName}</span>

                    <hr />
                    <button className="btn btn-primary btn-block" type="submit" id="btn-signup">
                        <i className="fas fa-user-plus"></i> Create an Account</button>
                    <ToastContainer />
                </form>
            </div>
        )
    }
}

