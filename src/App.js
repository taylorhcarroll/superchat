import logo from './logo.svg';
import './App.css';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks';
import { dblClick } from '@testing-library/user-event/dist/click';

//probably don't have to be this paranoid with firebase but hey, never hurts to be extra safe
const config = require('./config.json');

firebase.initializeApp({
  //TODO: place config here
  apiKey: config.firebaseConfigDev.apiKey,
  authDomain: config.firebaseConfigDev.authDomain,
  projectId: config.firebaseConfigDev.projectId,
  storageBucket: config.firebaseConfigDev.storageBucket,
  messagingSenderId: config.firebaseConfigDev.messagingSenderId,
  appId: config.firebaseConfigDev.appId,
  measurementId: config.firebaseConfigDev.measurementId
})

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  return (
    <div className="App">
      <header className="App-header">

      </header>
      <section >
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithGoogle(provider);
  }

  return (
    <button onClick={signInWithGoogle}>Sign in with Google</button>
  )
}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}

function ChatRoom() {

  const dummy = useRef();
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt').limit(25);
  //listens to data with hook, reacts to changes in realtime
  const [messages] = useCollectionData(query, { idField: 'id' });

  //stateful value for the form component, default value is empty string
  const [formValue, setFormValue] = useState('')

  const sendMessage = async (e) => {
    //prevents submit from refreshing page
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    //creates new document in firestore, note this is not a relational db, it's document based
    //takes js object as argument, with values you want to write to db
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    })

    //after submission, clears out the input field for user
    setFormValue('');
  }

  return (<>
    <main>

      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}

    </main>
    {/* writes value to firestore */}
    <form onSubmit={sendMessage}>

      {/* listens to the event anytime the value of input field changes, binds state to form input */}
      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="say hello!" />

      <button type="submit" disabled={!formValue}>🕊️</button>

    </form>
  </>)
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;

  //conditional CSS
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL} />
      <p>{text}</p>
    </div>
  )
}
export default App;
