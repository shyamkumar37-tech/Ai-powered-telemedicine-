declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      directionalLight: any;
      meshStandardMaterial: any;
    }
  }
}
/// <reference types="@react-three/fiber" />
import { useLanguage } from "../../context/LanguageContext";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box } from "@react-three/drei";
import { DynamicStateObject } from "./../../types/DynamicState";

export interface HumanBodyModelProps {
  onPartClick?: (...args: DynamicStateObject[]) => void;
    [key: string]: ReturnType<typeof JSON.parse>;
}

const AmbientLight = 'ambientLight' as any;
const DirectionalLight = 'directionalLight' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;

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
        <AmbientLight as any intensity={0.5} />
        <DirectionalLight as any position={[10, 10, 5]} intensity={1} />
        
        {/* Head */}
        <Box 
          args={[0.8, 0.8, 0.8]} 
          position={[0, 2.5, 0]}
          onClick={(e: any) => { e.stopPropagation(); onPartClick?.("Head"); }}
        >
          <MeshStandardMaterial as any color="#60a5fa" />
        </Box>
        
        {/* Torso */}
        <Box 
          args={[1.4, 2, 0.7]} 
          position={[0, 1, 0]}
          onClick={(e: any) => { e.stopPropagation(); onPartClick?.("Torso/Chest"); }}
        >
          <MeshStandardMaterial as any color="#3b82f6" />
        </Box>

        {/* Left Arm */}
        <Box 
          args={[0.4, 1.8, 0.4]} 
          position={[-1, 1, 0]}
          onClick={(e: any) => { e.stopPropagation(); onPartClick?.("Left Arm"); }}
        >
          <MeshStandardMaterial as any color="#93c5fd" />
        </Box>

        {/* Right Arm */}
        <Box 
          args={[0.4, 1.8, 0.4]} 
          position={[1, 1, 0]}
          onClick={(e: any) => { e.stopPropagation(); onPartClick?.("Right Arm"); }}
        >
          <MeshStandardMaterial as any color="#93c5fd" />
        </Box>

        {/* Left Leg */}
        <Box 
          args={[0.5, 2, 0.5]} 
          position={[-0.4, -1, 0]}
          onClick={(e: any) => { e.stopPropagation(); onPartClick?.("Left Leg"); }}
        >
          <MeshStandardMaterial as any color="#2563eb" />
        </Box>

        {/* Right Leg */}
        <Box 
          args={[0.5, 2, 0.5]} 
          position={[0.4, -1, 0]}
          onClick={(e: any) => { e.stopPropagation(); onPartClick?.("Right Leg"); }}
        >
          <MeshStandardMaterial as any color="#2563eb" />
        </Box>

        <OrbitControls enableZoom={true} enablePan={false} />
      </Canvas>
    </div>
  );
}
