import React, { useState } from 'react';
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

export default function FinanceMobile() {
  const [amount, setAmount] = useState('100000');
  const [category, setCategory] = useState<'ordinary' | 'building'>('ordinary');

  const numAmount = parseInt(amount) || 0;
  const isOrdinary = category === 'ordinary';

  const split = calculateEntryAllocations(
    numAmount,
    isOrdinary ? AllocationRule.STANDARD_SPLIT_80_10_10 : AllocationRule.DIRECT_ALLOCATED,
    FundAccountCode.BUILDING
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Module Finances Mobile</Text>
      <Text style={styles.pageSub}>Simulateur & Encaissement en direct</Text>

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
        onPress={() => Alert.alert('Succès', `Recette de ${numAmount.toLocaleString('fr-FR')} FCFA enregistrée.`)}
      >
        <Text style={styles.submitBtnText}>Enregistrer la Recette</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050B1E' },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  pageSub: { color: '#94A3B8', fontSize: 12, marginTop: 2, marginBottom: 16 },
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
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
});

