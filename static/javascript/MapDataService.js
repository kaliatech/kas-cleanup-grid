/* global google */
/* global jQuery */
/* global _ */

(function (KAS, $, navigator, firebase) {
  "use strict";

  KAS.MapDataService = function (notifier, firebaseSrvc, mapEl) {
    this.notifier = notifier
    this.firebaseSrvc = firebaseSrvc
    this.mapEl = mapEl

    this.cleanBtn = document.getElementsByClassName('clean-btn')[0]
    this.trashBtn = document.getElementsByClassName('trash-btn')[0]
    this.clearBtn = document.getElementsByClassName('clear-btn')[0]
    this.currMode = null

    this.tiles = {} // db
    this.squares = [] // polygons on google map

    this.cleanBtn.addEventListener('click', (evt) => {
      if (this.currMode == 'clean') {
        return
      }

      this.cleanBtn.classList.remove('btn-outline-success')
      this.cleanBtn.classList.add('btn-success')

      this.trashBtn.classList.add('btn-outline-danger')
      this.trashBtn.classList.remove('btn-danger')

      this.clearBtn.classList.add('btn-outline-light')
      this.clearBtn.classList.remove('btn-light')

      this.currMode = 'clean'
      this.notifier.hide()
    })


    this.trashBtn.addEventListener('click', (evt) => {
      if (this.currMode == 'trash') {
        return
      }

      this.cleanBtn.classList.add('btn-outline-success')
      this.cleanBtn.classList.remove('btn-success')

      this.trashBtn.classList.remove('btn-outline-danger')
      this.trashBtn.classList.add('btn-danger')

      this.clearBtn.classList.add('btn-outline-light')
      this.clearBtn.classList.remove('btn-light')

      this.currMode = 'trash'
      this.notifier.hide()
    })

    this.clearBtn.addEventListener('click', (evt) => {
      if (this.currMode == 'clear') {
        return
      }

      this.cleanBtn.classList.add('btn-outline-success')
      this.cleanBtn.classList.remove('btn-success')

      this.trashBtn.classList.add('btn-outline-danger')
      this.trashBtn.classList.remove('btn-danger')

      this.clearBtn.classList.remove('btn-outline-light')
      this.clearBtn.classList.add('btn-light')

      this.currMode = 'clear'
      this.notifier.hide()
    })
  }

  KAS.MapDataService.prototype.init = function (map, currentGridSize, defaultLat, defaultLon) {
    this.map = map
    this.currentGridSize = currentGridSize
    this.defaultLat = defaultLat
    this.defaultLon = defaultLon

    this.db = firebase.firestore()

    this.tileCollections = []
    this.tileCollections = this.db.collection('tile-clicks')

    this.tileCollections.onSnapshot((querySnapshot) => {

      querySnapshot.docChanges.forEach((change) => {

        const data = change.doc.data()
        const tileKey = this.toFixed(data.lat, 5) + '-' + this.toFixed(data.lon, 5)

        if (change.type === "added") {
          const tile = change.doc.data()
          this.tiles[tileKey] = {
            'dbDoc': change.doc,
            'dbData': change.doc.data(),
            'drawnPoly': this.drawSquare(tile.lat, tile.lon, tile.mode)
          }
        }
        else if (change.type === "modified") {
          const tileToModify = this.tiles[tileKey]
          tileToModify.dbDoc = change.doc
          tileToModify.dbData = change.doc.data()
          google.maps.event.clearListeners(tileToModify.drawnPoly)
          tileToModify.drawnPoly.setMap(null)
          tileToModify.drawnPoly = this.drawSquare(tileToModify.dbData.lat, tileToModify.dbData.lon, tileToModify.dbData.mode)
        }
        else if (change.type === "removed") {
          const tileToDelete = this.tiles[tileKey]
          if (tileToDelete) {
            google.maps.event.clearListeners(tileToDelete.drawnPoly)
            tileToDelete.drawnPoly.setMap(null)
            delete this.tiles[tileKey]
          }
        }
      });


      // querySnapshot.forEach((doc) => {
      //   const tile = doc.data()
      //
      //   const existingTile = this.getExistingTile(tile.lat, tile.lon)
      //   if (!existingTile) {
      //     this.tiles.push(tile)
      //     this.drawSquare(tile.lat, tile.lon, tile.mode)
      //   }
      //   else {
      //     // Changing existing tile
      //     //TODO:
      //     if (tile.code !== existingTile.mode) {
      //       // this.clearSquare(doc.ref)
      //       // this.
      //     }
      //   }
      //
      //
      // });
      //console.log('Current tiles:', tiles)
    });
  }
  KAS.MapDataService.prototype.clearSquare = function (tileDoc) {
    // Clear from firebase db
    console.log('delete tile', tileDoc)
    tileDoc.delete()
  }

  KAS.MapDataService.prototype.drawSquare = function (lat, lon, mode) {

    const tileCoords = this.getTileCoords(lat, lon)
    const topLat = tileCoords.topLat
    const rightLon = tileCoords.rightLon
    const bottomLat = tileCoords.bottomLat
    const leftLon = tileCoords.leftLon

    let fillColor = '#CCCCCC'
    let strokeColor = '#CCCCCC'
    if (mode == 'clean') {
      fillColor = '#00FF00'
      strokeColor = '#00FF00'
    }
    else if (mode == 'trash') {
      fillColor = '#FF0000'
      strokeColor = '#FF0000'
    }

    let offset = this.currentGridSize * .075
    let square = new google.maps.Polygon({
      paths: [
        new google.maps.LatLng(topLat - offset, rightLon - offset),
        new google.maps.LatLng(bottomLat + offset, rightLon - offset),
        new google.maps.LatLng(bottomLat + offset, leftLon + offset),
        new google.maps.LatLng(topLat - offset, leftLon + offset)
      ],
      clickable: true,
      map: this.map,
      geodesic: true,
      fillColor: fillColor,
      strokeColor: strokeColor,
      strokeOpacity: .5,
      strokeWeight: 2
    })
    square.addListener('click', (evt) => {
      //if (this.currMode === 'clear') {
      this.onClick(evt.latLng.lat(), evt.latLng.lng())
      // const existingTile = this.getExistingTile(lat, lon)
      // console.log('delete', existingTile)
      // existingTile.delete()
      // square.setMap(null)
      //}
    })
    return square
  }


  KAS.MapDataService.prototype.onClick = function (clickLat, clickLon) {
    //console.log('onClick', lat, lon)
    if (!this.firebaseSrvc.getCurrentUser()) {
      this.notifier.show({txt: 'Sign in before updating the map'})
      return
    }

    if (!this.currMode) {
      this.notifier.show({txt: 'Select "Clean" or "Trash"'})
      return
    }

    const tileCoords = this.getTileCoords(clickLat, clickLon)
    const topLat = tileCoords.topLat
    const leftLon = tileCoords.leftLon
    const tileKey = this.toFixed(topLat, 5) + '-' + this.toFixed(leftLon, 5)
    const existingTile = this.tiles[tileKey]

    if (existingTile) {
      if (this.currMode === 'clear') {
        existingTile.dbDoc.ref.delete()
      }
      else if (this.currMode !== existingTile.dbData.mode) {
        existingTile.dbDoc.ref.update({mode: this.currMode})
      }
    }
    else if (this.currMode !== 'clear') {
      this.firebaseSrvc.db.collection("tile-clicks").add({
        lat: topLat,
        lon: leftLon,
        location: new firebase.firestore.GeoPoint(topLat, leftLon),
        mode: this.currMode,
        ts: new Date()
      })
        .then(function (docRef) {
          // console.log("Document written with ID: ", docRef.id);
        })
        .catch(function (error) {
          console.error("Error adding document: ", error);
        });
    }
    else {
      // console.log('click', clickLat, clickLon)
      // console.log('rounded', topLat, leftLon)
    }
  }

  // Browser impl of toFixed is not reliable: https://stackoverflow.com/questions/10015027/javascript-tofixed-not-rounding
  KAS.MapDataService.prototype.toFixed = function (num, precision) {
    return (+(Math.round(+(num + 'e' + precision)) + 'e' + -precision)).toFixed(precision);
  }

  KAS.MapDataService.prototype.getTileCoords = function (lat, lon) {
    lat = this.toFixed(lat, 5)
    lon = this.toFixed(lon, 5)
    const topLat = Math.ceil((lat / this.currentGridSize)) * this.currentGridSize
    const leftLon = Math.floor((lon / this.currentGridSize)) * this.currentGridSize

    const bottomLat = topLat - this.currentGridSize
    const rightLon = leftLon + this.currentGridSize
    return {topLat, rightLon, bottomLat, leftLon}
  }

  // No longer needed when storing rounded tile coords only:
  /*
    KAS.MapDataService.prototype.getExistingTile = function (lat, lon) {
      Object.entries(this.tiles).forEach(([tileKey, tile]) => {
        if (this.tileContains(tile.dbData, lat, lon)) {
          return tile
        }
      })
    }

    KAS.MapDataService.prototype.tileContains = function (tileDbData, lat, lon) {
      const tileCoords = this.getTileCoords(tileDbData.lat, tileDbData.lon)
      let sameLon = (lon >= tileCoords.leftLon && lon <= tileCoords.rightLon) ? true : false
      let sameLat = (lat >= tileCoords.bottomLat && lat <= tileCoords.topLat) ? true : false
      return (sameLon && sameLat)
    }
  */

}(window.KAS = window.KAS || {}, jQuery, window.navigator, window.firebase));
