export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
    }
  }

  // Augment global JSX namespace
  namespace JSX {
    interface IntrinsicElements {
      // Three.js primitives
      group: any;
      mesh: any;
      scene: any;
      object3D: any;
      primitive: any;
      
      // Geometries
      boxGeometry: any;
      planeGeometry: any;
      cylinderGeometry: any;
      sphereGeometry: any;
      dodecahedronGeometry: any;
      circleGeometry: any;
      bufferGeometry: any;
      coneGeometry: any;
      torusGeometry: any;
      torusKnotGeometry: any;
      ringGeometry: any;

      // Materials
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
      meshBasicMaterial: any;
      meshPhongMaterial: any;
      shaderMaterial: any;
      shadowMaterial: any;
      pointsMaterial: any;
      lineBasicMaterial: any;
      
      // Lights
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      spotLight: any;
      hemisphereLight: any;
      rectAreaLight: any;
      
      // Cameras
      orthographicCamera: any;
      perspectiveCamera: any;
      
      // Helpers & Others
      color: any;
      
      // Catch-all to allow any valid three.js element name
      [elemName: string]: any;
    }
  }
}

// Augment React's internal JSX namespace (React 18+)
import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      scene: any;
      object3D: any;
      primitive: any;
      
      boxGeometry: any;
      planeGeometry: any;
      cylinderGeometry: any;
      sphereGeometry: any;
      dodecahedronGeometry: any;
      circleGeometry: any;
      bufferGeometry: any;
      coneGeometry: any;
      torusGeometry: any;
      torusKnotGeometry: any;
      ringGeometry: any;

      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
      meshBasicMaterial: any;
      meshPhongMaterial: any;
      shaderMaterial: any;
      shadowMaterial: any;
      pointsMaterial: any;
      lineBasicMaterial: any;
      
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      spotLight: any;
      hemisphereLight: any;
      rectAreaLight: any;
      
      orthographicCamera: any;
      perspectiveCamera: any;
      
      color: any;
      
      [elemName: string]: any;
    }
  }
}
