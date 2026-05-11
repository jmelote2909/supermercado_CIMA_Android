import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../../constants/API';

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

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
    <TouchableOpacity 
      style={styles.orderCard} 
      onPress={() => setSelectedOrder(item)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>#ORD-{item.id}</Text>
          <Text style={styles.orderUser}>{item.username}</Text>
        </View>
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
    </TouchableOpacity>
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
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay pedidos aún</Text>
          </View>
        }
      />

      {/* Modal de Detalles del Pedido */}
      <Modal
        visible={!!selectedOrder}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Detalles del Pedido</Text>
                <Text style={styles.modalSubtitle}>#ORD-{selectedOrder?.id} • {selectedOrder?.date}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.userInfoSection}>
                <MaterialCommunityIcons name="account-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.userInfoText}>Cliente: <Text style={{fontWeight:'bold'}}>{selectedOrder?.username}</Text></Text>
              </View>

              <Text style={styles.sectionTitle}>Productos:</Text>
              {selectedOrder && JSON.parse(selectedOrder.items).map((product, index) => (
                <View key={index} style={styles.productItem}>
                  <View style={styles.productDot} />
                  <View style={{flex:1}}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productCategory}>{product.category_name}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.modalActionBtn, selectedOrder?.status === 'Recibido' ? styles.btnReceived : styles.btnPending]}
              onPress={() => {
                toggleStatus(selectedOrder.id, selectedOrder.status);
                setSelectedOrder(null);
              }}
            >
              <Text style={styles.modalActionBtnText}>
                Marcar como {selectedOrder?.status === 'Pendiente' ? 'Recibido' : 'Pendiente'}
              </Text>
            </TouchableOpacity>
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
  },
  orderUser: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 20,
  },
  modalBody: {
    marginBottom: 20,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  userInfoText: {
    marginLeft: 8,
    color: '#4B5563',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 15,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  productDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  productCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  modalActionBtn: {
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btnPending: {
    backgroundColor: '#10B981',
  },
  btnReceived: {
    backgroundColor: '#6B7280',
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
