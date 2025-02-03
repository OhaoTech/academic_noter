import * as THREE from 'three';

interface ShaderScene {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  material: THREE.ShaderMaterial;
  mesh: THREE.Mesh;
  uniforms: {
    iTime: { value: number };
    iResolution: { value: THREE.Vector3 };
    iMouse: { value: THREE.Vector2 };
  };
  animate: () => void;
}

const shaderScenes = new Map<string, ShaderScene>();
const isBrowser = typeof window !== 'undefined';

const defaultVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export function initializeShaderScene(containerId: string, width: number, height: number): ShaderScene {
  if (!isBrowser) {
    throw new Error('WebGL shaders can only be initialized in a browser environment');
  }

  // Create scene
  const scene = new THREE.Scene();

  // Create camera (orthographic for full-screen quad)
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

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

  // Create uniforms
  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3(width, height, 1) },
    iMouse: { value: new THREE.Vector2(0, 0) }
  };

  // Create material with default shaders
  const material = new THREE.ShaderMaterial({
    vertexShader: defaultVertexShader,
    fragmentShader: 'void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }',
    uniforms
  });

  // Create full-screen quad
  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Setup mouse interaction
  container.addEventListener('mousemove', (event) => {
    const rect = container.getBoundingClientRect();
    uniforms.iMouse.value.x = event.clientX - rect.left;
    uniforms.iMouse.value.y = event.clientY - rect.top;
  });

  // Create animation loop
  let lastTime = 0;
  function animate(currentTime: number = 0) {
    requestAnimationFrame(animate);
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    uniforms.iTime.value += deltaTime;
    renderer.render(scene, camera);
  }

  const shaderScene = { scene, camera, renderer, material, mesh, uniforms, animate };
  shaderScenes.set(containerId, shaderScene);
  animate();

  return shaderScene;
}

export function disposeShaderScene(containerId: string) {
  if (!isBrowser) return;

  const scene = shaderScenes.get(containerId);
  if (!scene) return;

  // Dispose of geometries and materials
  scene.mesh.geometry.dispose();
  scene.material.dispose();

  // Dispose of renderer
  scene.renderer.dispose();

  // Remove from DOM
  const container = document.getElementById(containerId);
  if (container) {
    container.removeChild(scene.renderer.domElement);
  }

  // Remove from scenes map
  shaderScenes.delete(containerId);
}

export function executeShaderCode(code: string, containerId: string): Promise<{
  type: '3d' | 'error';
  data: any;
}> {
  return new Promise((resolve) => {
    if (!isBrowser) {
      resolve({
        type: 'error',
        data: 'WebGL shaders can only be executed in a browser environment'
      });
      return;
    }

    try {
      let scene = shaderScenes.get(containerId);
      if (!scene) {
        const container = document.getElementById(containerId);
        if (!container) {
          throw new Error(`Container with id ${containerId} not found`);
        }
        scene = initializeShaderScene(containerId, container.clientWidth, container.clientHeight);
      }

      // Update shader code
      scene.material.fragmentShader = code;
      scene.material.needsUpdate = true;

      resolve({
        type: '3d',
        data: containerId
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
    shaderScenes.forEach((scene, containerId) => {
      const container = document.getElementById(containerId);
      if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        scene.renderer.setSize(width, height);
        scene.uniforms.iResolution.value.set(width, height, 1);
      }
    });
  });
} 