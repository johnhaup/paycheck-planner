import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

interface Props extends SvgProps {
  size?: number;
  color?: string;
}

export function NextArrow({ color, size = 20, ...rest }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        fill={color}
        fillRule="evenodd"
        d="M9.53 10.005v.296c.01 1.17.081 2.214.203 2.876 0 .012.133.668.217.887.133.316.373.584.674.753.24.121.493.183.758.183.208-.01.55-.114.796-.202l.203-.078c1.347-.535 3.923-2.284 4.909-3.353l.073-.075.324-.35c.205-.268.313-.596.313-.948 0-.316-.096-.632-.29-.887a2.988 2.988 0 0 0-.232-.279l-.316-.33C16.075 7.396 13.72 5.852 12.5 5.34c0-.011-.758-.328-1.12-.34h-.047c-.554 0-1.071.316-1.336.826-.072.14-.141.413-.194.653l-.095.453c-.108.73-.18 1.847-.18 3.073Zm-5.277-1.27C3.56 8.735 3 9.3 3 10c0 .698.56 1.264 1.253 1.264l3.082-.272A.987.987 0 0 0 8.318 10a.988.988 0 0 0-.983-.993l-3.082-.272Z"
        clipRule="evenodd"
      />
    </Svg>
  );
}
