import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { mobileApi } from '../../src/services/api';

export default function LeaderDashboardMobile() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: overview, refetch: refetchOverview } = useQuery({
    queryKey: ['mobile-overview'],
    queryFn: () => mobileApi.getDashboardOverview(),
  });

  const { data: expenses = [], refetch: refetchExpenses } = useQuery({
    queryKey: ['mobile-expenses'],
    queryFn: () => mobileApi.getExpenses(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchOverview(), refetchExpenses()]);
    setRefreshing(false);
  };

  const pending = expenses.filter((e: any) => e.status === 'pending_approval');

  const handleApprove = async (id: string) => {
    try {
      await mobileApi.approveExpense(id, 'approve');
      Alert.alert('Succès', 'Dépense autorisée pour décaissement.');
      onRefresh();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Erreur lors de l’approbation');
    }
  };

  const handleReject = async (id: string) => {
    Alert.prompt
      ? Alert.prompt('Rejet', 'Indiquer le motif du rejet :', [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Rejeter',
            style: 'destructive',
            onPress: async (reason) => {
              await mobileApi.approveExpense(id, 'reject', reason || 'Refusé');
              onRefresh();
            },
          },
        ])
      : handleApproveRejectFallback(id);
  };

  const handleApproveRejectFallback = async (id: string) => {
    await mobileApi.approveExpense(id, 'reject', 'Rejeté depuis mobile');
    Alert.alert('Dépense rejetée');
    onRefresh();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFBC00" />}
    >
      {/* Top Banner */}
      <View style={styles.topCard}>
        <Text style={styles.badgeText}>👑 LEADER PRINCIPAL • SESSION MOBILE</Text>
        <Text style={styles.topTitle}>Trésorerie Consolidée</Text>
        <Text style={styles.cashAmount}>14 750 000 FCFA</Text>
        <Text style={styles.cashSub}>Solde physique unique en coffre & banque</Text>
      </View>

      {/* Compartiments clés */}
      <View style={styles.row}>
        <View style={[styles.kpiCard, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.kpiLabel}>Fonds Général (80%)</Text>
          <Text style={styles.kpiValue}>8 150 000 F</Text>
          <Text style={styles.kpiSub}>Disponible</Text>
        </View>

        <View style={[styles.kpiCard, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.kpiLabel}>Auditorium (100%)</Text>
          <Text style={styles.kpiValue}>2 800 000 F</Text>
          <Text style={styles.kpiSub}>Affecté</Text>
        </View>
      </View>

      {/* Dernier Culte */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Dernier Culte — Fréquentation</Text>
        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>500</Text>
            <Text style={styles.statLabel}>Total fidèles</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#3B82F6' }]}>+32</Text>
            <Text style={styles.statLabel}>Nouveaux visiteurs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>14</Text>
            <Text style={styles.statLabel}>Décisions Christ</Text>
          </View>
        </View>
      </View>

      {/* Dépenses en attente d'approbation */}
      <View style={styles.sectionCard}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Autorisation des Dépenses</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{pending.length} en attente</Text>
          </View>
        </View>

        {pending.length === 0 ? (
          <Text style={styles.emptyText}>Toutes les demandes de dépenses ont été arbitrées.</Text>
        ) : (
          pending.map((e: any) => (
            <View key={e.id} style={styles.expenseItem}>
              <View style={styles.expenseHeader}>
                <Text style={styles.expenseNum}>{e.expense_number || 'DEP-2026-00001'}</Text>
                <Text style={styles.expenseAmount}>{Number(e.amount).toLocaleString('fr-FR')} FCFA</Text>
              </View>

              <Text style={styles.expensePurpose}>{e.purpose}</Text>
              <Text style={styles.expenseBene}>Bénéficiaire : {e.beneficiary}</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.btnApprove} onPress={() => handleApprove(e.id)}>
                  <Text style={styles.btnApproveText}>✓ Approuver</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnReject} onPress={() => handleReject(e.id)}>
                  <Text style={styles.btnRejectText}>✕ Rejeter</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B1E',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  topCard: {
    backgroundColor: '#091338',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 0, 0.3)',
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFBC00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  topTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cashAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  cashSub: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  kpiCard: {
    backgroundColor: '#091338',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  kpiLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  kpiSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#091338',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  countBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 14,
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  expenseItem: {
    backgroundColor: '#0D1B48',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseNum: {
    color: '#FFBC00',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
  },
  expenseAmount: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '900',
  },
  expensePurpose: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  expenseBene: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btnApprove: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnApproveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  btnReject: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnRejectText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
