import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box } from "@react-three/drei";

export default function HumanBodyModel({ onPartClick }) {
  // Using a simplified blocky avatar to represent a human due to missing glTF model.
  return (
    <div className="h-[400px] w-full rounded-2xl bg-slate-900 border border-slate-700 relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 text-white pointer-events-none">
        <p className="text-sm font-semibold opacity-70">Interactive 3D Triage</p>
        <p className="text-xs text-slate-400">Click a body part to select pain region</p>
      </div>
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Head */}
        <Box 
          args={[0.8, 0.8, 0.8]} 
          position={[0, 2.5, 0]} 
          onClick={(e) => { e.stopPropagation(); onPartClick("Head"); }}
        >
          <meshStandardMaterial color="#60a5fa" />
        </Box>
        
        {/* Torso */}
        <Box 
          args={[1.4, 2, 0.7]} 
          position={[0, 1, 0]} 
          onClick={(e) => { e.stopPropagation(); onPartClick("Torso/Chest"); }}
        >
          <meshStandardMaterial color="#3b82f6" />
        </Box>

        {/* Left Arm */}
        <Box 
          args={[0.4, 1.8, 0.4]} 
          position={[-1, 1, 0]} 
          onClick={(e) => { e.stopPropagation(); onPartClick("Left Arm"); }}
        >
          <meshStandardMaterial color="#93c5fd" />
        </Box>

        {/* Right Arm */}
        <Box 
          args={[0.4, 1.8, 0.4]} 
          position={[1, 1, 0]} 
          onClick={(e) => { e.stopPropagation(); onPartClick("Right Arm"); }}
        >
          <meshStandardMaterial color="#93c5fd" />
        </Box>

        {/* Left Leg */}
        <Box 
          args={[0.5, 2, 0.5]} 
          position={[-0.4, -1, 0]} 
          onClick={(e) => { e.stopPropagation(); onPartClick("Left Leg"); }}
        >
          <meshStandardMaterial color="#2563eb" />
        </Box>

        {/* Right Leg */}
        <Box 
          args={[0.5, 2, 0.5]} 
          position={[0.4, -1, 0]} 
          onClick={(e) => { e.stopPropagation(); onPartClick("Right Leg"); }}
        >
          <meshStandardMaterial color="#2563eb" />
        </Box>

        <OrbitControls enableZoom={true} enablePan={false} />
      </Canvas>
    </div>
  );
}
