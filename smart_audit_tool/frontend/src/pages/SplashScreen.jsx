import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Icosahedron, Sphere, OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

// =====================================================
// PARTICLE SYSTEM — 4000 floating cyber particles
// =====================================================
const ParticleBackground = () => {
  const COUNT = 4000;
  const positions = useMemo(() => {
    const p = new Float32Array(COUNT * 3);
    for (let i = 0; i < p.length; i++) {
      p[i] = (Math.random() - 0.5) * 25;
    }
    return p;
  }, []);
  const ref = useRef();
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y -= delta * 0.02;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#00D4FF" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
};

// =====================================================
// THE SENTINEL EYE — 3D Cinematic Cyber Eye
// =====================================================
const SentinelEye = () => {
  const group = useRef();
  const irisRef = useRef();
  const pupilRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();

    // Slow rotation
    group.current.rotation.y = Math.sin(t * 0.3) * 0.3;
    group.current.rotation.x = Math.sin(t * 0.2) * 0.1;

    // Iris pulse
    if (irisRef.current) {
      irisRef.current.material.emissiveIntensity = 1.5 + Math.sin(t * 2) * 0.5;
    }

    // Pupil scale
    if (pupilRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.1;
      pupilRef.current.scale.set(s, s, s);
    }

    // Glow pulse
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.3 + Math.sin(t * 1.5) * 0.2;
    }
  });

  return (
    <group ref={group}>
      {/* Outer wireframe shell */}
      <Icosahedron args={[2.5, 2]} wireframe>
        <meshBasicMaterial color="#00D4FF" transparent opacity={0.15} />
      </Icosahedron>

      {/* Eye white (sclera) */}
      <Sphere args={[1.8, 64, 64]}>
        <meshStandardMaterial color="#0a1628" emissive="#00D4FF" emissiveIntensity={0.1} transparent opacity={0.9} />
      </Sphere>

      {/* Iris ring */}
      <mesh ref={irisRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.35, 32, 100]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Inner iris detail */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.08, 16, 80]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>

      {/* Pupil */}
      <Sphere ref={pupilRef} args={[0.55, 32, 32]}>
        <meshStandardMaterial color="#000000" emissive="#ff0040" emissiveIntensity={0.8} />
      </Sphere>

      {/* Glow effect */}
      <Sphere ref={glowRef} args={[2.0, 32, 32]}>
        <meshBasicMaterial color="#00D4FF" transparent opacity={0.3} side={THREE.BackSide} />
      </Sphere>

      {/* Point light for glow */}
      <pointLight color="#00D4FF" intensity={3} distance={8} />
      <pointLight color="#ff0040" intensity={1} distance={4} position={[0, 0, 1]} />
    </group>
  );
};

// =====================================================
// SHATTER EXPLOSION — Transition effect
// =====================================================
const ShatterExplosion = () => {
  const COUNT = 2000;
  const LIFETIME = 1.8;
  const ref = useRef();
  const elapsed = useRef(0);
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      const speed = 4 + Math.random() * 6;
      pos.set([dir.x * 1, dir.y * 1, dir.z * 1], i * 3);
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
    for (let i = 0; i < COUNT * 3; i++) {
      attr.array[i] = positions[i] + velocities[i] * ease * 1.5;
    }
    attr.needsUpdate = true;
    ref.current.material.opacity = Math.max(0, 1 - t);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions.slice()} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#00D4FF"
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// =====================================================
// CAMERA RIG — Cinematic camera movement
// =====================================================
const CameraRig = ({ isShattering }) => {
  const { camera } = useThree();
  const target = isShattering ? 15 : 6;
  useFrame(() => {
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, target, 0.04);
    camera.updateProjectionMatrix();
  });
  return null;
};

