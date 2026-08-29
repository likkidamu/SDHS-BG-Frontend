declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import type { ComponentType } from 'react';

  type Props = {
    name: string;
    size?: number;
    color?: string;
  };

  const MaterialCommunityIcons: ComponentType<Props>;
  export default MaterialCommunityIcons;
}
