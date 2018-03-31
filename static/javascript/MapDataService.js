/* global google */
/* global jQuery */
/* global _ */

(function(KAS, $, navigator, firebase) {
  "use strict";

  KAS.MapDataService = function(notifier, firebaseSrvc, mapEl) {
    this.notifier = notifier
    this.firebaseSrvc = firebaseSrvc
    this.mapEl = mapEl

    this.cleanBtn = document.getElementsByClassName('clean-btn')[0]
    this.trashBtn = document.getElementsByClassName('trash-btn')[0]
    this.clearBtn = document.getElementsByClassName('clear-btn')[0]
    this.currMode = null

    this.tiles = []

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

  KAS.MapDataService.prototype.init = function(map, currentGridSize, defaultLat, defaultLon) {
    this.map = map
    this.currentGridSize = currentGridSize
    this.defaultLat = defaultLat
    this.defaultLon = this.defaultLon

    this.db = firebase.firestore()

    this.tileCollections = []
    this.tileCollections = this.db.collection('tile-clicks')

    this.tileCollections.onSnapshot((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const tile = doc.data()

        //TODO: Only draw tiles which are new or changed.
        const existingTile = this.getExistingTile(tile.lat, tile.lon)
        if (!existingTile) {
          this.tiles.push(tile)
          this.drawSquare(tile.lat, tile.lon, tile.mode)
        }
        else {
          //TODO: Clearand redraw only if changed
          if (tile.code !== existingTile.mode) {
            //TODO: how to clear?
            //this.drawSquare(tile.lat, tile.lon, tile.mode)
          }
        }


      });
      //console.log('Current tiles:', tiles)
    });
  }

  KAS.MapDataService.prototype.drawSquare = function(lat, lon, mode) {

    const tileCoords = this.getTileCoords(lat, lon)
    const topLat = tileCoords.topLat
    const rightLon = tileCoords.rightLon
    const bottomLat = tileCoords.bottomLat
    const leftLon = tileCoords.leftLon

    if (!mode) {
      mode = 'trash'
    }

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
      fillColor: fillColor,
      strokeColor: strokeColor,
      strokeOpacity: .5,
      strokeWeight: 2
    })
  }


  KAS.MapDataService.prototype.onClick = function(lat, lon) {
    //console.log('onClick', lat, lon)

    if (!this.currMode) {
      this.notifier.show({ txt: 'Select "Clean" or "Trash"' })
      return
    }

    const existingTile = this.getExistingTile(lat, lon)
    if (existingTile) {
      console.log('todo: tile exists', existingTile)
    }

    this.firebaseSrvc.db.collection("tile-clicks").add({
        lat: lat,
        lon: lon,
        location: new firebase.firestore.GeoPoint(lat, lon),
        mode: this.currMode,
        ts: new Date()
      })
      .then(function(docRef) {
        console.log("Document written with ID: ", docRef.id);
      })
      .catch(function(error) {
        console.error("Error adding document: ", error);
      });
  }

  KAS.MapDataService.prototype.getTileCoords = function(lat, lon) {
    const topLat = Math.round((lat + (this.currentGridSize / 2)) / this.currentGridSize) * this.currentGridSize
    const rightLon = Math.ceil(lon / this.currentGridSize) * this.currentGridSize;

    const bottomLat = topLat - this.currentGridSize
    const leftLon = rightLon - this.currentGridSize
    return { topLat, rightLon, bottomLat, leftLon }
  }

  KAS.MapDataService.prototype.getExistingTile = function(lat, lon) {
    for (let i = 0; i < this.tiles.length; i++) {
      let tile = this.tiles[i]
      if (this.tileContains(tile, lat, lon)) {
        return tile
      }
    }
  }

  KAS.MapDataService.prototype.tileContains = function(tile, lat, lon) {

    //TODO: This doesn't handle border cases crossing merdians, polar, or equator
    const tileCoords = this.getTileCoords(tile.lat, tile.lon)

    let sameLon = (lon >= tileCoords.leftLon && lon <= tileCoords.rightLon) ? true : false
    let sameLat = (lat >= tileCoords.bottomLat && lat <= tileCoords.topLat) ? true : false

    return (sameLon && sameLat)
  }

}(window.KAS = window.KAS || {}, jQuery, window.navigator, window.firebase));
