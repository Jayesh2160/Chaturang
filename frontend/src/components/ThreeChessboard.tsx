import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeChessboard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track mouse coordinates for subtle board tilt
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetTiltRef = useRef({ x: 0, y: 0 });
  const currentTiltRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030303, 0.03);

    // --- Camera Setup ---
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    // Base camera positions
    const radius = 10.5;
    const cameraHeight = 7.0;
    camera.position.set(0, cameraHeight, radius);
    camera.lookAt(0, 0.2, 0);

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // --- Lights Setup ---
    // 1. Subtle ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambientLight);

    // 2. Main Top Light (white, soft shadow)
    const topLight = new THREE.DirectionalLight(0xffffff, 2.5);
    topLight.position.set(0, 10, 0);
    topLight.castShadow = true;
    topLight.shadow.mapSize.width = 1024;
    topLight.shadow.mapSize.height = 1024;
    topLight.shadow.camera.near = 0.5;
    topLight.shadow.camera.far = 15;
    topLight.shadow.camera.left = -5;
    topLight.shadow.camera.right = 5;
    topLight.shadow.camera.top = 5;
    topLight.shadow.camera.bottom = -5;
    topLight.shadow.bias = -0.0005;
    scene.add(topLight);

    // 3. Purple Rim Light (vibrant glow from back-left)
    const purpleRimLight = new THREE.PointLight(0x6d4aff, 12, 20);
    purpleRimLight.position.set(-6, 2, -6);
    purpleRimLight.castShadow = true;
    scene.add(purpleRimLight);

    // 4. Soft Reflection Light (opposite side, fills in shadows)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(6, 3, 6);
    scene.add(fillLight);

    // --- Materials ---
    const boardBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      roughness: 0.6,
      metalness: 0.8,
    });

    const lightSquareMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8, // zinc-300
      roughness: 0.2,
      metalness: 0.1,
    });

    const darkSquareMaterial = new THREE.MeshStandardMaterial({
      color: 0x27272a, // zinc-800
      roughness: 0.35,
      metalness: 0.3,
    });

    const whitePieceMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4f4f5, // zinc-100
      roughness: 0.25,
      metalness: 0.1,
    });

    const blackPieceMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b, // zinc-900 (dark metallic)
      roughness: 0.3,
      metalness: 0.75,
    });

    // --- Board Construction ---
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // Board base
    const baseWidth = 8.8;
    const baseThickness = 0.3;
    const boardBase = new THREE.Mesh(
      new THREE.BoxGeometry(baseWidth, baseThickness, baseWidth),
      boardBaseMaterial
    );
    boardBase.position.y = -baseThickness / 2;
    boardBase.receiveShadow = true;
    boardGroup.add(boardBase);

    // Add border rim around the board
    const borderGeometry = new THREE.BoxGeometry(baseWidth + 0.3, baseThickness + 0.05, baseWidth + 0.3);
    const borderMaterial = new THREE.MeshStandardMaterial({
      color: 0x050506,
      roughness: 0.4,
      metalness: 0.9,
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.y = -(baseThickness + 0.05) / 2;
    border.receiveShadow = true;
    boardGroup.add(border);

    // Create 64 squares
    const squareSize = 1.0;
    const halfBoard = 3.5;
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 8; z++) {
        const isLight = (x + z) % 2 === 0;
        const squareGeo = new THREE.BoxGeometry(squareSize, 0.04, squareSize);
        const square = new THREE.Mesh(
          squareGeo,
          isLight ? lightSquareMaterial : darkSquareMaterial
        );
        square.position.set((x - halfBoard) * squareSize, 0.02, (z - halfBoard) * squareSize);
        square.receiveShadow = true;
        boardGroup.add(square);
      }
    }

    // --- Procedural Chess Piece Generation ---
    const createPiece = (type: string, color: 'white' | 'black') => {
      const group = new THREE.Group();
      const material = color === 'white' ? whitePieceMaterial : blackPieceMaterial;

      // Base cylinder for all pieces
      const baseGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 20);
      const baseMesh = new THREE.Mesh(baseGeo, material);
      baseMesh.position.y = 0.04;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      const baseRingGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.04, 20);
      const baseRingMesh = new THREE.Mesh(baseRingGeo, material);
      baseRingMesh.position.y = 0.1;
      baseRingMesh.castShadow = true;
      group.add(baseRingMesh);

      if (type === 'pawn') {
        // Body cone
        const bodyGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.45, 16);
        const body = new THREE.Mesh(bodyGeo, material);
        body.position.y = 0.325;
        body.castShadow = true;
        group.add(body);

        // Collar ring
        const collarGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16);
        const collar = new THREE.Mesh(collarGeo, material);
        collar.position.y = 0.56;
        collar.castShadow = true;
        group.add(collar);

        // Head sphere
        const headGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const head = new THREE.Mesh(headGeo, material);
        head.position.y = 0.7;
        head.castShadow = true;
        group.add(head);
      } 
      else if (type === 'rook') {
        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.2, 0.26, 0.55, 16);
        const body = new THREE.Mesh(bodyGeo, material);
        body.position.y = 0.375;
        body.castShadow = true;
        group.add(body);

        // Castle top
        const topGeo = new THREE.CylinderGeometry(0.28, 0.25, 0.18, 16);
        const topMesh = new THREE.Mesh(topGeo, material);
        topMesh.position.y = 0.74;
        topMesh.castShadow = true;
        group.add(topMesh);
      } 
      else if (type === 'knight') {
        // Body stem
        const stemGeo = new THREE.CylinderGeometry(0.15, 0.24, 0.35, 16);
        const stem = new THREE.Mesh(stemGeo, material);
        stem.position.y = 0.275;
        stem.castShadow = true;
        group.add(stem);

        // Abstract Horse Head (Geometric)
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.6, 0);

        // Main head box
        const mainHeadGeo = new THREE.BoxGeometry(0.18, 0.35, 0.3);
        const mainHead = new THREE.Mesh(mainHeadGeo, material);
        mainHead.position.set(0, 0, 0.05);
        mainHead.rotation.x = 0.15; // angled down
        headGroup.add(mainHead);

        // Snout box
        const snoutGeo = new THREE.BoxGeometry(0.16, 0.16, 0.22);
        const snout = new THREE.Mesh(snoutGeo, material);
        snout.position.set(0, 0.08, 0.2);
        snout.rotation.x = 0.35;
        headGroup.add(snout);

        // Mane curve back
        const maneGeo = new THREE.BoxGeometry(0.18, 0.4, 0.1);
        const mane = new THREE.Mesh(maneGeo, material);
        mane.position.set(0, -0.05, -0.12);
        headGroup.add(mane);

        // Ears
        const earLGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
        const earL = new THREE.Mesh(earLGeo, material);
        earL.position.set(-0.06, 0.2, -0.02);
        earL.rotation.z = -0.1;
        headGroup.add(earL);

        const earR = earL.clone();
        earR.position.x = 0.06;
        earR.rotation.z = 0.1;
        headGroup.add(earR);

        headGroup.rotation.y = color === 'white' ? 0 : Math.PI; // Face opposite directions
        group.add(headGroup);
      } 
      else if (type === 'bishop') {
        // Body stem
        const bodyGeo = new THREE.CylinderGeometry(0.14, 0.24, 0.5, 16);
        const body = new THREE.Mesh(bodyGeo, material);
        body.position.y = 0.35;
        body.castShadow = true;
        group.add(body);

        // Collar
        const collarGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16);
        const collar = new THREE.Mesh(collarGeo, material);
        collar.position.y = 0.6;
        collar.castShadow = true;
        group.add(collar);

        // Oval head
        const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const head = new THREE.Mesh(headGeo, material);
        head.position.y = 0.76;
        head.scale.set(1, 1.3, 1); // elongate
        head.castShadow = true;
        group.add(head);

        // Tip sphere
        const tipGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const tip = new THREE.Mesh(tipGeo, material);
        tip.position.y = 0.98;
        tip.castShadow = true;
        group.add(tip);
      } 
      else if (type === 'queen') {
        // Body stem
        const bodyGeo = new THREE.CylinderGeometry(0.14, 0.25, 0.68, 16);
        const body = new THREE.Mesh(bodyGeo, material);
        body.position.y = 0.44;
        body.castShadow = true;
        group.add(body);

        // Crown collar
        const collarGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16);
        const collar = new THREE.Mesh(collarGeo, material);
        collar.position.y = 0.78;
        collar.castShadow = true;
        group.add(collar);

        // Crown top flare
        const crownGeo = new THREE.CylinderGeometry(0.3, 0.16, 0.2, 16);
        const crown = new THREE.Mesh(crownGeo, material);
        crown.position.y = 0.88;
        crown.castShadow = true;
        group.add(crown);

        // Crown tip sphere
        const tipGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const tip = new THREE.Mesh(tipGeo, material);
        tip.position.y = 1.0;
        tip.castShadow = true;
        group.add(tip);
      } 
      else if (type === 'king') {
        // Body stem
        const bodyGeo = new THREE.CylinderGeometry(0.15, 0.26, 0.72, 16);
        const body = new THREE.Mesh(bodyGeo, material);
        body.position.y = 0.46;
        body.castShadow = true;
        group.add(body);

        // Crown collar
        const collarGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16);
        const collar = new THREE.Mesh(collarGeo, material);
        collar.position.y = 0.82;
        collar.castShadow = true;
        group.add(collar);

        // Crown dome
        const domeGeo = new THREE.CylinderGeometry(0.26, 0.18, 0.22, 16);
        const dome = new THREE.Mesh(domeGeo, material);
        dome.position.y = 0.93;
        dome.castShadow = true;
        group.add(dome);

        // Cross at top
        const crossGroup = new THREE.Group();
        crossGroup.position.set(0, 1.1, 0);

        const vBarGeo = new THREE.BoxGeometry(0.05, 0.18, 0.05);
        const vBar = new THREE.Mesh(vBarGeo, material);
        vBar.castShadow = true;
        crossGroup.add(vBar);

        const hBarGeo = new THREE.BoxGeometry(0.14, 0.05, 0.05);
        const hBar = new THREE.Mesh(hBarGeo, material);
        hBar.position.y = 0.03;
        hBar.castShadow = true;
        crossGroup.add(hBar);

        group.add(crossGroup);
      }

      return group;
    };

    // --- Place Pieces on Board ---
    interface PieceSetup {
      type: string;
      color: 'white' | 'black';
      x: number;
      z: number;
    }

    const piecesSetup: PieceSetup[] = [
      // White pieces
      { type: 'king', color: 'white', x: 4, z: 0 },
      { type: 'rook', color: 'white', x: 7, z: 0 },
      { type: 'bishop', color: 'white', x: 2, z: 3 },
      { type: 'knight', color: 'white', x: 5, z: 2 },
      { type: 'pawn', color: 'white', x: 4, z: 3 },
      { type: 'pawn', color: 'white', x: 3, z: 2 },
      { type: 'pawn', color: 'white', x: 2, z: 1 },

      // Black pieces
      { type: 'king', color: 'black', x: 4, z: 7 },
      { type: 'queen', color: 'black', x: 3, z: 5 },
      { type: 'knight', color: 'black', x: 2, z: 5 },
      { type: 'pawn', color: 'black', x: 4, z: 4 },
      { type: 'pawn', color: 'black', x: 3, z: 4 },
      { type: 'pawn', color: 'black', x: 2, z: 6 },
      { type: 'bishop', color: 'black', x: 4, z: 6 },
    ];

    // Keep references to specific meshes for animations
    let animatedKnight: THREE.Group | null = null;
    let animatedKing: THREE.Group | null = null;
    let animatedQueen: THREE.Group | null = null;

    // Track baseline positions
    let knightBaseRotY = 0;
    let kingBaseZ = 0;
    let queenBaseY = 0;

    piecesSetup.forEach((p) => {
      const pieceMesh = createPiece(p.type, p.color);
      const px = (p.x - halfBoard) * squareSize;
      const pz = (p.z - halfBoard) * squareSize;
      pieceMesh.position.set(px, 0.04, pz);
      boardGroup.add(pieceMesh);

      // Store specific reference
      if (p.type === 'knight' && p.color === 'white' && p.x === 5 && p.z === 2) {
        animatedKnight = pieceMesh;
        knightBaseRotY = pieceMesh.rotation.y;
      }
      if (p.type === 'king' && p.color === 'white' && p.x === 4 && p.z === 0) {
        animatedKing = pieceMesh;
        kingBaseZ = pz;
      }
      if (p.type === 'queen' && p.color === 'black' && p.x === 3 && p.z === 5) {
        animatedQueen = pieceMesh;
        queenBaseY = pieceMesh.position.y;
      }
    });

    // --- Base Board Rotation and Tilt ---
    // The requested rotation: slightly rotated, not flat
    const baseRotationX = Math.PI / 4.2; // approx 43 degrees
    const baseRotationY = -Math.PI / 5.5; // approx -32 degrees
    boardGroup.rotation.x = baseRotationX;
    boardGroup.rotation.y = baseRotationY;

    // --- Mouse Move Event Listener ---
    const handleMouseMove = (event: MouseEvent) => {
      // Calculate normalized mouse coords (-1 to 1)
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      mouseRef.current = { x, y };
      // Tilt max 2 degrees (approx 0.035 radians)
      targetTiltRef.current = {
        x: y * 0.035,
        y: x * 0.035,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- Window Resize Event Listener ---
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // --- Render and Animation Loop ---
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();

      // 1. Camera Slow Panning Animation (Left -> Center -> Right -> Center, 35s cycle)
      const cameraPanCycle = 35; // seconds
      const panAngle = Math.sin((time * Math.PI * 2) / cameraPanCycle) * 0.25; // max 14 degrees
      
      // Update camera position based on slow panning
      const dynamicRadius = radius;
      camera.position.x = Math.sin(panAngle) * dynamicRadius;
      camera.position.z = Math.cos(panAngle) * dynamicRadius;
      camera.lookAt(0, 0.2, 0);

      // 2. Mouse Move Tilting (Lerped for ultra-smooth inertia)
      const lerpFactor = 0.06;
      currentTiltRef.current.x += (targetTiltRef.current.x - currentTiltRef.current.x) * lerpFactor;
      currentTiltRef.current.y += (targetTiltRef.current.y - currentTiltRef.current.y) * lerpFactor;

      // Apply base rotation + mouse tilt
      boardGroup.rotation.x = baseRotationX + currentTiltRef.current.x;
      boardGroup.rotation.y = baseRotationY + currentTiltRef.current.y;

      // 3. Very Slow Periodic Chess Piece Animations (Every 8 seconds)
      const animationCycle = 8.0; // seconds
      const localTime = time % animationCycle;

      // Reset positions to default before animations trigger
      if (animatedKnight) animatedKnight.rotation.y = knightBaseRotY;
      if (animatedKing) animatedKing.position.z = kingBaseZ;
      if (animatedQueen) animatedQueen.position.y = queenBaseY;

      // --- Knight rotation (first 2 seconds of the 8s cycle) ---
      if (localTime < 2.0 && animatedKnight) {
        // smooth sin curve up and down
        const progress = Math.sin((localTime / 2.0) * Math.PI);
        const rotYDelta = progress * (2.0 * Math.PI / 180.0); // 2 degrees
        animatedKnight.rotation.y = knightBaseRotY + rotYDelta;
      }

      // --- King moves 2px forward & back (seconds 2.5 to 4.5) ---
      if (localTime >= 2.5 && localTime < 4.5 && animatedKing) {
        const progress = Math.sin(((localTime - 2.5) / 2.0) * Math.PI);
        // 2px out of 100px square is roughly 0.02 units
        const moveDelta = progress * 0.03;
        animatedKing.position.z = kingBaseZ + moveDelta;
      }

      // --- Queen floats 1px up & down (seconds 5.0 to 7.0) ---
      if (localTime >= 5.0 && localTime < 7.0 && animatedQueen) {
        const progress = Math.sin(((localTime - 5.0) / 2.0) * Math.PI);
        const floatDelta = progress * 0.02;
        animatedQueen.position.y = queenBaseY + floatDelta;
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);

      // Recursive disposal
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[350px] md:min-h-[500px] cursor-grab active:cursor-grabbing relative"
    />
  );
};
