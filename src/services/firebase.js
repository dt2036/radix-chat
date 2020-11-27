import firebase from 'firebase';
const settings = { timestampsInSnapshots: true };

const config = {
    projectId: 'radixchat-6807',
    apiKey: "AIzaSyCN23cutMogZmCKllRx4iZk-xA8jLI3-PU",
    authDomain: "radixchat-6807.firebaseapp.com",
    databaseURL: "https://radixchat-6807.firebaseio.com"
};

firebase.initializeApp(config);
firebase.firestore().settings(settings);

export const auth = firebase;
export const db = firebase.firestore();