<script lang="ts">
  import type { Notebook } from '$lib/types/notebook';
  import NotebookComponent from '$lib/components/Notebook.svelte';

  let notebook: Notebook = {
    metadata: {
      title: "Neural Rendering Notes",
      authors: ["Your Name"],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tags: ["neural-rendering", "computer-graphics"],
      references: {
        zotero_ids: [],
        paper_citations: []
      }
    },
    cells: [
      {
        metadata: {
          id: "intro",
          type: "markdown",
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        },
        content: {
          source: `# Neural Rendering Research Notes

This notebook contains my research notes on neural rendering techniques.

## Key Topics
- Neural Radiance Fields (NeRF)
- Neural Texture Synthesis
- Real-time Neural Rendering
`
        }
      },
      {
        metadata: {
          id: "math-example",
          type: "markdown",
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        },
        content: {
          source: `## Mathematical Foundation

The rendering equation in neural rendering:

\`\`\`math
L_o(x, ω_o) = L_e(x, ω_o) + \int_{\Omega} f_r(x, ω_i, ω_o) L_i(x, ω_i) (ω_i · n) dω_i
\`\`\`

Where:
- $L_o$ is the outgoing radiance
- $L_e$ is the emitted radiance
- $f_r$ is the BRDF
- $L_i$ is the incoming radiance
`
        }
      },
      {
        metadata: {
          id: "python-plot",
          type: "python",
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        },
        content: {
          source: `import numpy as np
import matplotlib.pyplot as plt

# Generate sample data
x = np.linspace(-5, 5, 100)
y = np.sin(x) * np.exp(-0.1 * x**2)

# Create the plot
plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', label='Neural Response')
plt.title('Sample Neural Activation Function')
plt.xlabel('Input')
plt.ylabel('Output')
plt.grid(True)
plt.legend()
plt.show()`
        }
      },
      {
        metadata: {
          id: "3d-example",
          type: "javascript",
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        },
        content: {
          source: `// Create a simple 3D scene
const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
const material = new THREE.MeshPhongMaterial({
  color: 0x00ff00,
  shininess: 100,
  wireframe: false
});
const torusKnot = new THREE.Mesh(geometry, material);
scene.add(torusKnot);

// Animate the knot
function animate() {
  requestAnimationFrame(animate);
  torusKnot.rotation.x += 0.01;
  torusKnot.rotation.y += 0.01;
}
animate();`
        }
      },
      {
        metadata: {
          id: "shader-example",
          type: "shader",
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        },
        content: {
          source: `// Ray marching example
#define MAX_STEPS 100
#define MAX_DIST 100.0
#define SURF_DIST 0.001

float getDist(vec3 p) {
    vec4 s = vec4(0, 1, 6, 1); // Sphere: xyz = pos, w = radius
    float sphereDist = length(p - s.xyz) - s.w;
    float planeDist = p.y;
    return min(sphereDist, planeDist);
}

float rayMarch(vec3 ro, vec3 rd) {
    float dO = 0.0;
    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * dO;
        float dS = getDist(p);
        dO += dS;
        if(dO > MAX_DIST || dS < SURF_DIST) break;
    }
    return dO;
}

vec3 getNormal(vec3 p) {
    float d = getDist(p);
    vec2 e = vec2(.001, 0);
    vec3 n = d - vec3(
        getDist(p - e.xyy),
        getDist(p - e.yxy),
        getDist(p - e.yyx));
    return normalize(n);
}

float getLight(vec3 p) {
    vec3 lightPos = vec3(0, 5, 6);
    lightPos.xz += vec2(sin(iTime), cos(iTime)) * 2.0;
    vec3 l = normalize(lightPos - p);
    vec3 n = getNormal(p);
    float diff = clamp(dot(n, l), 0.0, 1.0);
    float d = rayMarch(p + n * SURF_DIST * 2.0, l);
    if(d < length(lightPos - p)) diff *= 0.1;
    return diff;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec3 col = vec3(0);
    
    vec3 ro = vec3(0, 1, 0);
    vec3 rd = normalize(vec3(uv.x, uv.y, 1));
    
    float d = rayMarch(ro, rd);
    vec3 p = ro + rd * d;
    
    float diff = getLight(p);
    col = vec3(diff);
    
    fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}`
        }
      }
    ],
    version: "1.0.0"
  };
</script>

<div class="container">
  <NotebookComponent {notebook} />
</div>

<style>
  .container {
    width: 100%;
    min-height: 100vh;
    background: #ffffff;
  }

  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  }
</style> 