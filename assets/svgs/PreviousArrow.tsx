import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

interface Props extends SvgProps {
  size?: number;
  color?: string;
}

export function PreviousArrow({ color, size = 20, ...rest }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        fill={color}
        fillRule="evenodd"
        d="M11.47 9.994V9.7c-.01-1.17-.081-2.214-.203-2.876 0-.012-.133-.668-.217-.887a1.571 1.571 0 0 0-.674-.753A1.667 1.667 0 0 0 9.618 5c-.208.01-.55.114-.796.202l-.203.078c-1.347.535-3.923 2.284-4.909 3.353l-.073.075-.324.35a1.547 1.547 0 0 0-.313.948c0 .316.096.632.29.887.057.083.15.189.232.278l.316.331C4.925 12.604 7.28 14.148 8.5 14.66c0 .011.758.328 1.12.34h.047c.554 0 1.071-.316 1.336-.826.072-.14.141-.413.194-.653l.095-.453c.108-.73.18-1.847.18-3.074Zm5.277 1.271C17.44 11.265 18 10.7 18 10c0-.698-.56-1.265-1.253-1.265l-3.082.273a.987.987 0 0 0-.983.992c0 .548.44.993.983.993l3.082.272Z"
        clipRule="evenodd"
      />
    </Svg>
  );
}
