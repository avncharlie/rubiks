/* global THREE */

/**
 * Rubiks3d.js
 * provides functionality to render and manipulate rubiks cubes in three.js
 *
 * made by Alvin Charles, alvinjoycharles@gmail.com
 */

/*
TODO:
internal repr of face groups (also )
*/
var Rubiks3d = {
  colors: {
    white: 0xffffff,
    green: 0x128d38,
    red: 0xa60027,
    blue: 0x03309c,
    yellow: 0xfecd09,
    orange: 0xfb4007
  }
};

Rubiks3d.Cube = function (scene, cubeSize = 2, cubeString = 'UUUUUUUUUFFFFFFFFFDDDDDDDDDLLLLLLLLLRRRRRRRRRBBBBBBBBB', startingPosition = [0, 0, 0], spacingPercentage = 0, lineWidth = 1, colorMappings = 'default') {
  /**
   * Cube
   * object to visualise and manipulate a rubiks cube in three.js
   *
   * parameters
   *   scene:
   *     three.js scene to render onto
   *   cubeSize (optional):
   *     size of the whole cube in three.js units
   *   cubeString:
   *     a string that represents the faces of the cube. the string is 54 characters long, 9 for each face.
   *     the faces fill in as rows from the top left to the bottom right.
   *     U stands for a face of the up color, D for down, L for left, R for right, F for forward and B for
   *     back. the order of the faces should be: U, F, D, L, R and B.
   *     e.g. a solved cube would be UUUUUUUUUFFFFFFDDDDDDDDDLLLLLLLLLRRRRRRRRRBBBBBBBBB.
   *     note - the order of the faces refers to the side of the cube, not the color, so another solved cube
   *     would be  DDDDDDDDDBBBBBBBBBUUUUUUUUURRRRRRRRRLLLLLLFFFFFFFFF. below is a visualisation of the order.
   *                  +------------+
   *                  | U1  U2  U3 |
   *                  |            |
   *                  | U4  U5  U6 |
   *                  |            |
   *                  | U7  U8  U9 |
   *     +------------+------------+------------+------------+
   *     | L1  L2  L3 | F1  F2  F3 | R1  R2  R3 | B1  B2  B3 |
   *     |            |            |            |            |
   *     | L4  L5  L6 | F4  F5  F6 | R4  R5  R6 | B4  B5  B6 |
   *     |            |            |            |            |
   *     | L7  L8  L9 | F7  F8  F9 | R7  R8  R9 | B7  B8  B9 |
   *     +------------+------------+------------+------------+
   *                  | D1  D2  D3 |
   *                  |            |
   *                  | D4  D5  D6 |
   *                  |            |
   *                  | D7  D8  D9 |
   *                  +------------+
   *   startingPosition:
   *     an array in the form [x, y, z] of the starting index of where the cube will be drawn. (when
   *     startingPosition is [0, 0, 0] the bottom left cubelet will be in the middle of the central axes.)
   *   spacingPercentage:
   *     specifies spacing between cubelets in a percentage of the whole cubelet. represented as a float,
   *     e.g. 0.95 = 95%.
   *   lineWidth:
   *     width of line between defining each cubelet. unfortunately webgl doesn't support lines wider than
   *     1 unit. 
   *   colorMappings:
   *     object in form {U: 0xsomehex, F: 0xanotherhex, etc...} to provide mappings between the UFDLRB
   *     internal representations of colors and their actual color values. the 'default' value will use the
   *     values - {U: white, F: red, D: yellow, L: green, R: blue, B: orange}.
   */
  // init all arguments and calculate spacing and sizes
  this.cubeSize = cubeSize;
  this.cubeSpacing = cubeSize / 3 * spacingPercentage;
  this.cubeletSize = (cubeSize - 3 * this.cubeSpacing) / 3;
  this.scene = scene;
  this.cubeString = cubeString;
  this.cubeStringObject = {
    U: this.cubeString.slice(0, 9),
    F: this.cubeString.slice(9, 18),
    D: this.cubeString.slice(18, 27),
    L: this.cubeString.slice(27, 36),
    R: this.cubeString.slice(36, 45),
    B: this.cubeString.slice(45, 54)
  };
  this.startingPosition = startingPosition;
  this.spacingPercentage = spacingPercentage;
  this.lineWidth = lineWidth;
  this.colorMappings = colorMappings;

  if (this.colorMappings === 'default') {
    this.colorMappings = {
      U: Rubiks3d.colors.white,
      F: Rubiks3d.colors.red,
      D: Rubiks3d.colors.yellow,
      L: Rubiks3d.colors.green,
      R: Rubiks3d.colors.blue,
      B: Rubiks3d.colors.orange
    };
  }

  this.isVisible = false; // create mappings for x, y and z values matching with UFDLRB values in cubestring

  this.cubeStringMappings = {
    FB: {
      y: {
        0: [6, 7, 8],
        1: [3, 4, 5],
        2: [0, 1, 2]
      },
      x: {
        0: [0, 3, 6],
        1: [1, 4, 7],
        2: [2, 5, 8]
      }
    },
    UD: {
      x: {
        0: [0, 3, 6],
        1: [1, 4, 7],
        2: [2, 5, 8]
      },
      z: {
        0: [0, 1, 2],
        1: [3, 4, 5],
        2: [6, 7, 8]
      }
    },
    RL: {
      y: {
        0: [6, 7, 8],
        1: [3, 4, 5],
        2: [0, 1, 2]
      },
      z: {
        0: [0, 3, 6],
        1: [1, 4, 7],
        2: [2, 5, 8]
      }
    }
  }; // methods (_methods are not meant to be called by user)

  this._setVisible = function (visible) {
    for (var x = 0; x < this.cubelets.length; x++) {
      this.cubelets[x].mesh.visible = visible;
    }
  };

  this._createMaterialArray = function (materials) {
    /*
     * _createMaterialArray
     * given an array of materials in hex format (e.g. 0xFF0000), return an array of 
     * THREE.MeshBasicMaterials created from the array. The materials also have the polygonOffset
     * property set to True to enable better looking wireframes.
     */
    var materialsArray = [];

    for (var i = 0; i < 6; i++) {
      materialsArray.push(new THREE.MeshBasicMaterial({
        color: materials[i],
        polygonOffset: true,
        // used to offset the wireframe a bit
        polygonOffsetFactor: 0.5,
        polygonOffsetUnits: 0.5
      }));
    }

    return materialsArray;
  };

  this._intersection = function (array1, array2) {
    // helper function to return the intersection of two arrays
    return array1.filter(value => -1 !== array2.indexOf(value));
  };

  this._initCubeletsFromCubeString = function (cubeStringObject, colorMappings) {
    /*
     * _initCubeletsFromCubeString
     * given a cubeString initialise an array of cubelets and add to them to the scene (and hide them if
     * this.isVisible is false).
     *
     * cubelets are objects in the form: {
     *     mesh: <three.js cube mesh, including wireframe>
     *     materials: <array containing materials in order [R, L, U, D, F, B]>
     *     pieceType: <string that is either 'corner', 'edge', 'center' or 'middleCube'>
     * }
     */
    var cubelets = [];

    for (var x = 0; x < 3; x++) {
      for (var y = 0; y < 3; y++) {
        for (var z = 0; z < 3; z++) {
          // create cube geometry
          var cubeGeometry = new THREE.BoxGeometry(this.cubeletSize, this.cubeletSize, this.cubeletSize); // generate materials for each face, materials must be in order: [x+, x-, y+, y-, z+, z-]

          var materials = new Array(6);
          var index;

          if (z === 0) {
            // must be back side (B)
            index = this._intersection(this.cubeStringMappings.FB.y[y], this.cubeStringMappings.FB.x[x])[0];
            materials[5] = colorMappings[cubeStringObject.B[index]];
          }

          if (z === 2) {
            // must be front side (F)
            index = this._intersection(this.cubeStringMappings.FB.y[y], this.cubeStringMappings.FB.x[x])[0];
            materials[4] = colorMappings[cubeStringObject.F[index]];
          }

          if (y === 0) {
            // must be down side (D)
            index = this._intersection(this.cubeStringMappings.UD.z[z], this.cubeStringMappings.UD.x[x])[0];
            materials[3] = colorMappings[cubeStringObject.D[index]];
          }

          if (y === 2) {
            // must be up side (U)
            index = this._intersection(this.cubeStringMappings.UD.z[z], this.cubeStringMappings.UD.x[x])[0];
            materials[2] = colorMappings[cubeStringObject.U[index]];
          }

          if (x === 0) {
            // must be left side (L)
            index = this._intersection(this.cubeStringMappings.RL.y[y], this.cubeStringMappings.RL.z[z])[0];
            materials[1] = colorMappings[cubeStringObject.L[index]];
          }

          if (x === 2) {
            // must be right side (R)
            index = this._intersection(this.cubeStringMappings.RL.y[y], this.cubeStringMappings.RL.z[z])[0];
            materials[0] = colorMappings[cubeStringObject.R[index]];
          } // copy materials array that will become part of the cubelet so it can be modified to be
          // used in the material list (by removing all empty values and replacing with white)


          var cubeMaterialArray = materials.slice();
          var numUndefined = 0;

          for (var i = 0; i < cubeMaterialArray.length; i++) {
            if (typeof cubeMaterialArray[i] === 'undefined') {
              numUndefined += 1;
              cubeMaterialArray[i] = Rubiks3d.colors.white;
            }
          } // get piece type depending on number of uncoloured faces


          var pieceType = '';

          switch (numUndefined) {
            case 3:
              pieceType = 'corner';
              break;

            case 4:
              pieceType = 'edge';
              break;

            case 5:
              pieceType = 'center';
              break;

            case 6:
              pieceType = 'middleCube';
              break;
          } // create materials list 


          var cubeMaterials = this._createMaterialArray(cubeMaterialArray);

          var cube = new THREE.Mesh(cubeGeometry, cubeMaterials); // create edges (wireframe)

          var edgesGeometry = new THREE.EdgesGeometry(cube.geometry);
          var edgesMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: this.lineWidth
          });
          var edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
          cube.add(edges); // set cube position and add to scene

          cube.position.set(x * this.cubeletSize + x * this.cubeSpacing + this.startingPosition[0], y * this.cubeletSize + y * this.cubeSpacing + this.startingPosition[1], z * this.cubeletSize + z * this.cubeSpacing + this.startingPosition[2]);
          cube.visible = this.visible;
          scene.add(cube); // construct cubelet and push to returning array

          cubelets.push(new Rubiks3d.Cube.Cubelet(cube, materials, pieceType));
        }
      }
    }

    return cubelets;
  }; // create cubelet structure


  this.cubelets = this._initCubeletsFromCubeString(this.cubeStringObject, this.colorMappings);
}; // cubelet constructor


Rubiks3d.Cube.Cubelet = function (mesh, materials, pieceType) {
  'use strict';

  this.mesh = mesh;
  this.materials = materials;
  this.pieceType = pieceType;
}; // getters and setters


Object.defineProperty(Rubiks3d.Cube.prototype, "visible", {
  set: function (visible) {
    'use strict';

    this._setVisible(visible);

    this.isVisible = visible;
  },
  get: function () {
    'use strict';

    return this.isVisible;
  }
});
