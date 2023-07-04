import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

interface Props extends SvgProps {
  size?: number;
  color?: string;
}

export function CloseSquare({ color, size = 20, ...rest }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        fill={color}
        fillRule="evenodd"
        d="M8.002 13.114a.624.624 0 0 1-.442-1.067l3.993-3.993a.624.624 0 1 1 .884.883l-3.994 3.994a.62.62 0 0 1-.441.183Z"
        clipRule="evenodd"
      />
      <Path
        fill={color}
        fillRule="evenodd"
        d="M11.997 13.116a.62.62 0 0 1-.442-.183L7.56 8.936a.624.624 0 1 1 .883-.884l3.997 3.998a.624.624 0 0 1-.442 1.066Z"
        clipRule="evenodd"
      />
      <Path
        fill={color}
        fillRule="evenodd"
        d="M6.387 3.417c-2.108 0-3.47 1.444-3.47 3.68v6.806c0 2.236 1.362 3.68 3.47 3.68h7.224c2.109 0 3.472-1.444 3.472-3.68V7.097c0-2.236-1.363-3.68-3.471-3.68H6.386Zm7.224 15.416H6.387c-2.824 0-4.72-1.981-4.72-4.93V7.097c0-2.949 1.896-4.93 4.72-4.93h7.224c2.825 0 4.722 1.981 4.722 4.93v6.806c0 2.949-1.897 4.93-4.722 4.93Z"
        clipRule="evenodd"
      />
    </Svg>
  );
}
