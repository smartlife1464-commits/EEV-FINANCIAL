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
import { mobileApi } from '../../src/services/api';
import { OfflineSyncService } from '../../src/services/offlineSync';

const OFFICIAL_PROGRAMS = [
  { slug: 'tuesday_service', name: 'Culte de Mardi' },
  { slug: 'thursday_service', name: 'Culte de Jeudi' },
  { slug: 'sunday_service_1', name: '1er Service Dimanche' },
  { slug: 'sunday_service_2', name: '2ème Service Dimanche' },
  { slug: 'mission_camp', name: 'Camp Missionnaire' },
  { slug: 'shepherds_camp', name: 'Camp des Bergers' },
  { slug: 'special_programs', name: 'Programmes Spéciaux' },
];

export default function AttendanceMobile() {
  const [selectedProgram, setSelectedProgram] = useState('sunday_service_1');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [men, setMen] = useState('145');
  const [women, setWomen] = useState('198');
  const [youth, setYouth] = useState('92');
  const [children, setChildren] = useState('65');
  const [visitors, setVisitors] = useState('32');
  const [salvations, setSalvations] = useState('14');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const menCount = parseInt(men) || 0;
  const womenCount = parseInt(women) || 0;
  const youthCount = parseInt(youth) || 0;
  const childrenCount = parseInt(children) || 0;
  const visitorsCount = parseInt(visitors) || 0;

  // Calcul certifié strict : TOTAL = Hommes + Femmes + Jeunes + Enfants
  const total = menCount + womenCount + youthCount + childrenCount;

  useEffect(() => {
    checkPendingQueue();
  }, []);

  const checkPendingQueue = async () => {
    const count = await OfflineSyncService.getPendingCount();
    setPendingSyncCount(count);
  };

  const handleSyncNow = async () => {
    try {
      const res = await OfflineSyncService.syncAll();
      Alert.alert(
        'Synchronisation Terminée',
        `${res.syncedAttendances} fiche(s) synchronisée(s) avec le serveur.`
      );
      await checkPendingQueue();
    } catch (err: any) {
      Alert.alert('Erreur', 'Impossible de joindre le serveur pour le moment.');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = {
      serviceTypeSlug: selectedProgram,
      serviceDate,
      startTime: '09:00',
      endTime: '12:00',
      menCount,
      womenCount,
      youthCount,
      childrenCount,
      newVisitorsCount: visitorsCount,
      salvationsCount: parseInt(salvations) || 0,
      notes,
    };

    try {
      await mobileApi.createStructuredAttendance(payload);
      Alert.alert('Succès', 'Fiche de présence officielle transmise avec succès.');
    } catch (err: any) {
      // Sauvegarde dans la file locale hors-ligne
      await OfflineSyncService.queueAttendance(payload);
      await checkPendingQueue();
      Alert.alert(
        'Enregistré en Mode Hors-Ligne',
        'Connexion instable : la fiche a été sauvegardée dans le stockage sécurisé local et sera synchronisée dès le retour du réseau.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Saisie Protocole Mobile</Text>
      <Text style={styles.pageSub}>Fiche de présence pour les 7 programmes officiels</Text>

      {/* Alerte si des fiches sont en attente de synchronisation */}
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

      {/* 1. Sélection du Programme parmi les 7 officiels */}
      <View style={styles.formCard}>
        <Text style={styles.cardHeader}>1. Programme Officiel</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {OFFICIAL_PROGRAMS.map((p) => {
              const active = selectedProgram === p.slug;
              return (
                <TouchableOpacity
                  key={p.slug}
                  onPress={() => setSelectedProgram(p.slug)}
                  style={[
                    styles.chipBtn,
                    active && styles.chipBtnActive,
                  ]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.inputRow, { marginTop: 8 }]}>
          <Text style={styles.inputLabel}>📅 Date du culte</Text>
          <TextInput
            value={serviceDate}
            onChangeText={setServiceDate}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor="#64748B"
            style={[styles.numberInput, { width: 130 }]}
          />
        </View>
      </View>

      {/* Banner Total Automatique */}
      <View style={styles.totalBanner}>
        <View>
          <Text style={styles.totalBannerLabel}>TOTAL CALCULÉ (STRICT)</Text>
          <Text style={styles.totalBannerSub}>Hommes + Femmes + Jeunes + Enfants</Text>
        </View>
        <Text style={styles.totalBannerNum}>{total}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardHeader}>2. Catégories Exclusives</Text>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>👨 Hommes</Text>
          <TextInput
            keyboardType="numeric"
            value={men}
            onChangeText={setMen}
            style={styles.numberInput}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>👩 Femmes</Text>
          <TextInput
            keyboardType="numeric"
            value={women}
            onChangeText={setWomen}
            style={styles.numberInput}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>🧑 Jeunes</Text>
          <TextInput
            keyboardType="numeric"
            value={youth}
            onChangeText={setYouth}
            style={styles.numberInput}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>👶 Enfants</Text>
          <TextInput
            keyboardType="numeric"
            value={children}
            onChangeText={setChildren}
            style={styles.numberInput}
          />
        </View>
      </View>

      {/* Nouveaux Visiteurs */}
      <View style={[styles.formCard, { borderColor: '#3B82F6' }]}>
        <Text style={[styles.cardHeader, { color: '#60A5FA' }]}>3. Indicateurs Complémentaires</Text>
        <Text style={styles.alertText}>
          ℹ️ Les nouveaux visiteurs ne s'ajoutent jamais au total de fréquentation ci-dessus.
        </Text>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>⭐ Nouveaux Visiteurs</Text>
          <TextInput
            keyboardType="numeric"
            value={visitors}
            onChangeText={setVisitors}
            style={[styles.numberInput, { color: '#60A5FA', borderColor: '#3B82F6' }]}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>✝️ Décisions pour Christ</Text>
          <TextInput
            keyboardType="numeric"
            value={salvations}
            onChangeText={setSalvations}
            style={[styles.numberInput, { color: '#10B981', borderColor: '#10B981' }]}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitBtnText}>
          {submitting ? 'Transmission...' : 'Valider la Fiche de Présence'}
        </Text>
      </TouchableOpacity>
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
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0C1530',
    borderWidth: 1,
    borderColor: '#16214A',
  },
  chipBtnActive: {
    backgroundColor: '#FFBC00',
    borderColor: '#FFBC00',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chipTextActive: {
    color: '#091338',
    fontWeight: '900',
  },
  totalBanner: {
    backgroundColor: '#FFBC00',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalBannerLabel: { color: '#091338', fontSize: 13, fontWeight: '900' },
  totalBannerSub: { color: '#334155', fontSize: 10, fontWeight: '600', marginTop: 2 },
  totalBannerNum: { color: '#091338', fontSize: 32, fontWeight: '900' },
  formCard: {
    backgroundColor: '#0C1530',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#16214A',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: { color: '#FFBC00', fontSize: 13, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputLabel: { color: '#E2E8F0', fontSize: 13, fontWeight: '600' },
  numberInput: {
    backgroundColor: '#060D24',
    borderWidth: 1,
    borderColor: '#16214A',
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    width: 90,
    textAlign: 'center',
    paddingVertical: 8,
  },
  alertText: { color: '#94A3B8', fontSize: 10, fontStyle: 'italic', marginBottom: 12 },
  submitBtn: {
    backgroundColor: '#FFBC00',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: '#091338', fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
});
