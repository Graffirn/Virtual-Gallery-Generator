import * as THREE from './js/three.module.js'
import { PointerLockControls } from './js/PointerLockControls.js';
import { OBJLoader } from './js/OBJLoader.js';
import { GLTFExporter } from './js/GLTFExporter.js';

const CUBE_X = 10, CUBE_Y = 10, CUBE_Z = 10;

var walls = [[1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 1], [0, 0, 0, 0, 0, 1]];
window.tempMap = null;
var textureLoader, default_wall, default_floor, default_sky;

var picture, floor, sky, wall;
var fileReader;

var camera, scene, renderer, controls;

var objects = [];
var targetList = [];

var raycaster, raycaster_paint;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();

init();
animate();

function init() {
  var str_map = localStorage.getItem("generated_map");

  if (str_map != null){
    walls = JSON.parse(str_map);
  }

  fileReader = new FileReader();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.y = 10;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 0, 750);

  var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  controls = new PointerLockControls(camera);

  var blocker = document.getElementById('blocker');
  var instructions = document.getElementById('instructions');
  var hud = document.getElementById('hud');

  instructions.addEventListener('click', function () {

    controls.lock();

  }, false);

  controls.addEventListener('lock', function () {

    instructions.style.display = 'none';
    blocker.style.display = 'none';
    hud.style.display = '';
  });

  controls.addEventListener('unlock', function () {
    blocker.style.display = 'block';
    instructions.style.display = '';
    hud.style.display = 'none';

  });

  scene.add(controls.getObject());

  var onKeyDown = function (event) {

    switch (event.keyCode) {

      case 38: // up
      case 87: // w
        moveForward = true;
        break;

      case 37: // left
      case 65: // a
        moveLeft = true;
        break;

      case 40: // down
      case 83: // s
        moveBackward = true;
        break;

      case 39: // right
      case 68: // d
        moveRight = true;
        break;

      case 32: // space
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;

    }

  };

  var onKeyUp = function (event) {

    switch (event.keyCode) {

      case 38: // up
      case 87: // w
        moveForward = false;
        break;

      case 37: // left
      case 65: // a
        moveLeft = false;
        break;

      case 40: // down
      case 83: // s
        moveBackward = false;
        break;

      case 39: // right
      case 68: // d
        moveRight = false;
        break;

    }

  };

  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);
  raycaster_paint = new THREE.Raycaster();

  textureLoader = new THREE.TextureLoader();
  default_floor = textureLoader.load('img/floor.jpg');
  default_wall = textureLoader.load('img/wall.jpg');
  default_sky = textureLoader.load('img/sky.jpg');

  // Floor

  var geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
  geometry.rotateX(- Math.PI / 2);
  var floorTexture = default_floor;
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(20, 20);
  var material = new THREE.MeshBasicMaterial({ map: floorTexture });
  floor = new THREE.Mesh(geometry, material);
  scene.add(floor);

  // Sky

  var sphere = new THREE.SphereGeometry(500, 32, 32);
  var skyTexture = default_sky;
  skyTexture.repeat.set(20, 20);
  var material = new THREE.MeshBasicMaterial({ map: skyTexture });
  sky = new THREE.Mesh(sphere, material);
  sky.material.side = THREE.BackSide;
  scene.add(sky);

  // objects

  var boxGeometry = new THREE.BoxBufferGeometry(CUBE_X, CUBE_Y, CUBE_Z);
  var boxMaterial = new THREE.MeshBasicMaterial({ map: default_wall });

  for (var i = 0; i < walls.length; i++) {
    for (var j = 0; j < walls[0].length; j++) {
      if (walls[i][j] == 1) {
        for (var z = 0; z < 3; z++) {
          var box = new THREE.Mesh(boxGeometry, boxMaterial);
          box.position.x = CUBE_X * i;
          box.position.y = CUBE_Y * z + CUBE_Y / 2;
          box.position.z = CUBE_Z * j;
          if (z == 1) {
            targetList.push(box);
          }
          scene.add(box);
          objects.push(box);
        }
      }
    }
  }

  // var axisHelper = new THREE.AxisHelper(100);
  // scene.add(axisHelper);

  document.addEventListener('click', function () {
    if (controls.isLocked === true) {
      var mouse = new THREE.Vector2();

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
      raycaster_paint.setFromCamera(mouse, camera);
      var intersects = raycaster_paint.intersectObjects(targetList);
      if (intersects.length > 0 && picture) {
        console.log(intersects[0]);
        var materialArray = [
          new THREE.MeshBasicMaterial({ map: picture }),
          new THREE.MeshBasicMaterial({ map: picture }),
          new THREE.MeshBasicMaterial({ map: picture }),
          new THREE.MeshBasicMaterial({ map: picture }),
          new THREE.MeshBasicMaterial({ map: picture }),
          new THREE.MeshBasicMaterial({ map: picture }),
        ];
        intersects[0].object.material = materialArray;
        picture = null;
      }
    }

  }, false);
  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //

  window.addEventListener('resize', onWindowResize, false);

}

