module.exports = {
  assets: ['./assets/fonts/'],
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null, // for weird Xcode BS (Avoid duplicate ttf error) 
      },
    },
  },
};