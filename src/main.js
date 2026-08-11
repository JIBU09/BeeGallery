import { mx_bilerp_0 } from 'three/src/nodes/materialx/lib/mx_noise.js'
import './style.css'
import skyImage from './assets/sky.png'

const galleryImageUrls = Object.values(import.meta.glob('./assets/bee_gallery_img_*.jpg', { eager: true, query: '?url', import: 'default' }));

import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { rand } from 'three/tsl';
//import { ToonShaderHatching } from 'three/examples/jsm/Addons.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const usedImageURLs = [];
const imageLocationsList = [];

let currentImage = 0;
let flightProgress = 0;
let flightCurve = 0;
let isTravelling = false;
let idleFrames = -400;
const flightSpeed = 0.001;
let randomOffsetX;


const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300) //75
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
})

renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
//camera.position.setZ(75)

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
const cameraHelper = new THREE.CameraHelper(camera);
//scene.add(lightHelper, gridHelper, camera);


// ===================== Stars =====================
function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xF49B0B, emissive: 0xF49B0B, emissiveIntensity: 2 });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(800));

  star.position.set(x, y, z);
  scene.add(star);

}

// ===================== Images =====================
function addImageSprite(textureUrl) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: null, transparent: true }));
  const defaultHeight = 5;
  sprite.scale.set(defaultHeight, defaultHeight, 1);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(400));
  imageLocationsList.push([x, y, z]);
  sprite.position.set(x, y, z);
  scene.add(sprite);

  new THREE.TextureLoader().load(textureUrl, (texture) => {
    const aspect = texture.image.width / texture.image.height;
    sprite.material.map = texture;
    sprite.material.needsUpdate = true;
    sprite.scale.set(defaultHeight * aspect, defaultHeight, 1);
  });
}

Array(1200).fill().forEach(addStar);
Array(100).fill().forEach(() => {
  const randomUrl = galleryImageUrls[Math.floor(Math.random() * galleryImageUrls.length)];
  if (!usedImageURLs.includes(randomUrl)) {
    addImageSprite(randomUrl);
    usedImageURLs.push(randomUrl);
  }
});
console.log(imageLocationsList);

//const skyBoxTexture = new THREE.TextureLoader().load(skyImage);
//scene.background = skyBoxTexture;

function loopIdleAnimation() {
  //if (!isTravelling) {
  idleFrames += 0.015; //Add Value for speed
  cylinder.position.y += Math.sin(idleFrames) / 75; //Divide Value for height change

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

function calculateIdealCameraOffset(target) {
  const idealCameraOffset = new THREE.Vector3(5, 5, -5);
  //idealCameraOffset.applyQuaternion(target.rotation);
  idealCameraOffset.add(target.position);
  return idealCameraOffset;
}

function calculateIdealCameraLookAt(target) {
  const idealCameraLookAt = new THREE.Vector3(0, 10, 50);
  idealCameraLookAt.applyQuaternion(target.rotation);
  idealCameraLookAt.add(target.position);
  return idealCameraLookAt;
}


function prepareTravelToImage() {
  const [imageX, imageY, imageZ] = imageLocationsList[currentImage];
  randomOffsetX = Math.floor(Math.random() * (10 - 5 + 1)) + 5;

  const startLocation = cylinder.position.clone();
  const targetLocation = new THREE.Vector3(imageX - randomOffsetX, imageY, imageZ);

  const direction = targetLocation.clone().sub(startLocation).normalize();

  const midpoint = startLocation.clone().lerp(targetLocation, 0.5);

  const side = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
  const curveAmount = 20.0 + Math.random() * 50.0;
  const controlLocation = midpoint.clone().add(side.multiplyScalar(curveAmount));

  flightCurve = new THREE.QuadraticBezierCurve3(startLocation, controlLocation, targetLocation);

  flightProgress = 0;
  isTravelling = true;

}


function travelToImage() {
  if (isTravelling) {
    flightProgress += flightSpeed;

    const position = flightCurve.getPoint(flightProgress);
    cylinder.position.copy(position);

    const nextPosition = flightCurve.getPoint(Math.min(flightProgress + 0.01, 1));

    cylinder.lookAt(nextPosition);

    const ogCameraLoc = camera.position.copy(calculateIdealCameraOffset(cylinder));

    // Direkt auf den Cylinder schauen
    camera.lookAt(cylinder.position);

    if (flightProgress >= 1) {
      isTravelling = false;
      currentImage += 1;

      if (currentImage >= imageLocationsList.length) {
        currentImage = 0;
      }

      camera.position.copy((new THREE.Vector3(3 + randomOffsetX, 3, -3)).add(cylinder.position))

      setTimeout(() => {
        prepareTravelToImage();
      }, 7.5 * 1000);
    }
  }
}





function animate() {
  requestAnimationFrame(animate);

  loopIdleAnimation();
  travelToImage();

  if (!isTravelling) {
    //controls.update();
  }

  renderer.render(scene, camera);
}


prepareTravelToImage();
animate();