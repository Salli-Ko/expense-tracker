import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';

const Body = ({ children }: PropsWithChildren) => {
  return (
    <View className="bg-light-background dark:bg-dark-background rounded-t-3xl -mt-4 pt-6 px-4">
      {children}
    </View>
  );
};

export default Body;
