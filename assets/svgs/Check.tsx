import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface Props extends SvgProps {
  width?: number;
  color?: string;
}

export function Check({ color, width = 13, ...rest }: Props) {
  const height = (10 / 13) * width;

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 13 10"
      fill="none"
      {...rest}
    >
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="m2 5 3 3 6-6"
      />
    </Svg>
  );
}
