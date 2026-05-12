import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Modal, FlatList, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_URL } from '../constants/API';

export default function AdminScreen() {
  const router = useRouter();
  const [smtpPassword, setSmtpPassword] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');

  // Estados reales vinculados a la DB
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productImage, setProductImage] = useState('');
  const [isPickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uRes, cRes, prRes, configRes] = await Promise.all([
        fetch(`${API_URL}/users`, { headers: { 'bypass-tunnel-reminder': 'true' } }),
        fetch(`${API_URL}/categories`, { headers: { 'bypass-tunnel-reminder': 'true' } }),
        fetch(`${API_URL}/products`, { headers: { 'bypass-tunnel-reminder': 'true' } }),
        fetch(`${API_URL}/config-all`, { headers: { 'bypass-tunnel-reminder': 'true' } })
      ]);
      const [uData, cData, prData, configData] = await Promise.all([
        uRes.json(), cRes.json(), prRes.json(), configRes.json()
      ]);
      setUsers(uData);
      setCategories(cData);
      setProducts(prData);
      setSmtpPassword(configData.smtp_pass || '');
      setTargetEmail(configData.target_email || '');
      setAdminUsername(configData.admin_user || 'admin');
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
        method: 'POST',
        headers: { 'bypass-tunnel-reminder': 'true' }
      });
      const data = await res.json();
      if (data.success) {
        alert('Email de prueba enviado con éxito a ' + targetEmail);
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
      await Promise.all([
        fetch(`${API_URL}/config`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'bypass-tunnel-reminder': 'true'
          },
          body: JSON.stringify({ key: 'smtp_pass', value: smtpPassword })
        }),
        fetch(`${API_URL}/config`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'bypass-tunnel-reminder': 'true'
          },
          body: JSON.stringify({ key: 'target_email', value: targetEmail })
        })
      ]);
      alert('Configuración guardada correctamente');
      fetchData();
    } catch (e) { alert('Error al guardar'); }
  };

  const handleUpdateAdminCredentials = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/update_credentials`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert('Credenciales de administrador actualizadas');
        setAdminPassword('');
        fetchData();
      }
    } catch (e) { alert('Error al actualizar credenciales'); }
  };

  const handleAddUser = async () => {
    const username = newUserUsername.trim();
    const password = newUserPassword.trim();

    if (username && (password || editingUserId)) {
      try {
        if (editingUserId) {
          const res = await fetch(`${API_URL}/users/${editingUserId}`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              'bypass-tunnel-reminder': 'true'
            },
            body: JSON.stringify({ username, password })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.message);
          alert(`Usuario ${username} actualizado.`);
        } else {
          const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'bypass-tunnel-reminder': 'true'
            },
            body: JSON.stringify({ username, password })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.message);
          alert(`Usuario ${username} creado.`);
        }
        setNewUserUsername('');
        setNewUserPassword('');
        setEditingUserId(null);
        fetchData();
      } catch (e) { alert(e.message); }
    }
  };

  const handleEditUser = (user) => {
    setNewUserUsername(user.username);
    setNewUserPassword(''); // Dejar vacío para no cambiarla a menos que se escriba algo
    setEditingUserId(user.id);
  };

  const handleDeleteUser = async (id) => {
    Alert.alert("Eliminar", "¿Seguro?", [
      { text: "No" },
      { text: "Sí", onPress: async () => {
        await fetch(`${API_URL}/users/${id}`, { 
          method: 'DELETE',
          headers: { 'bypass-tunnel-reminder': 'true' }
        });
        fetchData();
      }}
    ]);
  };

  const handleAddCategory = async () => {
    if (newCategory) {
      try {
        const url = editingCategoryId ? `${API_URL}/categories/${editingCategoryId}` : `${API_URL}/categories`;
        const method = editingCategoryId ? 'PATCH' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 
            'Content-Type': 'application/json',
            'bypass-tunnel-reminder': 'true'
          },
          body: JSON.stringify({ name: newCategory })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setNewCategory('');
        setEditingCategoryId(null);
        fetchData();
      } catch (e) { alert(e.message); }
    }
  };

  const handleDeleteCategory = async (id) => {
    console.log(`[Admin] Clicked delete category ID: ${id}`);
    
    const performDelete = async () => {
      try {
        console.log(`[Admin] Sending DELETE request for category ${id}`);
        const res = await fetch(`${API_URL}/categories/${id}`, { 
          method: 'DELETE',
          headers: { 'bypass-tunnel-reminder': 'true' }
        });
        const data = await res.json();
        console.log(`[Admin] Server response:`, data);
        if (!data.success) {
          alert(`Error al borrar: ${data.message || 'Error desconocido'}`);
        }
        fetchData();
      } catch (err) {
        console.error(`[Admin] Error:`, err);
        Alert.alert("Error", `Detalle: ${err.message}`);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm("¿Seguro que quieres eliminar esta categoría? Esto podría afectar a los productos asociados.")) {
        performDelete();
      }
    } else {
      Alert.alert("Eliminar", "¿Seguro que quieres eliminar esta categoría? Esto podría afectar a los productos asociados.", [
        { text: "No" },
        { text: "Sí", onPress: performDelete }
      ]);
    }
  };

  const handleEditCategory = (cat) => {
    setNewCategory(cat.name);
    setEditingCategoryId(cat.id);
  };

  const handleAddProduct = async () => {
    if (productName && productCategory) {
      const url = editingProductId ? `${API_URL}/products/${editingProductId}` : `${API_URL}/products`;
      const method = editingProductId ? 'PATCH' : 'POST';
      await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ name: productName, category_name: productCategory, image: productImage })
      });
      alert(editingProductId ? `Producto "${productName}" actualizado.` : `Producto "${productName}" añadido.`);
      setProductName('');
      setProductCategory('');
      setProductImage('');
      setEditingProductId(null);
      fetchData();
    }
  };

  const handleDeleteProduct = async (id) => {
    console.log(`[Admin] Clicked delete product ID: ${id}`);

    const performDelete = async () => {
      try {
        console.log(`[Admin] Sending DELETE request for product ${id}`);
        const res = await fetch(`${API_URL}/products/${id}`, { 
          method: 'DELETE',
          headers: { 'bypass-tunnel-reminder': 'true' }
        });
        const data = await res.json();
        console.log(`[Admin] Server response:`, data);
        if (!data.success) {
          alert(`Error al borrar producto: ${data.message || 'Error desconocido'}`);
        }
        fetchData();
      } catch (e) {
        console.error(`[Admin] Connection error:`, e);
        alert("Error de conexión al borrar el producto");
      }
    };

    if (Platform.OS === 'web') {
      if (confirm("¿Seguro que quieres eliminar este producto?")) {
        performDelete();
      }
    } else {
      Alert.alert("Eliminar", "¿Seguro que quieres eliminar este producto?", [
        { text: "No" },
        { text: "Sí", onPress: performDelete }
      ]);
    }
  };

  const handleEditProduct = (prod) => {
    setProductName(prod.name);
    setProductCategory(prod.category_name);
    setProductImage(prod.image);
    setEditingProductId(prod.id);
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>Cargando panel...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }} 
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Panel de Administrador</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Email Settings Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="email-edit-outline" size={24} color="#10B981" />
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
            <Text style={styles.inputLabel}>Gmail Destino:</Text>
            <TextInput
              style={styles.input}
              placeholder="tu-correo@gmail.com"
              value={targetEmail}
              onChangeText={setTargetEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña de Aplicación:</Text>
            <TextInput
              style={styles.input}
              placeholder="xxxx xxxx xxxx xxxx"
              value={smtpPassword}
              onChangeText={setSmtpPassword}
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

        {/* Admin Credentials Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="shield-lock-outline" size={24} color="#EF4444" />
            <Text style={styles.cardTitle}>Acceso Panel Admin</Text>
          </View>
          <Text style={styles.description}>
            Cambia el nombre de usuario y contraseña para entrar a este panel.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Usuario Admin:</Text>
            <TextInput
              style={styles.input}
              value={adminUsername}
              onChangeText={setAdminUsername}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nueva Contraseña:</Text>
            <TextInput
              style={styles.input}
              placeholder="Dejar en blanco para no cambiar"
              value={adminPassword}
              onChangeText={setAdminPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: '#EF4444' }]} onPress={handleUpdateAdminCredentials}>
            <Text style={styles.buttonText}>Actualizar Acceso Admin</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="tag-multiple" size={24} color="#F59E0B" />
            <Text style={styles.cardTitle}>{editingCategoryId ? 'Editar Categoría' : 'Gestión de Categorías'}</Text>
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
          
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#F59E0B', flex: 1 }]} onPress={handleAddCategory}>
              <Text style={styles.buttonText}>{editingCategoryId ? 'Actualizar' : 'Añadir Categoría'}</Text>
            </TouchableOpacity>
            {editingCategoryId && (
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#6B7280', paddingHorizontal: 15 }]} 
                onPress={() => { setEditingCategoryId(null); setNewCategory(''); }}
              >
                <Text style={styles.buttonText}>X</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10, color: '#4B5563' }}>Categorías Existentes:</Text>
            {categories.map((cat) => (
              <View key={cat.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{cat.name}</Text>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  <TouchableOpacity onPress={() => handleEditCategory(cat)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="pencil" size={18} color="#F59E0B" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteCategory(cat.id)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="trash-can" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Products Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="package-variant-closed" size={24} color="#8B5CF6" />
            <Text style={styles.cardTitle}>{editingProductId ? 'Editar Producto' : 'Gestión de Productos'}</Text>
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

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#8B5CF6', flex: 1 }]} onPress={handleAddProduct}>
              <Text style={styles.buttonText}>{editingProductId ? 'Actualizar' : 'Añadir Producto'}</Text>
            </TouchableOpacity>
            {editingProductId && (
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#6B7280', paddingHorizontal: 15 }]} 
                onPress={() => { 
                  setEditingProductId(null); 
                  setProductName(''); 
                  setProductCategory(''); 
                  setProductImage(''); 
                }}
              >
                <Text style={styles.buttonText}>X</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10, color: '#4B5563' }}>Listado de Productos:</Text>
            {products.map((prod) => (
              <View key={prod.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{prod.name}</Text>
                  <Text style={styles.itemCategory}>{prod.category_name}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  <TouchableOpacity onPress={() => handleEditProduct(prod)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="pencil" size={18} color="#8B5CF6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteProduct(prod.id)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="trash-can" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
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
                  <TouchableOpacity onPress={() => handleEditUser(user)} style={styles.actionBtn}>
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
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.pickerItem} 
                  onPress={() => {
                    setProductCategory(item.name);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    productCategory === item.name && { color: '#10B981', fontWeight: 'bold' }
                  ]}>
                    {item.name}
                  </Text>
                  {productCategory === item.name && (
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  itemCategory: {
    fontSize: 12,
    color: '#6B7280',
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
