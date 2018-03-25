/* global google */
/* global jQuery */
/* global _ */

(function(KAS, $, navigator, firebase) {
  "use strict";

  KAS.MapDataService = function(notifier, firebaseSrvc, mapEl) {
    this.notifier = notifier
    this.firebaseSrvc = firebaseSrvc
    this.mapEl = mapEl
  }

  KAS.MapDataService.prototype.init = function(map, currentGridSize, defaultLat, defaultLon) {
    this.map = map
    this.currentGridSize = currentGridSize
    this.defaultLat = defaultLat
    this.defaultLon = this.defaultLon

    this.db = firebase.firestore()

    this.tileCollections = []
    this.tileCollections = this.db.collection('tile-clicks')

    this.tileCollections.onSnapshot((querySnapshot) => {
      var tiles = [];
      querySnapshot.forEach((doc) => {
        tiles.push(doc.data())
        this.toggleSquare(doc.data().lat, doc.data().lon)
      });
      console.log('Current tiles:', tiles)
    });
  }

  KAS.MapDataService.prototype.toggleSquare = function(lat, lon) {
    let topLat = Math.round((lat + (this.currentGridSize / 2)) / this.currentGridSize) * this.currentGridSize
    var rightLon = Math.ceil(lon / this.currentGridSize) * this.currentGridSize;

    var bottomLat = topLat - this.currentGridSize
    var leftLon = rightLon - this.currentGridSize

    let offset = this.currentGridSize * .075
    new google.maps.Polygon({
      paths: [
        new google.maps.LatLng(topLat - offset, rightLon - offset),
        new google.maps.LatLng(bottomLat + offset, rightLon - offset),
        new google.maps.LatLng(bottomLat + offset, leftLon + offset),
        new google.maps.LatLng(topLat - offset, leftLon + offset)
      ],
      clickable: true,
      map: this.map,
      geodesic: true,
      fillColor: '#00FF00',
      strokeColor: '#00FF00',
      strokeOpacity: .5,
      strokeWeight: 2
    })
  }


  KAS.MapDataService.prototype.onClick = function(lat, lon) {
    console.log('onClick', lat, lon)
    this.firebaseSrvc.db.collection("tile-clicks").add({
        lat: lat,
        lon: lon,
        location: new firebase.firestore.GeoPoint(lat, lon)
      })
      .then(function(docRef) {
        console.log("Document written with ID: ", docRef.id);
      })
      .catch(function(error) {
        console.error("Error adding document: ", error);
      });
  }

}(window.KAS = window.KAS || {}, jQuery, window.navigator, window.firebase));