// =====================================================
// MAIN SPLASH SCREEN COMPONENT
// =====================================================
const SplashScreen = ({ onEnter }) => {
  const [isShattering, setIsShattering] = useState(false);
  const [loadingText, setLoadingText] = useState('Initializing Sentinel Core...');
  const [progress, setProgress] = useState(0);

  // Simulate loading progress
  useEffect(() => {
    const messages = [
      'Initializing Sentinel Core...',
      'Loading neural audit matrices...',
      'Connecting to blockchain nodes...',
      'Activating AI threat detection...',
      'Synchronizing with Etherscan API...',
      'Calibrating CVSS scoring engine...',
      'Deploying autonomous agents...',
      'System ready. Welcome, Operator.'
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < messages.length) {
        setLoadingText(messages[i]);
        setProgress(((i + 1) / messages.length) * 100);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const handleSkip = () => {
    if (isShattering) return;
    setIsShattering(true);
    setTimeout(() => {
      if (onEnter) onEnter();
    }, 2000);
  };

  const handleConnectWallet = () => {
    // Simulate wallet connection
    handleSkip();
  };

  const handleConnectGitHub = () => {
    // Simulate GitHub connection
    handleSkip();
  };

  return (
    <div className="relative w-screen h-screen bg-[#050B14] overflow-hidden flex flex-col items-center justify-center">
      <style>{`
        .cyber-grid-bg {
          position: absolute;
          bottom: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background-image:
            linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          transform: perspective(800px) rotateX(75deg);
          animation: gridMove 15s linear infinite;
          pointer-events: none;
        }
        @keyframes gridMove {
          0% { transform: perspective(800px) rotateX(75deg) translateY(0); }
          100% { transform: perspective(800px) rotateX(75deg) translateY(60px); }
        }
        .neon-glow {
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 30px rgba(0, 212, 255, 0.1);
        }
        .cyber-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .cyber-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }
        .cyber-btn:hover::before {
          left: 100%;
        }
        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00D4FF, transparent);
          animation: scanLine 3s linear infinite;
          pointer-events: none;
        }
        @keyframes scanLine {
          0% { top: 0%; opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .pulse-ring {
          animation: pulse-ring 2s ease-out infinite;
        }
      `}</style>

      {/* Scan line effect */}
      <div className="scan-line" />

      {/* Cyber grid background */}
      <div className="cyber-grid-bg" />

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 60 }} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={0.3} />
          <CameraRig isShattering={isShattering} />
          <ParticleBackground />
          {!isShattering && <SentinelEye />}
          {isShattering && <ShatterExplosion />}
        </Canvas>
      </div>

      {/* Top branding */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-8 left-0 right-0 z-10 flex justify-center"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-[#00D4FF]/20 border border-[#00D4FF]/50 rounded-lg flex items-center justify-center">
              <span className="text-[#00D4FF] text-xl font-bold">S</span>
            </div>
            <div className="absolute inset-0 bg-[#00D4FF]/30 rounded-lg pulse-ring" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-[0.2em] text-white">
              SOL<span className="text-[#00D4FF]">SHIELD</span>
            </h1>
            <p className="text-[10px] font-mono tracking-[0.3em] text-[#00D4FF]/60 uppercase">
              AI-Powered Smart Contract Auditor
            </p>
          </div>
        </div>
      </motion.div>

      {/* Center content */}
      <AnimatePresence>
        {!isShattering && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, delay: 1 }}
            className="relative z-10 flex flex-col items-center gap-8 mt-32"
          >
            {/* Title */}
            <div className="text-center">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-5xl font-black tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00D4FF] to-white mb-3"
              >
                SENTINEL CORE
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="text-sm font-mono text-[#00D4FF]/70 tracking-[0.2em] uppercase"
              >
                Tri-Layered Hybrid Audit Engine Active
              </motion.p>
            </div>

            {/* Loading progress */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              transition={{ delay: 2, duration: 3 }}
              className="w-80"
            >
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-mono text-[#00D4FF]/60 uppercase tracking-wider">
                  System Status
                </span>
                <span className="text-[10px] font-mono text-[#00D4FF]">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00ff88] rounded-full"
                />
              </div>
              <p className="text-[11px] font-mono text-white/50 mt-2 text-center h-4">
                {loadingText}
              </p>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3 }}
              className="flex flex-col items-center gap-4 p-8 bg-[#090D16]/80 backdrop-blur-xl rounded-2xl border border-white/[0.08] neon-glow"
            >
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-2">
                Authenticate to Access Dashboard
              </p>

              {/* Connect Wallet */}
              <button
                onClick={handleConnectWallet}
                className="cyber-btn w-64 py-3 rounded-lg bg-gradient-to-r from-[#00D4FF]/20 to-[#00D4FF]/5 border border-[#00D4FF]/40 text-[#00D4FF] font-bold text-sm tracking-wider hover:from-[#00D4FF]/30 hover:to-[#00D4FF]/10 transition-all flex items-center justify-center gap-3"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
                CONNECT WALLET
              </button>

              {/* Connect GitHub */}
              <button
                onClick={handleConnectGitHub}
                className="cyber-btn w-64 py-3 rounded-lg bg-white/5 border border-white/20 text-white font-bold text-sm tracking-wider hover:bg-white/10 transition-all flex items-center justify-center gap-3"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                CONNECT GITHUB
              </button>

              {/* Divider */}
              <div className="w-full flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-mono text-white/30">OR</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Skip */}
              <button
                onClick={handleSkip}
                className="w-64 py-2.5 rounded-lg text-[11px] font-mono text-white/40 tracking-[0.15em] uppercase hover:text-[#00D4FF] transition-colors"
              >
                [ Developer bypass — skip to dashboard ]
              </button>
            </motion.div>

            {/* Bottom stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.5 }}
              className="flex gap-8 text-center"
            >
              <div>
                <p className="text-2xl font-bold text-[#00D4FF] font-mono">2.4M+</p>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Contracts Audited</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#00ff88] font-mono">99.7%</p>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Detection Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#ff0040] font-mono">24/7</p>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">AI Agents Active</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplashScreen;