function reset_map() {
  objects = [];
  targetList = [];
  walls = [];
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

  requestAnimationFrame(animate);

  if (controls.isLocked === true) {

    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 10;

    var intersections = raycaster.intersectObjects(objects);

    var onObject = intersections.length > 0;

    var time = performance.now();
    var delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    if (onObject === true) {

      velocity.y = Math.max(0, velocity.y);
      canJump = true;

    }

    controls.moveRight(- velocity.x * delta);
    controls.moveForward(- velocity.z * delta);

    controls.getObject().position.y += (velocity.y * delta);
    if (controls.getObject().position.y < 10) {

      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;

    }

    prevTime = time;

  }

  renderer.render(scene, camera);

}

var link = document.createElement('a');
link.style.display = 'none';
document.body.appendChild(link);

function save(blob, filename) {

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();

}

function saveArrayBuffer(buffer, filename) {

  save(new Blob([buffer], { type: 'application/octet-stream' }), filename);

}

function exportGLTF(input, name) {

  var gltfExporter = new GLTFExporter();

  var options = {
    trs: false,
    onlyVisible: true,
    truncateDrawRange: true,
    binary: true,
    binary: true,
    forcePowerOfTwoTextures: false,
    maxTextureSize: Infinity
  };
  gltfExporter.parse(input, function (result) {

    if (result instanceof ArrayBuffer) {

      saveArrayBuffer(result, name + '.glb');

    } else {

      var output = JSON.stringify(result, null, 2);
      console.log(output);
      saveString(output, name + '.gltf');

    }

  }, options);

}

document.getElementById('export-file').addEventListener('click', function () {
  exportGLTF(scene, 'scene');
});

const photoUpload = document.getElementById('photo-texture-file');
const skyUpload = document.getElementById('sky-texture-file');
const floorUpload = document.getElementById('floor-texture-file');
const wallUpload = document.getElementById('wall-texture-file');

photoUpload.addEventListener('change', function () {
  var file = photoUpload.files[0];
  if (file && file.type.match('image/*')) {
    fileReader.readAsDataURL(file);
    fileReader.onloadend = function (e) {
      picture = textureLoader.load(fileReader.result);
    }
  }
});

floorUpload.addEventListener('change', function () {
  var file = floorUpload.files[0];
  if (file && file.type.match('image/*')) {
    fileReader.readAsDataURL(file);
    fileReader.onloadend = function (e) {
      var floorTexture = textureLoader.load(fileReader.result);
      floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
      floorTexture.repeat.set(20, 20);
      floor.material = new THREE.MeshBasicMaterial({ map: floorTexture });
    }
  }
});

skyUpload.addEventListener('change', function () {
  var file = skyUpload.files[0];
  if (file && file.type.match('image/*')) {
    fileReader.readAsDataURL(file);
    fileReader.onloadend = function (e) {
      var skyTexture = textureLoader.load(fileReader.result);
      skyTexture.repeat.set(20, 20);
      sky.material = new THREE.MeshBasicMaterial({ map: skyTexture });
      sky.material.side = THREE.BackSide;
    }
  }
});

wallUpload.addEventListener('change', function () {
  var file = wallUpload.files[0];
  if (file && file.type.match('image/*')) {
    fileReader.readAsDataURL(file);
    fileReader.onloadend = function (e) {
      var wallTexture = textureLoader.load(fileReader.result);
      var obj;
      for (obj of objects) {
        if (obj.material.length != 6) {
          obj.material = new THREE.MeshBasicMaterial({ map: wallTexture });
        }
      }
    }
  }
});

function zeros(dimensions) {
  var array = [];
  for (var i = 0; i < dimensions[0]; ++i) {
    array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
  }
  return array;
}

const btnShowMap = document.getElementById('show-map');

btnShowMap.addEventListener('click', function () {
  $('table tr').remove();
  var row_input = $('#input_height').val();
  var col_input = $('#input_width').val();
  window.tempMap = zeros([row_input, col_input]);
  console.log(row_input, col_input);
  for (var i = 0; i < row_input; i++) {
    $('#pixel_canvas').append("<tr></tr>");
    for (var j = 0; j < col_input; j++) {
      $('tr:last').append(`<td data="${i}-${j}"></td>`);
      $('td').attr("class", 'cells');
      $('td').attr("onclick", 'cellClicked(this);');
    }
  }
  $('#mapModal').modal('show');
});

const btnCreateMap = document.getElementById('btn-create-map');

btnCreateMap.addEventListener('click', function () {
  reset_map();
  walls = window.tempMap;
  localStorage.setItem("generated_map", JSON.stringify(tempMap));
  init();
  location.reload();
})