import { DynamicState } from "./../../types/DynamicState";
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export interface TrendSparklineProps {
  data?: DynamicState;
  dataKey?: DynamicState;
  color?: DynamicState;
  width?: DynamicState;
  height?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function TrendSparkline({ data, dataKey = 'value', color = '#2DD4BF', width = '100%', height = 40 }: TrendSparklineProps) {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
