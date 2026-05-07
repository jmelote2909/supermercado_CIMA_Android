import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Dimensions, SafeAreaView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../constants/API';

const { width } = Dimensions.get('window');

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    try {
      // Obtenemos las credenciales configuradas en el servidor para comparar
      const [userRes, passRes] = await Promise.all([
        fetch(`${API_URL}/config/admin_user`),
        fetch(`${API_URL}/config/admin_pass`)
      ]);
      
      const userData = await userRes.json();
      const passData = await passRes.json();
      
      if (email === userData.admin_user && password === passData.admin_pass) {
        router.replace('/admin');
      } else {
        alert('Credenciales de administrador incorrectas');
      }
    } catch (error) {
      alert('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#000000']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFF" />
        </TouchableOpacity>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="shield-account" size={60} color="#F59E0B" />
            </View>
            <Text style={styles.title}>Panel Admin</Text>
            <Text style={styles.subtitle}>Acceso restringido</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={24} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Administrador"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={24} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleAdminLogin}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Entrar como Admin</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 20,
    height: 60,
    borderWidth: 1,
    borderColor: '#374151',
  },
  inputIcon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 16,
  },
  button: {
    height: 60,
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 10,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
