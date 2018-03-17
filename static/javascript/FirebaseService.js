/* global firebase */
(function(KAS, navigator, firebase) {
    "use strict";

    KAS.FirebaseService = function() {

          // Initialize Firebase
          var config = {
            apiKey: "AIzaSyAjQk81eQrI34p4wLJy6-aNNHT_TSqUKHc",
            authDomain: "grid-test-001-1520464831743.firebaseapp.com",
            databaseURL: "https://grid-test-001-1520464831743.firebaseio.com",
            projectId: "grid-test-001-1520464831743",
            storageBucket: "grid-test-001-1520464831743.appspot.com",
            messagingSenderId: "522386082920"
          };
          firebase.initializeApp(config);

        // Initialize Cloud Firestore through Firebase
        this.db = firebase.firestore();
    }

}(window.KAS = window.KAS || {}, window.navigator, firebase));
