import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useMobileAuth } from '../../src/context/AuthContext';
import { UserRole } from '@eev/shared-types';

export default function ProfileMobile() {
  const { user, login, logout } = useMobileAuth();

  const handleSwitch = async (role: UserRole, name: string, email: string) => {
    await login(`dev-token-${role}`, {
      id: `dev-${role}-id`,
      email,
      name,
      role,
    });
    Alert.alert('Rôle modifié', `Vous êtes maintenant connecté en tant que ${name}.`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name ? user.name[0] : 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
        <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'AGENT'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'email@espritvie.org'}</Text>
      </View>

      <Text style={styles.sectionHeader}>Basculer de Rôle (Démonstration)</Text>

      <TouchableOpacity
        style={styles.roleBtn}
        onPress={() => handleSwitch(UserRole.LEAD_PASTOR, 'Leader Principal', 'leader@espritvie.org')}
      >
        <Text style={styles.roleBtnText}>👑 Leader Principal</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.roleBtn}
        onPress={() => handleSwitch(UserRole.FINANCE_LEAD, 'Responsable Finances', 'finance@espritvie.org')}
      >
        <Text style={styles.roleBtnText}>💰 Responsable Finances</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.roleBtn}
        onPress={() => handleSwitch(UserRole.PROTOCOL_LEAD, 'Responsable Protocole', 'protocol@espritvie.org')}
      >
        <Text style={styles.roleBtnText}>📋 Responsable Protocole</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.roleBtn}
        onPress={() => handleSwitch(UserRole.ADMIN, 'Administrateur Général', 'admin@espritvie.org')}
      >
        <Text style={styles.roleBtnText}>⚙️ Administrateur Général</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnText}>Se Déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050B1E', padding: 16 },
  userCard: {
    backgroundColor: '#091338',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFBC00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#091338', fontWeight: '900', fontSize: 24 },
  userName: { color: '#FFFFFF', fontWeight: '900', fontSize: 18 },
  userRole: { color: '#FFBC00', fontWeight: 'bold', fontSize: 12, marginTop: 2 },
  userEmail: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  roleBtn: {
    backgroundColor: '#091338',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 8,
  },
  roleBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    marginTop: 20,
  },
  logoutBtnText: { color: '#EF4444', fontWeight: 'bold', fontSize: 13 },
});

