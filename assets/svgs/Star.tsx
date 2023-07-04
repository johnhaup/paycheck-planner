import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

interface Props extends SvgProps {
  size?: number;
  color?: string;
}

export function Star({ color, size = 18, ...rest }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" {...rest}>
      <Path
        fill={color}
        d="M13.932 10.434a.917.917 0 0 0-.266.808l.741 4.1a.9.9 0 0 1-.375.9.917.917 0 0 1-.975.066l-3.69-1.925a.943.943 0 0 0-.417-.109h-.226a.678.678 0 0 0-.225.075l-3.692 1.934a.973.973 0 0 1-.591.092.926.926 0 0 1-.742-1.059l.742-4.1a.932.932 0 0 0-.266-.816L.94 7.483a.9.9 0 0 1-.224-.941.936.936 0 0 1 .741-.625L5.6 5.316a.927.927 0 0 0 .733-.507l1.825-3.742c.044-.084.1-.16.167-.225l.075-.059a.56.56 0 0 1 .134-.108l.09-.033.143-.059h.35c.314.033.59.22.734.5l1.849 3.726a.926.926 0 0 0 .692.507l4.141.6c.35.05.643.292.759.626.109.334.015.7-.242.942l-3.117 2.95Z"
      />
    </Svg>
  );
}
