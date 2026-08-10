import { mx_bilerp_0 } from 'three/src/nodes/materialx/lib/mx_noise.js'
import './style.css'
import skyImage from './assets/sky.png'

const galleryImageUrls = Object.values(import.meta.glob('./assets/bee_gallery_img_*.jpg', { eager: true, query: '?url', import: 'default' }));

import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { rand } from 'three/tsl';

const usedImageURLs = [];
const imageLocationsList = [];

let currentImage = 0;
let flightProgress = 0;
let flightDuration = 600;
let isTravelling = false;
let idleFrames = -400;


const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
})

renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
camera.position.setZ(75)

const controls = new OrbitControls(camera, renderer.domElement);

const geometry = new THREE.CylinderGeometry(2, 2, 5, 32);
const material = new THREE.MeshBasicMaterial({ color: 0xff6347 });
const cylinder = new THREE.Mesh(geometry, material);
cylinder.rotation.x = -45;

//const torusKnotGeometry = new THREE.TorusKnotGeometry( 10, 3, 100, 16 );
//const torusKnot = new THREE.Mesh( torusKnotGeometry, material );

scene.add(cylinder)

const pointLight = new THREE.PointLight(0xffffff, 5);
pointLight.position.set(5, 7, -13)
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);


// ===================== Helper =====================
const lightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(200, 50);
scene.add(lightHelper, gridHelper);


// ===================== Stars =====================
function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xF49B0B });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(200));

  star.position.set(x, y, z);
  scene.add(star);

}

// ===================== Images =====================
function addImageSprite(textureUrl) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: null, transparent: true }));
  const defaultHeight = 5;
  sprite.scale.set(defaultHeight, defaultHeight, 1);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(200));
  imageLocationsList.push([x, y, z]);
  console.log(imageLocationsList);
  sprite.position.set(x, y, z);
  scene.add(sprite);

  new THREE.TextureLoader().load(textureUrl, (texture) => {
    const aspect = texture.image.width / texture.image.height;
    sprite.material.map = texture;
    sprite.material.needsUpdate = true;
    sprite.scale.set(defaultHeight * aspect, defaultHeight, 1);
  });
}

Array(300).fill().forEach(addStar);
Array(100).fill().forEach(() => {
  const randomUrl = galleryImageUrls[Math.floor(Math.random() * galleryImageUrls.length)];
  if (!usedImageURLs.includes(randomUrl)) {
    addImageSprite(randomUrl);
    usedImageURLs.push(randomUrl);
  }
});

//const skyBoxTexture = new THREE.TextureLoader().load(skyImage);
//scene.background = skyBoxTexture;

function loopIdleAnimation() {
  //if (!isTravelling) {
  idleFrames += 0.015; //Add Value for speed
  cylinder.position.y += Math.sin(idleFrames) / 75; //Divide Value for height change

  if (idleFrames >= 1) {
    idleFrames = 0;
    console.log("Reset Idle Frames");
  }
  //}

}



function calculateTravellingDistance() {
  if (!isTravelling) {
    let [imageX, imageY, imageZ] = imageLocationsList[currentImage];
    let x = cylinder.position.x;
    let y = cylinder.position.y;
    let z = cylinder.position.z;

    let vecX = imageX - x;
    let vecY = imageY - y;
    let vecZ = imageZ - z;

    let distance = Math.sqrt(Math.pow(vecX, 2), Math.pow(vecY, 2), Math.pow(vecZ, 2));

    console.log(distance);
    return distance;
  }
}

function travelToImage1() {
  let [imageX, imageY, imageZ] = imageLocationsList[currentImage];
  let target = new THREE.Vector3(imageX, imageY, imageZ);
  const speed = 0.0025; // 0 < speed <= 1 (fraction of distance per frame)
  cylinder.position.lerp(target, speed);

  //Clean Curve
  //cylinder.position.y += Math.sin(idleFrames / calculateTravellingDistance());

  isTravelling = true;

  if (cylinder.position.distanceTo(target) < 0.1) {
    cylinder.position.copy(target);
    isTravelling = false;

    currentImage += 1;

    if (currentImage >= imageLocationsList.length) {
      currentImage = 0;
    }
  }
}

function prepareTravelToImage() {
  const [imageX, imageY, imageZ] = imageLocationsList[currentImage];

  const startLocation = cylinder.position.clone();
  const targetLocation = new THREE.Vector3(imageX, imageY, imageZ);

  const direction = target.clone().sub(start).normalize();

  const midpoint = startLocation.clone().lerp(targetLocation, 0.5);

  const side = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
  const curveAmount = 2.0 + Math.random() * 2.0;
  const controlLocation = midpoint.clone().add(side.multiplyScalar(curveAmount));

  flightCurve = new THREE.QuadraticBezierCurve3(startLocation, controlLocation, targetLocation);

  flightProgress = 0;
  isTravelling = true;



}


function animate() {
  requestAnimationFrame(animate);
  loopIdleAnimation();
  travelToImage1();


  controls.update();

  renderer.render(scene, camera)
}

animate();