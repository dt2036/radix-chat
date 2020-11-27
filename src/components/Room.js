import React from 'react';
import { Modal, Button, ListGroup, Row, Col, NavDropdown, Dropdown, MenuItem } from 'react-bootstrap'
import { ToastContainer, toast, Flip } from 'react-toastify';
import moment from 'moment'
import { db } from "../services/firebase"
import firebase from 'firebase/app';
import { FaEye, FaBell } from 'react-icons/fa';
import { MdNotifications } from 'react-icons/fa';

class Room extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            groupList: [],
            messageList: [],
            selectedItem: null,
            inputValue: '',
            userList: [],
            chatType: '',
            checkedItems: [],
            group_name: "",
            group_description: "",
            members: [],
            participantShowModel: false,
            groupAddShowModel: false,
            addMemberShowModel: false
        };
        this.loginUserName = localStorage.getItem("displayName");
        this.loginUserId = localStorage.getItem("userId");
        this.loginUserRole = localStorage.getItem("role");
        this.chatId = null;
        this.allUserListData = [];
        this.groupMemberList = [];
        this.remainingGroupMemberList = [];
        this.removeListener = null
    }

    componentWillUnmount() {
        if (this.removeListener) {
            this.removeListener()
        }
    }

    componentDidMount() {
        this.getGroupData();
        this.getUserData();
    }

    componentDidUpdate() {
        this.scrollToBottom()
    }

    changeEvent = (event) => {
        let checkedArray = this.state.checkedItems;
        let selectedValue = event.target.value;
        if (event.target.checked === true) {
            checkedArray.push(selectedValue);
            this.setState({ members: checkedArray });
        } else {
            let valueIndex = checkedArray.indexOf(selectedValue);
            checkedArray.splice(valueIndex, 1);
            this.setState({ members: checkedArray });
        }
    }

    //Selected Group click event
    selectedGroupClick = (data, type) => {
        this.setState({ chatType: type });
        this.state.selectedItem = data;
        this.setState({ selectedItem: data });
        this.state.selectedItem.name = type === "group" ? data.group_name : data.displayName
        this.getMessageListData(data, type);
        this.scrollToBottom();
    }

    //logout button click
    logoutButtonClick = () => {
        localStorage.clear();
        window.history.pushState(null, null, window.location.replace('/'));
        //  window.location.replace('/');
    }

    userWiseNotificationCount1 = async (data) => {
        debugger;
        try {
            if (
                this.hashString(this.loginUserId) <= this.hashString(data.key)
            ) {
                this.chatId = `${this.loginUserId}-${data.key}`
            } else {
                this.chatId = `${data.key}-${this.loginUserId}`
            }
            let unReadData = [];
           await db.collection("chats").doc(this.chatId).collection("messages").onSnapshot(snapshot => {
                debugger;
                unReadData = [];
                snapshot.docChanges().forEach(function (change) {
                    const item = change.doc.data();
                    item.key = change.doc.id;
                    unReadData.push(item);
                });
             
            });
            return unReadData.length;
        } catch (err) {
            console.log(err);
        }
    }

    async apiCall(chatId) {
        let unReadData = [];
        let tr45 = await db.collection("chats").doc(chatId).collection("messages").onSnapshot(snapshot => {
            debugger;
            unReadData = [];
            snapshot.docChanges().forEach(function (change) {
                const item = change.doc.data();
                item.key = change.doc.id;
                unReadData.push(item);
            });
            // return unReadData.length
        });

    }

    //Get user list based on role
    async getUserData() {
        let userData = [];
        var thisRef = this;
        await db.collection('users').onSnapshot(snapshot => {
            userData = [];
            snapshot.docChanges().forEach(function (change) {
                const item = change.doc.data();
                item.key = change.doc.id;
                userData.push(item);           
            });


            userData.forEach(item => {               
                item.unReadMsgCount = this.userWiseNotificationCount1(item).data;
              
            });

            // Uncomment after unRead message count
            const roleWiseUserList = userData.filter(element => {
                if (localStorage.getItem("role") === "Developer") {
                    return element.role !== localStorage.getItem("role")
                }
                else {
                    return element;
                }
            }
            );
            debugger;
            this.allUserListData = userData;
            this.setState({ userList: roleWiseUserList });
        });

        // snapshot = await db.collection('users').onSnapshot();
        // snapshot.docChanges().forEach(doc => {
        //     const item = doc.data();
        //     item.key = doc.id;
        //     userData.push(item);
        // });
        // const roleWiseUserList = userData.filter(element => {
        //     if (localStorage.getItem("role") === "Developer") {
        //         return element.role !== localStorage.getItem("role")
        //     }
        //     else {
        //         return element;
        //     }
        // }
        // );
        // this.allUserListData = userData;
        // this.setState({ userList: roleWiseUserList });
    }

    //Get all group list data
    async getGroupData() {
        let groupData = [];
        this.setState({ groupList: [] });
        await db.collection('groups').where('members', 'array-contains', localStorage.getItem("userId")).onSnapshot(snapshot => {
            groupData = [];
            snapshot.docChanges().forEach(function (change) {
                const item = change.doc.data();
                item.key = change.doc.id;
                groupData.push(item);
            });
            this.setState({ groupList: groupData });
        });
    }

    hashString = str => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash += Math.pow(str.charCodeAt(i) * 31, str.length - i)
            hash = hash & hash // Convert to 32bit integer
        }
        return hash
    }

    //Get Message by group
    async getMessageListData(data, type) {

        if (this.removeListener) {
            this.removeListener()
        }

        this.setState({ messageList: [] });
        let messagesData = [];
        var thisRef = this;
        if (type === "group") {
            messagesData = [];
            this.removeListener = await db.collection("groups").doc(data.key).collection("messages")
                .onSnapshot(snapshot => {
                    snapshot.docChanges().forEach(function (change) {
                        const item = change.doc.data();
                        item.key = change.doc.id
                        // messagesData.push(item);
                        if (thisRef.loginUserName !== item.from) {
                            ///add string in SeenBy Array
                            thisRef.addSeenByGroupChange(data.key, change.doc.id, thisRef.loginUserName);
                        }
                        if (messagesData.length > 0 && change.type == "modified") {
                            let msg = messagesData.filter(data =>
                                data.key == item.key
                            );
                            if (msg.length > 0) {
                                msg[0].isSeenBy = item.isSeenBy;
                            }
                            else {
                                messagesData.push(item);
                            }
                        }
                        else {
                            messagesData.push(item);
                        }

                    });
                    this.setState({ messageList: messagesData });
                });
        }
        else {

            if (
                this.hashString(this.loginUserId) <= this.hashString(data.key)
            ) {
                this.chatId = `${this.loginUserId}-${data.key}`
            } else {
                this.chatId = `${data.key}-${this.loginUserId}`
            }
            // messagesData = [];
            // this.setState({ messageList: [] })
            this.removeListener = await db.collection("chats").doc(this.chatId).collection("messages")
                .onSnapshot(snapshot => {
                    snapshot.docChanges().forEach(function (change) {
                        const item = change.doc.data();
                        item.key = change.doc.id
                        if (thisRef.loginUserName !== item.from) {
                            ///add string in SeenBy Array
                            thisRef.addSeenByChangeChat(thisRef.chatId, change.doc.id, thisRef.loginUserName);
                        }
                        if (messagesData.length > 0 && change.type == "modified") {
                            let msg = messagesData.filter(data =>
                                data.key == item.key
                            );
                            if (msg.length > 0) {
                                msg[0].isSeenBy = item.isSeenBy;
                            }
                            else {
                                messagesData.push(item);
                            }
                        }
                        else {
                            messagesData.push(item);
                        }
                        // Check condidition b'use of after addSeenBy,duplicate data dispaly last inserted
                        // if (change.type != "modified") {

                        // messagesData.push(item);
                        // }
                    });
                    thisRef.setState({ messageList: messagesData });
                });
        }
    }

    async addSeenByChangeChat(chatId, documentId, loginUserName) {
        await db.collection("chats").doc(chatId).collection("messages").doc(documentId).update({
            isSeenBy: firebase.firestore.FieldValue.arrayUnion(...[loginUserName])
        })
    }

    async addSeenByGroupChange(groupId, documentId, loginUserName) {
        await db.collection("groups").doc(groupId).collection("messages").doc(documentId).update({
            isSeenBy: firebase.firestore.FieldValue.arrayUnion(...[loginUserName])
        })
    }





    // Send Message click
    sendMessageClick = (chatType) => {
        const timestamp = moment()
            .valueOf()
            .toString()
        const data = {
            from: this.loginUserName,
            msg: this.state.inputValue,
            time: timestamp,
            isSeenBy: []
        };

        if (chatType === "group") {
            // adding data here
            db.collection("groups")
                .doc(this.state.selectedItem.key).collection("messages").doc(new Date().getTime().toString())
                .set(data)
                .then((ref) => {
                    console.log(ref);
                    this.setState({ inputValue: '' })
                })
                .catch(error => {
                    this.setState({ inputValue: '' })
                });
        } else {
            data.to = this.state.selectedItem.name;
            // adding data here
            db.collection("chats")
                .doc(this.chatId).collection("messages").doc(new Date().getTime().toString())
                .set(data)
                .then((ref) => {
                    console.log(ref);
                    this.setState({ inputValue: '' })
                })
                .catch(error => {
                    this.setState({ inputValue: '' })
                });
        }
    }

    isLastMessageLeft(index) {
        if (
            (index + 1 < this.state.messageList.length &&
                this.state.messageList[index + 1].from === this.loginUserName) ||
            index === this.state.messageList.length - 1
        ) {
            return true
        } else {
            return false
        }
    }

    isLastMessageRight(index) {
        if (
            (index + 1 < this.state.messageList.length &&
                this.state.messageList[index + 1].from !== this.loginUserName) ||
            index === this.state.messageList.length - 1
        ) {
            return true
        } else {
            return false
        }
    }

    onKeyboardPress = event => {
        if (event.key === 'Enter') {
            this.sendMessageClick(this.state.chatType);
        }
    }

    scrollToBottom = () => {
        if (this.messagesEnd) {
            this.messagesEnd.scrollIntoView({})
        }
    }

    async userWiseNotificationCount(data) {
        debugger;
        if (
            this.hashString(this.loginUserId) <= this.hashString(data.key)
        ) {
            this.chatId = `${this.loginUserId}-${data.key}`
        } else {
            this.chatId = `${data.key}-${this.loginUserId}`
        }
        let unReadData = [];
        db.collection("chats").doc(this.chatId).collection("messages").where('from', '!=', this.loginUserName).onSnapshot(snapshot => {
            debugger;
            unReadData = [];
            snapshot.docChanges().forEach(function (change) {
                debugger;
                const item = change.doc.data();
                item.key = change.doc.id;
                unReadData.push(item);
            });
            debugger;
            return unReadData.length
        });
        debugger;


        //    return 10;
    }


    // Group list render Ui call
    renderListGroup = () => {
        if (this.state.groupList.length > 0) {
            let viewListGroup = []
            this.state.groupList.forEach((item, index) => {
                viewListGroup.push(<>
                    <button
                        key={index}
                        className={
                            this.state.selectedItem &&
                                this.state.selectedItem.key === item.key
                                ? 'viewWrapItemFocused'
                                : 'viewWrapItem'
                        }
                        onClick={() => this.selectedGroupClick(item, 'group')}
                    >
                        <img
                            className="viewAvatarItem"
                            src={process.env.PUBLIC_URL + '/logo192.png'}
                            alt="icon avatar"
                        />
                        <div className="viewWrapContentItem">
                            <span className="textItem textHeaderGroupName">{`GroupName: ${item.group_name
                                }`}</span>
                            <span className="textItem">{`GroupNote: ${item.group_description
                                }`}</span>
                        </div>
                    </button>
                </>
                )
            })
            return viewListGroup
        } else {
            return null
        }
    }

    // user list render Ui call
    renderListUser = () => {
        if (this.state.userList.length > 0) {
            let viewListUser = []
            this.state.userList.forEach((item, index) => {

                if (item.key !== this.loginUserId) {
                    viewListUser.push(<>
                        <button
                            key={index}
                            className={
                                this.state.selectedItem &&
                                    this.state.selectedItem.key === item.key
                                    ? 'viewWrapItemFocused'
                                    : 'viewWrapItem'
                            }
                            onClick={() => this.selectedGroupClick(item, "single")}
                        >
                            <img
                                className="viewAvatarItem"
                                src={process.env.PUBLIC_URL + '/logo192.png'}
                                alt="icon avatar"
                            />
                            <div className="viewWrapContentItem">
                                <span className="textItem textHeaderGroupName">{`NickName: ${item.displayName
                                    }`}</span>
                                <span className="textItem">
                                    {
                                        item.aboutMe
                                            ? <span className="textItem">{`About Me: ${item.aboutMe
                                                }`}</span>
                                            : null
                                    }
                                </span>
                                <FaBell></FaBell>
                                CountUnRead: {item.unReadMsgCount}
                                {/* {() => this.userWiseNotificationCount(item)} */}
                                {/* {this.userWiseNotificationCount(item)} */}

                                {/* <span className="textItem">{`About Me: ${item.aboutMe
                            }`}</span> */}
                            </div>
                        </button>
                    </>
                    )
                }
            })
            return viewListUser
        } else {
            return null
        }
    }

    // message list render Ui call
    renderListMessage = () => {
        if (this.state.messageList.length > 0) {
            let viewListMessage = []
            this.state.messageList.forEach((item, index) => {
                if (item.from === this.loginUserName) {
                    // Item right (my message)

                    viewListMessage.push(<>

                        {item.isSeenBy && this.state.selectedItem.members && this.state.chatType === "group" ? (
                            <Dropdown  >
                                <Dropdown.Toggle disabled={item.isSeenBy.length == 0}>
                                    Read By {item.isSeenBy && item.isSeenBy.length} of {this.state.selectedItem.members.length - 1}
                                </Dropdown.Toggle>
                                <Dropdown.Menu size="sm">
                                    {item.isSeenBy.map((item) =>
                                        (
                                            <Dropdown.Item >
                                                {item}
                                            </Dropdown.Item>
                                        )
                                    )
                                    }
                                </Dropdown.Menu>
                            </Dropdown>) : (null)
                        }



                        {item.isSeenBy && this.state.selectedItem.members && item.isSeenBy.length == (this.state.selectedItem.members.length - 1) && this.state.chatType === "group" ? (
                            <div className="viewItemRightEye"><FaEye /></div>) : (null)
                        }
                        { item.isSeenBy && item.isSeenBy.length > 0 && this.state.chatType === "single" ? (
                            <div className="viewItemRightEye"><FaEye /></div>) : (null)
                        }


                        {/* {item.isSeenBy && item.isSeenBy.length > 0 ? (
                            <div className="viewItemRightEye"><FaEye /></div>) : (null)
                        } */}
                        <div className="viewItemRight" >
                            <span className="textContentItem">{item.msg}</span>
                        </div>

                        <span className="textTimeRight">
                            {moment(Number(item.time)).format('ll')}
                        </span>

                    </>
                    )

                } else {
                    // Item left (peer message)

                    viewListMessage.push(
                        <div className="viewWrapItemLeft" >
                            <div className="viewWrapItemLeft3">
                                {this.isLastMessageLeft(index) ? (
                                    <img
                                        src={process.env.PUBLIC_URL + '/logo192.png'}
                                        alt="avatar"
                                        className="peerAvatarLeft"
                                    />
                                ) : (
                                        <div className="viewPaddingLeft" />
                                    )}
                                <div className="viewItemLeft">
                                    <small className="userNameMessage">{item.from}</small><br></br>
                                    <span className="textContentItem">{item.msg}</span>
                                </div>
                            </div>
                            {this.isLastMessageLeft(index) ? (
                                <span className="textTimeLeft">
                                    {moment(Number(item.time)).format('ll')}
                                </span>
                            ) : null}
                        </div>
                    )

                }
            })
            return viewListMessage
        } else {
            return (
                <div className="viewWrapSayHi">
                    <span className="textSayHi">Say hi to new friend</span>
                    <img
                        className="imgWaveHand"
                        src={process.env.PUBLIC_URL + '/ic_wave_hand.png'}
                        alt="wave hand"
                    />
                </div>
            )
        }
    }


    onChangeHandler = (event) => {
        let nam = event.target.name;
        let val = event.target.value;
        this.setState({ [nam]: val });
    }

    //add group click
    groupCreateClick = () => {
        let groupMember = this.state.members;
        groupMember.push(this.loginUserId);
        if (this.state.group_name === '' || this.state.group_name === undefined) {
            toast.error("Please Enter GroupName!", { transition: Flip, autoClose: 3000 });
            return;
        }
        const data = {
            group_name: this.state.group_name,
            group_description: this.state.group_description,
            members: groupMember
        };
        db.collection("groups")
            .doc(new Date().getTime().toString())
            .set(data)
            .then((ref) => {
                toast.success("Group added successfully!", { transition: Flip, autoClose: 3000 });
                this.setState({ groupAddShowModel: false, group_name: '', group_description: '', members: [], checkedItems: [] });
            })
            .catch(error => {
                toast.error(error, { transition: Flip, autoClose: 3000 });
            });
    }

    groupAddShowModelClick = () => {
        this.setState({ groupAddShowModel: true });
    };

    groupAddHideModelClick = () => {
        this.setState({ groupAddShowModel: false, checkedItems: [] });
    };

    participantShowModelClick = () => {
        const groupsMember = this.allUserListData.filter(element => this.state.selectedItem.members.includes(element.key));
        this.groupMemberList = groupsMember;
        this.setState({ participantShowModel: true });
    };

    participantHideModelClick = () => {
        this.setState({ participantShowModel: false, checkedItems: [] });
    };

    addMemberShowModelClick = () => {
        this.setState({ addMemberShowModel: true });
    };

    addMemberHideModelClick = () => {
        this.setState({ addMemberShowModel: false, checkedItems: [] });
    };

    addMemberClick = () => {
        const remainingGroupsMember = this.state.userList.filter(element => !this.state.selectedItem.members.includes(element.key));
        this.remainingGroupMemberList = remainingGroupsMember;
        this.setState({ participantShowModel: false, addMemberShowModel: true });
    };

    saveMemberClick = () => {
        if (this.state.checkedItems.length === 0) {
            toast.error("Please select member!", { transition: Flip, autoClose: 3000 });
            return;
        }
        var addMembers = db.collection("groups").doc(this.state.selectedItem.key);
        addMembers.update({
            members: firebase.firestore.FieldValue.arrayUnion(...this.state.checkedItems)
        }).then((ref) => {
            toast.success("Member added successfully!", { transition: Flip, autoClose: 3000 });
            this.state.checkedItems.forEach((item, index) => {
                this.state.selectedItem.members.push(item);
            }
            )
            this.setState({ addMemberShowModel: false, checkedItems: [] });
        })
            .catch(error => {
                toast.error(error, { transition: Flip, autoClose: 3000 });
            });
    };

    removeMemberFromGroupClick = (data) => {
        var romoveMembers = db.collection("groups").doc(this.state.selectedItem.key);
        romoveMembers.update({
            members: firebase.firestore.FieldValue.arrayRemove(...[data.key])
        }).then((ref) => {
            toast.success("Member remove successfully!", { transition: Flip, autoClose: 3000 });
            let valueIndex = this.state.selectedItem.members.indexOf(data.key);
            this.state.selectedItem.members.splice(valueIndex, 1);
            this.setState({ participantShowModel: false, checkedItems: [] });
        })
            .catch(error => {
                toast.error(error, { transition: Flip, autoClose: 3000 });
            });
    }

    render() {
        return (
            <>
                <div className="root">
                    {/* Header */}
                    <div className="header">
                        <span>Radix-Chat  {this.loginUserName}</span>
                        <img
                            className="icLogout"
                            alt="An icon logout"

                            src={process.env.PUBLIC_URL + '/ic_logout.png'}
                            onClick={this.logoutButtonClick}
                        />
                    </div>

                    {/* Body */}
                    <div className="body">
                        {/* <img
                        className="icProfile"
                        alt="An icon default avatar"
                        src={process.env.PUBLIC_URL + '/add.webp'}
                        onClick={() => this.addGroupClick()}
                    /> */}
                        <div className="viewListUser">

                            {this.renderListGroup()}

                            {this.renderListUser()}
                        </div>
                        <div className="viewBoard">

                            <div className="viewChatBoard">
                                {this.state.selectedItem ? (
                                    <>
                                        <div className="headerChatBoard">
                                            <img
                                                className="viewAvatarItem"
                                                src={process.env.PUBLIC_URL + '/logo192.png'}
                                                alt="icon avatar"
                                            />
                                            <span className="textHeaderChatBoard">
                                                {this.state.selectedItem.name}
                                            </span>
                                            {this.loginUserRole !== "Developer" ? (<div >
                                                <button className="btn btn-primary pull-right" onClick={this.groupAddShowModelClick}>
                                                    Create Group</button>
                                            </div>)
                                                : null}
                                            {this.state.chatType === "group" ? (<div >
                                                <Button variant="primary" onClick={this.participantShowModelClick}>
                                                    Participants : {(this.state.selectedItem.members.length)}
                                                </Button>
                                            </div>)
                                                : null}
                                        </div>
                                        <div className="viewListContentChat">
                                            {this.renderListMessage()}
                                            <div
                                                style={{ float: 'left', clear: 'both' }}
                                                ref={el => {
                                                    this.messagesEnd = el
                                                }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                        <div className="viewWelcomeBoard">
                                            <span className="textTitleWelcome"> {`Welcome, ${this.loginUserName
                                                }`} </span>
                                            <img
                                                className="avatarWelcome"
                                                src={process.env.PUBLIC_URL + '/logo192.png'}
                                                alt="icon avatar"
                                            />
                                            <span className="textDesciptionWelcome">
                                                Let's start talking. Great things might happen.
                            </span>
                                        </div>
                                    )}
                                {/* View bottom */}
                                {this.state.selectedItem ? (
                                    <div className="viewBottom">
                                        <input
                                            className="viewInput"
                                            placeholder="Type your message..."
                                            value={this.state.inputValue}
                                            onChange={event => {
                                                this.setState({ inputValue: event.target.value })
                                            }}
                                            onKeyPress={this.onKeyboardPress}
                                        />
                                        {/* <button class="ui icon button"><i  class="search icon"></i></button> */}
                                        <img
                                            className="icSend"
                                            src={process.env.PUBLIC_URL + '/logo192.png'}
                                            alt="icon send"
                                            onClick={() => this.sendMessageClick(this.state.chatType)}
                                        />
                                    </div>
                                ) : (<div></div>)}
                            </div>
                        </div>

                    </div>
                </div>


                {/* group add model */}
                <Modal show={this.state.groupAddShowModel} onHide={this.groupAddHideModelClick} backdrop="static" size="md" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Add Group</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="form-group">
                            <label>Name : </label>
                            <input type="text" id="group_name" className="form-control"
                                placeholder="Group Name" required=""
                                name="group_name"
                                onChange={this.onChangeHandler}

                                value={this.state.group_name} />
                        </div>
                        <div className="form-group">
                            <label>Description : </label>
                            <input type="text" id="group_description" className="form-control"
                                placeholder="Group Description" required=""
                                name="group_description"
                                onChange={this.onChangeHandler}
                                value={this.state.group_description} />
                        </div>
                        <div className="form-group">
                            <label>Add Group Member : </label>

                            <ListGroup className="addMemberList">
                                {
                                    this.state.userList.map((item) => (
                                        item.key !== this.loginUserId ? (
                                            <ListGroup.Item> <input
                                                type="checkbox"
                                                value={item.key}
                                                onChange={this.changeEvent}
                                            />  {item.displayName}
                                            </ListGroup.Item>
                                        ) : null
                                    ))
                                }
                            </ListGroup>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={this.groupAddHideModelClick}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={this.groupCreateClick}>
                            Add
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* participant model */}
                <Modal show={this.state.participantShowModel} onHide={this.participantHideModelClick} backdrop="static" size="md" centered>
                    <Modal.Header closeButton>
                        <Modal.Title> Members List</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ListGroup className="addMemberList">
                            {
                                this.groupMemberList.map(item => (
                                    <ListGroup.Item>
                                        <Row>
                                            <Col sm={9}>{item.displayName}</Col>
                                            {this.loginUserRole !== "Developer" && item.key !== this.loginUserId ? (<Col sm={3}><Button size="sm" className="pull-right" variant="danger"
                                                onClick={() => this.removeMemberFromGroupClick(item)}>Remove</Button></Col>
                                            )
                                                : null}
                                        </Row>
                                    </ListGroup.Item>
                                ))
                            }
                        </ListGroup>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={this.participantHideModelClick}>
                            Close
                        </Button>
                        {this.loginUserRole !== "Developer" ? (
                            <Button variant="primary" onClick={this.addMemberClick}>
                                Add Member
                            </Button>
                        )
                            : null}
                    </Modal.Footer>
                </Modal>


                {/* add member model */}
                <Modal show={this.state.addMemberShowModel} onHide={this.addMemberHideModelClick} backdrop="static" size="sm" centered>
                    <Modal.Header closeButton>
                        <Modal.Title> Add Member</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ListGroup className="addMemberList">
                            {this.remainingGroupMemberList.length > 0 ?
                                this.remainingGroupMemberList.map(item => (

                                    <ListGroup.Item> <input
                                        type="checkbox"
                                        value={item.key}
                                        onChange={this.changeEvent}
                                    />  {item.displayName}
                                    </ListGroup.Item>
                                ))
                                : <ListGroup.Item variant="info">
                                    All users are already added!
                                </ListGroup.Item>
                            }
                        </ListGroup>

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={this.addMemberHideModelClick}>
                            Close
                        </Button>
                        {this.remainingGroupMemberList.length > 0 ?
                            <Button variant="primary" onClick={this.saveMemberClick}>
                                Add
                        </Button> : null}


                    </Modal.Footer>
                </Modal>

                <ToastContainer />
            </>
        );
    }

}

export default Room;