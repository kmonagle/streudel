import React from 'react';
import { Text, StyleSheet, Linking, Alert, TextStyle } from 'react-native';

interface ClickableTextProps {
  text: string;
  style?: TextStyle;
  numberOfLines?: number;
  linkColor?: string;
}

export default function ClickableText({ text, style, numberOfLines, linkColor = '#0a7ea4' }: ClickableTextProps) {
  // Enhanced URL regex that matches:
  // - http:// and https:// URLs
  // - App URL schemes (bear://, obsidian://, notion://, etc.)
  // - www. URLs
  const urlRegex = /(?:(?:https?|[a-zA-Z][a-zA-Z0-9+.-]*):\/\/|www\.)[^\s]+|[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s]+/gi;

  const handleLinkPress = async (url: string) => {
    try {
      // Add https:// to www. links
      let fullUrl = url;
      if (url.startsWith('www.')) {
        fullUrl = 'https://' + url;
      }

      const canOpen = await Linking.canOpenURL(fullUrl);

      if (canOpen) {
        await Linking.openURL(fullUrl);
      } else {
        // If the URL scheme isn't supported, show a helpful message
        Alert.alert(
          'Cannot Open Link',
          `This link uses a URL scheme that may require an app to be installed.\n\nURL: ${fullUrl}`
        );
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Unable to open this link');
    }
  };

  const parseTextWithLinks = () => {
    const matches = Array.from(text.matchAll(urlRegex));

    if (matches.length === 0) {
      // No URLs found, return plain text
      return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      const url = match[0];
      const startIndex = match.index!;

      // Add text before the URL
      if (startIndex > lastIndex) {
        elements.push(
          <Text key={`text-${index}`} style={style}>
            {text.substring(lastIndex, startIndex)}
          </Text>
        );
      }

      // Add the clickable URL
      elements.push(
        <Text
          key={`link-${index}`}
          style={[style, styles.link, { color: linkColor }]}
          onPress={() => handleLinkPress(url)}
        >
          {url}
        </Text>
      );

      lastIndex = startIndex + url.length;
    });

    // Add remaining text after the last URL
    if (lastIndex < text.length) {
      elements.push(
        <Text key="text-end" style={style}>
          {text.substring(lastIndex)}
        </Text>
      );
    }

    return (
      <Text numberOfLines={numberOfLines}>
        {elements}
      </Text>
    );
  };

  return parseTextWithLinks();
}

const styles = StyleSheet.create({
  link: {
    textDecorationLine: 'underline',
  },
});
