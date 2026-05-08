import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../../constants/API';

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/orders`, {
        headers: { 'bypass-tunnel-reminder': 'true' }
      });
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      alert('Error cargando pedidos');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pendiente' ? 'Recibido' : 'Pendiente';
    try {
      await fetch(`${API_URL}/orders/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchOrders();
    } catch (e) {
      alert('Error al actualizar estado');
    }
  };

  const exportCSV = () => {
    // Aquí implementaremos la lógica de exportación
    alert('Exportando a CSV...');
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#ORD-{item.id}</Text>
        <Text style={styles.orderDate}>{item.date}</Text>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.itemsCount}>
          <MaterialCommunityIcons name="shopping-outline" size={20} color="#6B7280" />
          <Text style={styles.itemsText}>{JSON.parse(item.items || '[]').length} artículos</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.statusBadge, item.status === 'Recibido' ? styles.statusReceived : styles.statusPending]}
          onPress={() => toggleStatus(item.id, item.status)}
        >
          <Text style={[styles.statusText, item.status === 'Recibido' ? styles.statusTextReceived : styles.statusTextPending]}>
            {item.status}
          </Text>
          <MaterialCommunityIcons 
            name="swap-horizontal" 
            size={16} 
            color={item.status === 'Recibido' ? '#059669' : '#D97706'} 
            style={{ marginLeft: 5 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Pedidos</Text>
        <TouchableOpacity style={styles.exportButton} onPress={exportCSV}>
          <MaterialCommunityIcons name="export" size={20} color="#FFF" />
          <Text style={styles.exportText}>Exportar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 5,
  },
  list: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  orderDate: {
    color: '#6B7280',
    fontSize: 14,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemsText: {
    marginLeft: 5,
    color: '#4B5563',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusReceived: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  statusText: {
    fontWeight: '600',
    fontSize: 14,
  },
  statusTextPending: {
    color: '#D97706',
  },
  statusTextReceived: {
    color: '#059669',
  }
});
