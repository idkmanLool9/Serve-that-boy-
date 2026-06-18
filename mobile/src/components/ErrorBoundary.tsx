import React from 'react';
import { Text, View } from 'react-native';

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes so the app shows a readable message instead of a
 * blank, unresponsive page (especially important on the web build).
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('App crashed:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backgroundColor: '#0F1018',
          }}
        >
          <Text style={{ fontSize: 40, marginBottom: 12 }}>😕</Text>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>
            Er ging iets mis
          </Text>
          <Text style={{ color: '#9A9BAA', textAlign: 'center', marginTop: 8 }}>
            Probeer de pagina te verversen. Als het probleem blijft, laat het ons weten.
          </Text>
          <Text style={{ color: '#5A5B6A', textAlign: 'center', marginTop: 16, fontSize: 12 }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}
