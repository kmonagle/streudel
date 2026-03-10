import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShare } from '../src/contexts/ShareContext';

export default function CaptureScreen() {
  const { text, source } = useLocalSearchParams<{ text?: string; source?: string }>();
  const { setSharedContent } = useShare();
  const router = useRouter();

  useEffect(() => {
    console.log('📱 Capture screen mounted');
    console.log('📱 Text:', text);
    console.log('📱 Source:', source);

    if (text) {
      console.log('📱 Processing capture...');
      setSharedContent(text, source).then(() => {
        console.log('📱 Capture processed successfully');
      });
    } else {
      console.log('❌ No text provided, redirecting to My Stuff');
      router.replace('/(tabs)/mystuff');
    }
  }, [text, source]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Processing shared content...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
