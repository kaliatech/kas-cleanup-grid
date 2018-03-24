/* global firebase, firebaseui */
(function(KAS, navigator, firebase, firebaseui) {
  "use strict";
  KAS.FirebaseAuth = function(baseUrl) {

    this.authCheckingEls = document.getElementsByClassName('auth-checking')
    this.authOutEls = document.getElementsByClassName('auth-signedout')
    this.authInEls = document.getElementsByClassName('auth-signedin')
    this.authNameEls = document.getElementsByClassName('auth-signedin-name')

    this.signOutBtns = document.getElementsByClassName('btn-signout')
    Array.prototype.forEach.call(this.signOutBtns, (it) => it.addEventListener('click', (evt) => this.signout(evt)))

    this.signInBtns = document.getElementsByClassName('btn-signin')
    Array.prototype.forEach.call(this.signInBtns, (it) => it.addEventListener('click', (evt) => this.startSignin(evt)))

    // FirebaseUI config.
    this.uiConfig = {
      //signInSuccessUrl: 'https://',
      signInSuccessUrl: baseUrl,
      signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        // firebase.auth.GithubAuthProvider.PROVIDER_ID,
        // firebase.auth.EmailAuthProvider.PROVIDER_ID,
        //firebase.auth.PhoneAuthProvider.PROVIDER_ID
      ],
      // Terms of service url.
      tosUrl: baseUrl + "/about"
    };

    firebase.auth().onAuthStateChanged((user) => this._onAuthStateChanged(user))

    // Initialize the FirebaseUI Widget using Firebase.
    this.ui = new firebaseui.auth.AuthUI(firebase.auth());
    
    this.pendingRedirect = this.ui.isPendingRedirect()
    console.log('isPendingRedirect', this.pendingRedirect)

    if (this.ui.isPendingRedirect()) {
      this.ui.start('#firebaseui-auth-container', this.uiConfig)
    }

    //console.log('currentUser', firebase.auth().currentUser)

  }

  KAS.FirebaseAuth.prototype.isPendingRedirect = function () {
    return this.pendingRedirect
  }

  KAS.FirebaseAuth.prototype.checkLogin = function() {
    console.log('checkLogin')
    return new Promise((resolve, reject) => {
      resolve(true);
    })
  }

  KAS.FirebaseAuth.prototype.startSignin = function() {
    console.log('startSignin')
    this.ui.start('#firebaseui-auth-container', this.uiConfig)
  }

  KAS.FirebaseAuth.prototype.signout = function() {
    firebase.auth().signOut().then(() => {})
      .catch((error) => {
        console.log('unable to logout. Message:' + error.message)
      })

  }

  KAS.FirebaseAuth.prototype._onAuthStateChanged = function(user) {
    console.log('_onAuthStateChanged', user)
    console.log('pendingRedirect', this.pendingRedirect)
    if (user) {
      // User is signed in.
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var uid = user.uid;
      var phoneNumber = user.phoneNumber;
      var providerData = user.providerData;
      user.getIdToken().then((accessToken) => {
          // document.getElementById('sign-in-status').textContent = 'Signed in';
          // document.getElementById('sign-in').textContent = 'Sign out';
          // document.getElementById('account-details').textContent = JSON.stringify({
          //   displayName: displayName,
          //   email: email,
          //   emailVerified: emailVerified,
          //   phoneNumber: phoneNumber,
          //   photoURL: photoURL,
          //   uid: uid,
          //   accessToken: accessToken,
          //   providerData: providerData
          // }, null, '  ');
          console.log('user:', displayName)

          Array.prototype.forEach.call(this.authInEls, (it) => it.style.display = 'block')
          Array.prototype.forEach.call(this.authOutEls, (it) => it.style.display = 'none')
          Array.prototype.forEach.call(this.authCheckingEls, (it) => it.style.display = 'none')
          Array.prototype.forEach.call(this.authNameEls, (it) => {
            it.innerHTML = displayName
            it.style.display = 'block'
          })
        })
        .catch((error) => {
          console.log(error);
        });
    }
    else {
      console.log("user is signed out")

      if (this.pendingRedirect) {
        console.log('pending redirect, so do nothing')
        return
      }
      Array.prototype.forEach.call(this.authInEls, (it) => it.style.display = 'none')
      Array.prototype.forEach.call(this.authOutEls, (it) => it.style.display = 'block')
      Array.prototype.forEach.call(this.authCheckingEls, (it) => it.style.display = 'none')

      // User is signed out.
      // document.getElementById('sign-in-status').textContent = 'Signed out';
      // document.getElementById('sign-in').textContent = 'Sign in';
      // document.getElementById('account-details').textContent = 'null';
    }
  }


}(window.KAS = window.KAS || {}, window.navigator, firebase, firebaseui));
