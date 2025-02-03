import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface Scene3D {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  animate: () => void;
}

const scenes = new Map<string, Scene3D>();
const isBrowser = typeof window !== 'undefined';

export function initializeThreeScene(containerId: string, width: number, height: number): Scene3D {
  if (!isBrowser) {
    throw new Error('Three.js can only be initialized in a browser environment');
  }

  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Create camera
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 5;

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Get container and add renderer
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with id ${containerId} not found`);
  }
  container.appendChild(renderer.domElement);

  // Add orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Create animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  const sceneObj = { scene, camera, renderer, controls, animate };
  scenes.set(containerId, sceneObj);
  animate();

  return sceneObj;
}

export function disposeThreeScene(containerId: string) {
  if (!isBrowser) return;

  const scene = scenes.get(containerId);
  if (!scene) return;

  // Dispose of all geometries and materials
  scene.scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach(material => material.dispose());
      } else {
        object.material.dispose();
      }
    }
  });

  // Dispose of renderer
  scene.renderer.dispose();

  // Remove from DOM
  const container = document.getElementById(containerId);
  if (container) {
    container.removeChild(scene.renderer.domElement);
  }

  // Remove from scenes map
  scenes.delete(containerId);
}

export function executeThreeCode(code: string, containerId: string): Promise<{
  type: '3d' | 'error';
  data: any;
}> {
  return new Promise((resolve) => {
    if (!isBrowser) {
      resolve({
        type: 'error',
        data: 'Three.js can only be executed in a browser environment'
      });
      return;
    }

    try {
      let scene = scenes.get(containerId);
      if (!scene) {
        const container = document.getElementById(containerId);
        if (!container) {
          throw new Error(`Container with id ${containerId} not found`);
        }
        scene = initializeThreeScene(containerId, container.clientWidth, container.clientHeight);
      }

      // Clear existing meshes
      scene.scene.children = scene.scene.children.filter(child => 
        child instanceof THREE.Camera || 
        child instanceof THREE.Light
      );

      // Add default lighting if none exists
      if (!scene.scene.children.some(child => child instanceof THREE.Light)) {
        const ambientLight = new THREE.AmbientLight(0x404040);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.scene.add(ambientLight, directionalLight);
      }

      // Execute the code with Three.js context
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction(
        'THREE',
        'scene',
        'camera',
        'renderer',
        code
      );

      fn(THREE, scene.scene, scene.camera, scene.renderer)
        .then(() => {
          resolve({
            type: '3d',
            data: containerId
          });
        })
        .catch((error: Error) => {
          resolve({
            type: 'error',
            data: error.message
          });
        });
    } catch (error) {
      if (error instanceof Error) {
        resolve({
          type: 'error',
          data: error.message
        });
      } else {
        resolve({
          type: 'error',
          data: 'An unknown error occurred'
        });
      }
    }
  });
}

// Handle window resize
if (isBrowser) {
  window.addEventListener('resize', () => {
    scenes.forEach((scene, containerId) => {
      const container = document.getElementById(containerId);
      if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        scene.camera.aspect = width / height;
        scene.camera.updateProjectionMatrix();
        scene.renderer.setSize(width, height);
      }
    });
  });
} 