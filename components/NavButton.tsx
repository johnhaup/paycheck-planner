import { Link } from "expo-router";
import { LinkProps } from "expo-router/build/link/Link";
import React from "react";
import { Pressable, PressableProps } from "react-native";

interface Props extends PressableProps {
  href: LinkProps["href"];
}

export function NavButton({ href, ...rest }: Props) {
  return (
    <Link href={href} asChild>
      <Pressable {...rest} />
    </Link>
  );
}
