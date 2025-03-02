import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';
import Stats from 'stats.js';
import { ModelLoader } from './model-loader';

interface ViewerObject {
  mesh: THREE.Object3D;
  body: CANNON.Body;
}

export class ThreeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private world: CANNON.World;
  private stats: Stats;
  private objects: { [key: string]: ViewerObject };
  private currentModelUrl: string | null = null;

  constructor(canvas: HTMLCanvasElement) {
    // Previous initialization code remains the same
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Setup camera and controls
    this.camera.position.set(0, 5, 10);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;

    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(ambientLight, directionalLight);

    // Initialize physics world
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);

    // Add ground
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(groundBody);

    // Add ground mesh
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8,
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // Initialize objects storage
    this.objects = {};

    // Setup stats
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  setModel(modelUrl: string | null) {
    this.currentModelUrl = modelUrl;
  }

  async addViewerObject(username: string) {
    try {
      let mesh: THREE.Object3D;
      let shape: CANNON.Shape;
      let size = { x: 1, y: 1, z: 1 };

      if (this.currentModelUrl) {
        // Load custom model
        mesh = await ModelLoader.loadModel(this.currentModelUrl);

        // Create a box shape based on model bounds
        const box = new THREE.Box3().setFromObject(mesh);
        const dimensions = box.getSize(new THREE.Vector3());
        size = { x: dimensions.x, y: dimensions.y, z: dimensions.z };
        shape = new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2));
      } else {
        // Create default cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
          color: Math.random() * 0xffffff,
          metalness: 0.3,
          roughness: 0.4,
        });
        mesh = new THREE.Mesh(geometry, material);
        shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
      }

      // Create physics body
      const body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(
          Math.random() * 4 - 2,
          10,
          Math.random() * 4 - 2
        ),
      });
      body.addShape(shape);

      // Store object
      this.objects[username] = { mesh, body };

      // Add to scenes
      this.scene.add(mesh);
      this.world.addBody(body);
    } catch (error) {
      console.error('Error adding viewer object:', error);
      // Fallback to cube if model loading fails
      this.currentModelUrl = null;
      await this.addViewerObject(username);
    }
  }

  animate() {
    const animate = () => {
      requestAnimationFrame(animate);

      // Update stats
      this.stats.begin();

      // Update physics
      this.world.step(1/60);

      // Update object positions
      Object.values(this.objects).forEach(({ mesh, body }) => {
        mesh.position.copy(body.position as unknown as THREE.Vector3);
        mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
      });

      // Update controls
      this.controls.update();

      // Render
      this.renderer.render(this.scene, this.camera);

      this.stats.end();
    };

    animate();
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    // Cleanup Three.js resources
    this.scene.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });

    // Clear model cache
    ModelLoader.clearCache();

    // Remove stats
    document.body.removeChild(this.stats.dom);

    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
  }
}