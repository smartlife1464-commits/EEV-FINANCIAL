import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { calculateEntryAllocations } from '@eev/business-rules';
import { AllocationRule, FundAccountCode } from '@eev/shared-types';
import { mobileApi, isNetworkError } from '../../src/services/api';
import { OfflineSyncService } from '../../src/services/offlineSync';

export default function FinanceMobile() {
  const [mainTab, setMainTab] = useState<'entries' | 'fixed_expenses'>('entries');
  const [amount, setAmount] = useState('100000');
  const [category, setCategory] = useState<'ordinary' | 'building'>('ordinary');
  const [submitting, setSubmitting] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const numAmount = parseInt(amount) || 0;
  const isOrdinary = category === 'ordinary';

  const split = calculateEntryAllocations(
    numAmount,
    isOrdinary ? AllocationRule.STANDARD_SPLIT_80_10_10 : AllocationRule.DIRECT_ALLOCATED,
    FundAccountCode.BUILDING
  );

  useEffect(() => {
    checkPendingQueue();
    loadFixedExpenses();
    mobileApi.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const loadFixedExpenses = async () => {
    try {
      const data = await mobileApi.getFixedExpenses();
      setFixedExpenses(data);
    } catch {
      // Aucune donnée fictive : liste vide si le serveur est injoignable
      setFixedExpenses([]);
    }
  };

  const checkPendingQueue = async () => {
    const count = await OfflineSyncService.getPendingCount();
    setPendingSyncCount(count);
  };

  const handleSyncNow = async () => {
    try {
      const res = await OfflineSyncService.syncAll();
      Alert.alert(
        'Synchronisation Réussie',
        `${res.syncedEntries} recette(s) synchronisée(s).`
      );
      await checkPendingQueue();
    } catch {
      Alert.alert('Erreur', 'Impossible de contacter le serveur.');
    }
  };

  const handleSaveEntry = async () => {
    if (numAmount <= 0) {
      Alert.alert('Erreur', 'Le montant doit être supérieur à 0 FCFA.');
      return;
    }

    setSubmitting(true);
    const categoryCode = isOrdinary ? 'tithes' : 'building';
    const categoryId = categories.find((c: any) => c.code === categoryCode)?.id;
    const payload: Record<string, any> = {
      ...(categoryId ? { categoryId } : { categoryCode }),
      amount: numAmount,
      paymentMethod: 'cash',
      collectedAt: new Date().toISOString().split('T')[0],
      donorName: 'Assemblée Générale (Mobile)',
    };

    try {
      if (!categoryId) throw Object.assign(new Error('offline'), {});
      await mobileApi.createEntry(payload);
      Alert.alert('Succès', `Recette de ${numAmount.toLocaleString('fr-FR')} FCFA comptabilisée.`);
    } catch (err: any) {
      if (!isNetworkError(err)) {
        Alert.alert('Recette refusée', err.message);
        return;
      }
      await OfflineSyncService.queueEntry(payload);
      await checkPendingQueue();
      Alert.alert(
        'Mode Hors-Ligne',
        'Connexion instable : la recette a été sécurisée en local et sera synchronisée dès le retour du réseau.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Module Finances Mobile</Text>
      <Text style={styles.pageSub}>Simulateur & Encaissement certifié en direct</Text>

      {/* Alerte si des opérations sont en attente de synchronisation */}
      {pendingSyncCount > 0 && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            📶 {pendingSyncCount} élément(s) en attente de synchronisation
          </Text>
          <TouchableOpacity style={styles.syncBtn} onPress={handleSyncNow}>
            <Text style={styles.syncBtnText}>Synchroniser</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Switcher Principal : Recettes vs Dépenses Fixes */}
      <View style={styles.mainTabToggle}>
        <TouchableOpacity
          style={[styles.mainToggleBtn, mainTab === 'entries' && styles.mainToggleBtnActive]}
          onPress={() => setMainTab('entries')}
        >
          <Text style={[styles.mainToggleText, mainTab === 'entries' && styles.mainToggleTextActive]}>
            💰 Recettes & Dîmes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainToggleBtn, mainTab === 'fixed_expenses' && styles.mainToggleBtnActive]}
          onPress={() => setMainTab('fixed_expenses')}
        >
          <Text style={[styles.mainToggleText, mainTab === 'fixed_expenses' && styles.mainToggleTextActive]}>
            ⚡ Charges Fixes ({fixedExpenses.length})
          </Text>
        </TouchableOpacity>
      </View>

      {mainTab === 'entries' ? (
        <>
          {/* Select Category */}
          <View style={styles.tabToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, isOrdinary && styles.toggleBtnActive]}
              onPress={() => setCategory('ordinary')}
            >
              <Text style={[styles.toggleText, isOrdinary && styles.toggleTextActive]}>
                Dîmes & Offrandes (80/10/10)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, !isOrdinary && styles.toggleBtnActive]}
              onPress={() => setCategory('building')}
            >
              <Text style={[styles.toggleText, !isOrdinary && styles.toggleTextActive]}>
                Auditorium (100%)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Montant */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeader}>Montant Brut Encaissé (FCFA)</Text>
            <TextInput
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="Ex: 100000"
              style={styles.amountInput}
            />

            {/* Live Allocations Preview */}
            <Text style={styles.previewHeader}>Ventilation Analytique Automatique :</Text>

            {split.allocations.map((alloc, idx) => (
              <View key={idx} style={styles.allocRow}>
                <Text style={styles.allocDesc}>{alloc.description}</Text>
                <Text style={styles.allocVal}>{alloc.amount.toLocaleString('fr-FR')} FCFA</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSaveEntry}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? 'Comptabilisation...' : 'Enregistrer la Recette'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.fixedExpensesSection}>
          <Text style={styles.sectionTitle}>Charges Fixes Mensuelles Autorisées</Text>
          <Text style={styles.sectionSubtitle}>
            Imputées exclusivement sur les 80% du Fonds Général
          </Text>

          {fixedExpenses.map((fe) => (
            <View key={fe.id} style={styles.fixedCard}>
              <View style={styles.fixedCardHeader}>
                <Text style={styles.fixedCardName}>{fe.name}</Text>
                <Text style={styles.fixedCardAmount}>{fe.amount?.toLocaleString('fr-FR')} FCFA</Text>
              </View>
              <View style={styles.fixedCardFooter}>
                <Text style={styles.fixedCardDetail}>Périodicité : {fe.frequency || 'Mensuelle'}</Text>
                <Text style={styles.fixedCardDetail}>Échéance : le {fe.due_day || 5} du mois</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050B1E' },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  pageSub: { color: '#94A3B8', fontSize: 12, marginTop: 2, marginBottom: 16 },
  offlineBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  offlineBannerText: { color: '#F59E0B', fontSize: 11, fontWeight: 'bold', flex: 1 },
  syncBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  syncBtnText: { color: '#091338', fontWeight: '900', fontSize: 11 },
  mainTabToggle: {
    flexDirection: 'row',
    backgroundColor: '#0C1530',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#16214A',
  },
  mainToggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  mainToggleBtnActive: { backgroundColor: '#FFBC00' },
  mainToggleText: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold' },
  mainToggleTextActive: { color: '#091338', fontWeight: '900' },
  fixedExpensesSection: { marginTop: 4 },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  sectionSubtitle: { color: '#94A3B8', fontSize: 11, marginBottom: 12, marginTop: 2 },
  fixedCard: {
    backgroundColor: '#0C1530',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#16214A',
    padding: 14,
    marginBottom: 10,
  },
  fixedCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fixedCardName: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  fixedCardAmount: { color: '#FFBC00', fontSize: 15, fontWeight: '900' },
  fixedCardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  fixedCardDetail: { color: '#64748B', fontSize: 11 },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: '#091338',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#FFBC00' },
  toggleText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  toggleTextActive: { color: '#091338', fontWeight: '900' },
  formCard: {
    backgroundColor: '#091338',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  cardHeader: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  amountInput: {
    backgroundColor: '#0D1B48',
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 24,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFBC00',
    marginBottom: 16,
  },
  previewHeader: { color: '#FFBC00', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  allocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  allocDesc: { color: '#CBD5E1', fontSize: 12 },
  allocVal: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  submitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
});
