import React, { ComponentType, ReactNode } from 'react';

type Components =
  | ComponentType<any>
  | [ComponentType<any>, { [key: string]: any }];

interface Props {
  components: Components[];
  children: ReactNode;
}

/**
 * Helper component for nesting components within each other.
 * Useful for listing Providers in the application root component.
 */
export default function Compose({ components, children }: Props) {
  return components.reverse().reduce((children, current) => {
    const [Component, props] = Array.isArray(current)
      ? [current[0], current[1]]
      : [current, {}];
    return <Component {...props}>{children}</Component>;
  }, children) as JSX.Element;
}
