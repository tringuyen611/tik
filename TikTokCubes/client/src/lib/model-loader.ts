import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as THREE from 'three';

export class ModelLoader {
  private static loader = new FBXLoader();
  private static cache = new Map<string, THREE.Group>();

  static async loadModel(url: string): Promise<THREE.Group> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!.clone();
    }

    try {
      const model = await this.loader.loadAsync(url);
      
      // Scale down the model to a reasonable size
      model.scale.setScalar(0.05);
      
      // Center the model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      // Cache the model
      this.cache.set(url, model.clone());
      
      return model;
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    }
  }

  static clearCache() {
    this.cache.clear();
  }
}
