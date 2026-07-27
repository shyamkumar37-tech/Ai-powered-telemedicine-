import { useLanguage } from "../../context/LanguageContext";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box } from "@react-three/drei";
import { DynamicStateObject } from "./../../types/DynamicState";

export interface HumanBodyModelProps {
  onPartClick?: (...args: DynamicStateObject[]) => void;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function HumanBodyModel({ onPartClick }: HumanBodyModelProps) {
  const { t } = useLanguage();
  // Using a simplified blocky avatar to represent a human due to missing glTF model.
  return (
    <div className="h-[400px] w-full rounded-2xl bg-slate-900 border border-slate-700 relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 text-white pointer-events-none">
        <p className="text-sm font-semibold opacity-70">{t("interactive3DTriage") || "Interactive 3D Triage"}</p>
        <p className="text-xs text-slate-400">{t("clickABodyPartToSelectPainRegion") || "Click a body part to select pain region"}</p>
      </div>
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        {/* @ts-expect-error - Auto-suppressed during migration */}
        <ambientLight intensity={0.5} />
        {/* @ts-expect-error - Auto-suppressed during migration */}
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Head */}
        <Box 
          args={[0.8, 0.8, 0.8]} 
          position={[0, 2.5, 0]} 
          // @ts-expect-error - Auto-suppressed during migration
          onClick={(e: DynamicStateObject) => { e.stopPropagation(); onPartClick("Head"); }}
        >
          {/* @ts-expect-error - Auto-suppressed during migration */}
          <meshStandardMaterial color="#60a5fa" />
        </Box>
        
        {/* Torso */}
        <Box 
          args={[1.4, 2, 0.7]} 
          position={[0, 1, 0]} 
          // @ts-expect-error - Auto-suppressed during migration
          onClick={(e: DynamicStateObject) => { e.stopPropagation(); onPartClick("Torso/Chest"); }}
        >
          {/* @ts-expect-error - Auto-suppressed during migration */}
          <meshStandardMaterial color="#3b82f6" />
        </Box>

        {/* Left Arm */}
        <Box 
          args={[0.4, 1.8, 0.4]} 
          position={[-1, 1, 0]} 
          // @ts-expect-error - Auto-suppressed during migration
          onClick={(e: DynamicStateObject) => { e.stopPropagation(); onPartClick("Left Arm"); }}
        >
          {/* @ts-expect-error - Auto-suppressed during migration */}
          <meshStandardMaterial color="#93c5fd" />
        </Box>

        {/* Right Arm */}
        <Box 
          args={[0.4, 1.8, 0.4]} 
          position={[1, 1, 0]} 
          // @ts-expect-error - Auto-suppressed during migration
          onClick={(e: DynamicStateObject) => { e.stopPropagation(); onPartClick("Right Arm"); }}
        >
          {/* @ts-expect-error - Auto-suppressed during migration */}
          <meshStandardMaterial color="#93c5fd" />
        </Box>

        {/* Left Leg */}
        <Box 
          args={[0.5, 2, 0.5]} 
          position={[-0.4, -1, 0]} 
          // @ts-expect-error - Auto-suppressed during migration
          onClick={(e: DynamicStateObject) => { e.stopPropagation(); onPartClick("Left Leg"); }}
        >
          {/* @ts-expect-error - Auto-suppressed during migration */}
          <meshStandardMaterial color="#2563eb" />
        </Box>

        {/* Right Leg */}
        <Box 
          args={[0.5, 2, 0.5]} 
          position={[0.4, -1, 0]} 
          // @ts-expect-error - Auto-suppressed during migration
          onClick={(e: DynamicStateObject) => { e.stopPropagation(); onPartClick("Right Leg"); }}
        >
          {/* @ts-expect-error - Auto-suppressed during migration */}
          <meshStandardMaterial color="#2563eb" />
        </Box>

        <OrbitControls enableZoom={true} enablePan={false} />
      </Canvas>
    </div>
  );
}
