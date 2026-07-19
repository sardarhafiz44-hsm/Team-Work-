import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Icosahedron, Sphere } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import useStore from '../store/useStore';

const SPLASH_KEY = 'solshield_splashed';
const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const ParticleBackground = () => {
  const COUNT = 3000;
  const positions = useMemo(() => {
    const p = new Float32Array(COUNT * 3);
    for (let i = 0; i < p.length; i++) p[i] = (Math.random() - 0.5) * 20;
    return p;
  }, []);
  const ref = useRef();
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y -= delta * 0.03;
    ref.current.position.y -= delta * 0.15;
    if (ref.current.position.y < -5) ref.current.position.y = 5;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#00D4FF" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
};

const ShatterExplosion = () => {
  const COUNT = 1500;
  const LIFETIME = 1.5;
  const ref = useRef();
  const elapsed = useRef(0);
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const speed = 3 + Math.random() * 5;
      pos.set([dir.x * 0.5, dir.y * 0.5, dir.z * 0.5], i * 3);
      vel.set([dir.x * speed, dir.y * speed, dir.z * speed], i * 3);
    }
    return { positions: pos, velocities: vel };
  }, []);
  
  useFrame((_, delta) => {
    if (!ref.current || elapsed.current >= LIFETIME) return;
    elapsed.current += delta;
    const t = Math.min(elapsed.current / LIFETIME, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const attr = ref.current.geometry.attributes.position;
    for (let i = 0; i < COUNT * 3; i++) attr.array[i] = positions[i] + velocities[i] * ease * 1.2;
    attr.needsUpdate = true;
    ref.current.material.opacity = Math.max(0, 1 - t);
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions.slice()} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#00D4FF" transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

const SentinelEye = ({ isShattering }) => {
  const group = useRef();
  useFrame((state) => {
    if (isShattering || !group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.02);
    group.current.rotation.y += 0.005;
  });
  if (isShattering) return <ShatterExplosion />;
  return (
    <group ref={group}>
      <pointLight color="#00D4FF" intensity={2} distance={5} />
      <Icosahedron args={[1.8, 1]} wireframe><meshBasicMaterial color="#00D4FF" transparent opacity={0.15} /></Icosahedron>
      <Sphere args={[0.7, 32, 32]}><meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={1.2} transparent opacity={0.8} /></Sphere>
    </group>
  );
};

const CameraRig = ({ isShattering }) => {
  const { camera } = useThree();
  const target = isShattering ? 14 : 6;
  useFrame(() => {
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, target, 0.05);
    camera.updateProjectionMatrix();
  });
  return null;
};

const SplashScreen = () => {
  const login = useStore((s) => s.login);
  const { isConnected } = useAccount();
  const alreadySplashed = typeof window !== 'undefined' && sessionStorage.getItem(SPLASH_KEY) === '1';
  const [isShattering, setIsShattering] = useState(false);

  const completeLogin = () => {
    try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch (_) {}
    login();
  };

  useEffect(() => {
    if (alreadySplashed) completeLogin();
  }, []);

  const playThenLogin = () => {
    if (isShattering) return;
    setIsShattering(true);
    setTimeout(completeLogin, prefersReducedMotion ? 100 : 1600);
  };

  useEffect(() => {
    if (isConnected) playThenLogin();
  }, [isConnected]);

  if (alreadySplashed) return null;

  return (
    <div className="relative w-screen h-screen bg-[#050B14] overflow-hidden flex flex-col items-center justify-center">
      <style>{`
        .cyber-grid-bg {
          position: absolute; bottom: -50%; left: -50%; width: 200%; height: 200%;
          background-image: linear-gradient(rgba(0, 212, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.04) 1px, transparent 1px);
          background-size: 50px 50px; transform: perspective(600px) rotateX(75deg);
          animation: gridMove 12s linear infinite; pointer-events: none;
        }
        @keyframes gridMove {
          0% { transform: perspective(600px) rotateX(75deg) translateY(0); }
          100% { transform: perspective(600px) rotateX(75deg) translateY(50px); }
        }
        .neon-pulse-box { box-shadow: 0 0 20px rgba(0, 212, 255, 0.15); }
      `}</style>

      <div className="cyber-grid-bg" />
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 60 }} gl={{ antialias: true }}>
          <ambientLight intensity={0.4} />
          <CameraRig isShattering={isShattering} />
          <ParticleBackground />
          <SentinelEye isShattering={isShattering} />
        </Canvas>
      </div>

      <AnimatePresence>
        {!isShattering && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, filter: 'blur(4px)' }} transition={{ duration: 0.5 }} className="relative z-10 flex flex-col items-center mt-64 pointer-events-none">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00D4FF] to-white mb-2">SOLSHIELD PRO</h1>
              <p className="text-[#00D4FF] font-mono text-sm tracking-[0.2em] uppercase opacity-70">AI-Powered Smart Contract Auditing Suite</p>
            </div>
            <div className="pointer-events-auto rounded-xl flex flex-col items-center gap-5 bg-[#090D16]/90 backdrop-blur-md p-6 border border-white/[0.05] neon-pulse-box">
              <ConnectButton />
              <button onClick={playThenLogin} className="text-xs text-white/40 font-mono tracking-[0.18em] uppercase hover:text-[#00D4FF] transition-colors">[ Developer bypass — skip to dashboard ]</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default SplashScreen;