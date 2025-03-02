import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';

export function useGameEngine() {
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [score, setScore] = useState(0);
  const [objects, setObjects] = useState<THREE.Object3D[]>([]);

  useEffect(() => {
    const newScene = new THREE.Scene();
    const newCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const newRenderer = new THREE.WebGLRenderer({ antialias: true });

    newRenderer.setSize(window.innerWidth, window.innerHeight);
    newCamera.position.z = 15;
    newCamera.position.y = 5;
    newCamera.lookAt(0, 0, 0);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    newScene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    newScene.add(directionalLight);

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    newScene.add(ground);

    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);

    const animate = () => {
      requestAnimationFrame(animate);
      objects.forEach((obj) => {
        obj.rotation.x += 0.01;
        obj.rotation.y += 0.01;
      });
      newRenderer.render(newScene, newCamera);
    };
    animate();

    return () => {
      newRenderer.dispose();
    };
  }, [objects]);

  const spawnObject = useCallback((type: string, x: number, y: number, z: number) => {
    if (!scene) return;

    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    switch (type) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5);
        material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        break;
      case 'cube':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        break;
      case 'heart':
        geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
        material = new THREE.MeshPhongMaterial({ color: 0xff69b4 });
        break;
      default:
        return;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    setObjects((prev) => [...prev, mesh]);
    setScore((prev) => prev + 10);
  }, [scene]);

  return {
    scene,
    camera,
    renderer,
    score,
    spawnObject,
  };
}
