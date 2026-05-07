import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Modal, FlatList, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_URL } from '../constants/API';

export default function AdminScreen() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados reales vinculados a la DB
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productImage, setProductImage] = useState('');
  const [isPickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uRes, cRes, aRes, pRes] = await Promise.all([
        fetch(`${API_URL}/users`),
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/config/admin_email`),
        fetch(`${API_URL}/config/admin_password`)
      ]);
      const [uData, cData, aData, pData] = await Promise.all([
        uRes.json(), cRes.json(), aRes.json(), pRes.json()
      ]);
      setUsers(uData);
      setCategories(cData.map(c => c.name));
      setAdminEmail(aData.admin_email);
      setAdminPassword(pData.admin_password);
    } catch (e) {
      alert('Error conectando con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/config/test_email`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        alert('Email de prueba enviado con éxito a ' + adminEmail);
      } else {
        throw new Error(data.message);
      }
    } catch (e) {
      alert('Error en la prueba: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await fetch(`${API_URL}/config/email_credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target_email: adminEmail,
          admin_email: adminEmail,
          admin_password: adminPassword
        })
      });
      alert('Configuración guardada correctamente');
    } catch (e) { alert('Error al guardar'); }
  };

  const handleAddUser = async () => {
    if (newUserUsername && (newUserPassword || editingUserId)) {
      try {
        if (editingUserId) {
          // Lógica de edición
          alert('Funcionalidad de edición pendiente en el server');
        } else {
          const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: newUserUsername, password: newUserPassword })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.message);
          alert(`Usuario ${newUserUsername} creado.`);
        }
        setNewUserUsername('');
        setNewUserPassword('');
        setEditingUserId(null);
        fetchData();
      } catch (e) { alert(e.message); }
    }
  };

  const handleDeleteUser = async (id) => {
    Alert.alert("Eliminar", "¿Seguro?", [
      { text: "No" },
      { text: "Sí", onPress: async () => {
        await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
        fetchData();
      }}
    ]);
  };

  const handleAddCategory = async () => {
    if (newCategory) {
      try {
        const res = await fetch(`${API_URL}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategory })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setNewCategory('');
        fetchData();
      } catch (e) { alert(e.message); }
    }
  };

  const handleAddProduct = async () => {
    if (productName && productCategory) {
      await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: productName, category_name: productCategory, image: productImage })
      });
      alert(`Producto "${productName}" añadido.`);
      setProductName('');
      setProductImage('');
      fetchData();
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Reducimos calidad para que no pese tanto en la DB
      base64: true,
    });

    if (!result.canceled) {
      // Guardamos la imagen como Base64 para que se guarde en el SQLite
      setProductImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Panel de Administrador</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Email Settings Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="email-cog" size={24} color="#10B981" />
            <Text style={styles.cardTitle}>Configuración de Correo</Text>
          </View>
          
          <View style={styles.manualContainer}>
            <Text style={styles.manualTitle}>Manual de configuración:</Text>
            <Text style={styles.manualText}>1.- Entra en "Gestionar tu cuenta de Google"</Text>
            <Text style={styles.manualText}>2.- En el buscador busca "Contraseñas de aplicación"</Text>
            <Text style={styles.manualText}>3.- Crea una nueva específica para esta App.</Text>
            <Text style={styles.manualText}>4.- Pega la contraseña de 16 letras y tu Gmail abajo.</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Gmail:</Text>
            <TextInput
              style={styles.input}
              placeholder="tu-correo@gmail.com"
              value={adminEmail}
              onChangeText={setAdminEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña de Aplicación:</Text>
            <TextInput
              style={styles.input}
              placeholder="xxxx xxxx xxxx xxxx"
              value={adminPassword}
              onChangeText={setAdminPassword}
              secureTextEntry
            />
          </View>
          
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#10B981', flex: 1 }]} onPress={handleSaveConfig}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#3B82F6', flex: 1 }]} onPress={handleTestEmail}>
              <Text style={styles.buttonText}>Probar Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="tag-multiple" size={24} color="#F59E0B" />
            <Text style={styles.cardTitle}>Gestión de Categorías</Text>
          </View>
          <Text style={styles.description}>
            Añade nuevas categorías al catálogo.
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nueva categoría"
              value={newCategory}
              onChangeText={setNewCategory}
            />
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#F59E0B' }]} onPress={handleAddCategory}>
            <Text style={styles.buttonText}>Añadir Categoría</Text>
          </TouchableOpacity>
          
          <View style={styles.pillContainer}>
            {categories.map((cat, index) => (
              <View key={index} style={styles.pill}>
                <Text style={styles.pillText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Products Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="package-variant-closed" size={24} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Gestión de Productos</Text>
          </View>
          <Text style={styles.description}>
            Crea nuevos productos dentro de las categorías existentes.
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nombre del producto"
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          <TouchableOpacity 
            style={styles.inputContainer} 
            onPress={() => setPickerVisible(true)}
          >
            <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <Text style={[styles.input, { paddingTop: 12 }]}>
              {productCategory || "Seleccionar categoría"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            {productImage ? (
              <Image source={{ uri: productImage }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="camera-plus" size={32} color="#9CA3AF" />
                <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Añadir foto del producto</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: '#8B5CF6' }]} onPress={handleAddProduct}>
            <Text style={styles.buttonText}>Añadir Producto</Text>
          </TouchableOpacity>
        </View>

        {/* User Management Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account-group" size={24} color="#3B82F6" />
            <Text style={styles.cardTitle}>{editingUserId ? 'Editar Usuario' : 'Crear/Ver Usuarios'}</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nombre de usuario"
              value={newUserUsername}
              onChangeText={setNewUserUsername}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={editingUserId ? "Nueva contraseña (opcional)" : "Contraseña"}
              value={newUserPassword}
              onChangeText={setNewUserPassword}
              secureTextEntry
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.button, styles.buttonBlue, { flex: 1 }]} onPress={handleAddUser}>
              <Text style={styles.buttonText}>{editingUserId ? 'Actualizar' : 'Crear Usuario'}</Text>
            </TouchableOpacity>
            {editingUserId && (
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#6B7280', paddingHorizontal: 15 }]} 
                onPress={() => { setEditingUserId(null); setNewUserUsername(''); setNewUserPassword(''); }}
              >
                <Text style={styles.buttonText}>X</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10, color: '#4B5563' }}>Lista de Usuarios:</Text>
            {users.map((user) => (
              <View key={user.id} style={styles.userRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{user.username}</Text>
                  <Text style={styles.userRole}>{user.role}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  <TouchableOpacity onPress={() => {/* logic pending */}} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="pencil" size={18} color="#3B82F6" />
                  </TouchableOpacity>
                  {user.role !== 'Admin' && (
                    <TouchableOpacity onPress={() => handleDeleteUser(user.id)} style={styles.actionBtn}>
                      <MaterialCommunityIcons name="trash-can" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Modal para el selector de categorías */}
      <Modal
        visible={isPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.pickerItem} 
                  onPress={() => {
                    setProductCategory(item);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    productCategory === item && { color: '#10B981', fontWeight: 'bold' }
                  ]}>
                    {item}
                  </Text>
                  {productCategory === item && (
                    <MaterialCommunityIcons name="check" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 10,
  },
  description: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  manualContainer: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  manualTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
  },
  manualText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
  },
  pill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: {
    color: '#D97706',
    fontWeight: '600',
    fontSize: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userEmail: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  userRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionBtn: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#4B5563',
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  buttonBlue: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePickerButton: {
    width: '100%',
    height: 180,
    backgroundColor: '#F9FAFB',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
  }
});
