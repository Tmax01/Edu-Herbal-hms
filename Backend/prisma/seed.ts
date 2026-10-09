declare const process: any;
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting EduHMS Database Seeding...');

  // 1. Seed Branches
  const accraBranch = await prisma.branch.upsert({
    where: { code: 'ACC' },
    update: {},
    create: {
      id: 'accra-main-branch-001',
      name: 'Accra Central Hospital',
      code: 'ACC',
      address: '14 Independence Avenue, Ridge, Accra, Ghana',
      phone: '+233 24 100 0001',
      email: 'accra@eduhms.gh',
      isActive: true,
    },
  });

  const mankessimBranch = await prisma.branch.upsert({
    where: { code: 'MKS' },
    update: {},
    create: {
      id: 'mankessim-herbal-branch-002',
      name: 'Mankessim Herbal Centre',
      code: 'MKS',
      address: 'Mankessim Main Commercial Road, Central Region, Ghana',
      phone: '+233 24 200 0002',
      email: 'mankessim@eduhms.gh',
      isActive: true,
    },
  });

  console.log(`✅ Seeded Branches: ${accraBranch.name}, ${mankessimBranch.name}`);

  // 2. Seed Departments
  const departments = [
    { id: 'dept-tech-000', name: 'Technology', code: 'TECH', branchId: null, isClinical: false },
    { id: 'dept-admin-001', name: 'Administration', code: 'ADMIN', branchId: null, isClinical: false },
    { id: 'dept-gen-med-001', name: 'General Medicine', code: 'GEN_MED', branchId: accraBranch.id, isClinical: true },
    { id: 'dept-herbal-med-002', name: 'Herbal Medicine', code: 'HERB_MED', branchId: mankessimBranch.id, isClinical: true },
    { id: 'dept-pharmacy-003', name: 'Pharmacy', code: 'PHARM', branchId: null, isClinical: true },
    { id: 'dept-lab-004', name: 'Laboratory', code: 'LIS_LAB', branchId: null, isClinical: true },
    { id: 'dept-triage-005', name: 'Front Desk', code: 'RECEPT', branchId: null, isClinical: false },
    { id: 'dept-accounts-006', name: 'Finance', code: 'ACCTS', branchId: null, isClinical: false },
    { id: 'dept-ward-a-007', name: 'Ward A', code: 'WARD_A', branchId: accraBranch.id, isClinical: true },
    { id: 'dept-callcentre-008', name: 'Customer Relations', code: 'CALL_CTR', branchId: null, isClinical: false },
    { id: 'dept-stores-009', name: 'Stores', code: 'STORES', branchId: null, isClinical: false },
    { id: 'dept-paed-010', name: 'Paediatrics', code: 'PAED', branchId: accraBranch.id, isClinical: true },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: { name: dept.name, code: dept.code },
      create: dept,
    });
  }
  console.log(`✅ Seeded ${departments.length} Departments`);

  // 3. Seed Demo Users
  const defaultPassword = 'Password123!';
  const defaultPasswordHash = await argon2.hash(defaultPassword, {
    type: argon2.argon2id,
  });

  const demoUsers = [
    {
      id: 'USR-001',
      staffNumber: 'EMP-CTO-001',
      email: 'cto@eduhms.gh',
      fullName: 'Kwame Asante',
      role: 'cto',
      primaryBranchId: null,
      departmentId: 'dept-tech-000',
      phone: '+233 24 100 0001',
      isActive: true,
      lastLoginAt: new Date('2026-08-22T08:14:00Z'),
    },
    {
      id: 'USR-002',
      staffNumber: 'EMP-ADM-002',
      email: 'admin@eduhms.gh',
      fullName: 'Abena Owusu',
      role: 'admin',
      primaryBranchId: null,
      departmentId: 'dept-admin-001',
      phone: '+233 24 000 0002',
      isActive: true,
      lastLoginAt: new Date('2026-08-22T07:55:00Z'),
    },
    {
      id: 'USR-003',
      staffNumber: 'EMP-DOC-003',
      email: 'dr.mensah@eduhms.gh',
      fullName: 'Dr. Kofi Mensah',
      role: 'doctor',
      primaryBranchId: accraBranch.id,
      departmentId: 'dept-gen-med-001',
      phone: '+233 24 000 0003',
      isActive: true,
      lastLoginAt: new Date('2026-08-22T08:02:00Z'),
    },
    {
      id: 'USR-004',
      staffNumber: 'EMP-DOC-004',
      email: 'dr.darko@eduhms.gh',
      fullName: 'Dr. Ama Darko',
      role: 'doctor',
      primaryBranchId: mankessimBranch.id,
      departmentId: 'dept-herbal-med-002',
      phone: '+233 24 100 0004',
      isActive: true,
      lastLoginAt: new Date('2026-08-21T17:30:00Z'),
    },
    {
      id: 'USR-005',
      staffNumber: 'EMP-NUR-005',
      email: 'nurse.boateng@eduhms.gh',
      fullName: 'Akosua Boateng',
      role: 'nurse',
      primaryBranchId: accraBranch.id,
      departmentId: 'dept-ward-a-007',
      phone: '+233 24 100 0005',
      isActive: true,
      lastLoginAt: new Date('2026-08-22T07:00:00Z'),
    },
    {
      id: 'USR-006',
      staffNumber: 'EMP-PHM-006',
      email: 'pharmacist@eduhms.gh',
      fullName: 'Emmanuel Tetteh',
      role: 'pharmacist',
      primaryBranchId: accraBranch.id,
      departmentId: 'dept-pharmacy-003',
      phone: '+233 24 100 0006',
      isActive: true,
      lastLoginAt: new Date('2026-08-22T08:30:00Z'),
    },
    {
      id: 'USR-007',
      staffNumber: 'EMP-LAB-007',
      email: 'lab@eduhms.gh',
      fullName: 'Yaa Frimpong',
      role: 'lab_tech',
      primaryBranchId: accraBranch.id,
      departmentId: 'dept-lab-004',
      phone: '+233 24 100 0007',
      isActive: true,
      lastLoginAt: new Date('2026-08-22T08:10:00Z'),
    },
    {
      id: 'USR-008',
      staffNumber: 'EMP-REC-008',
      email: 'reception@eduhms.gh',
      fullName: 'Kwabena Appiah',
      role: 'receptionist',
      primaryBranchId: accraBranch.id,
      departmentId: 'dept-triage-005',
      phone: '+233 24 100 0008',
      isActive: true,
      lastLoginAt: new Date('2026-08-22T07:45:00Z'),
    },
    {
      id: 'USR-009',
      staffNumber: 'EMP-ACC-009',
      email: 'accounts@eduhms.gh',
      fullName: 'Efua Asiedu',
      role: 'accountant',
      primaryBranchId: null,
      departmentId: 'dept-accounts-006',
      phone: '+233 24 100 0009',
      isActive: true,
      lastLoginAt: new Date('2026-08-21T16:00:00Z'),
    },
    {
      id: 'USR-010',
      staffNumber: 'EMP-CAL-010',
      email: 'callcentre@eduhms.gh',
      fullName: 'Nana Agyei',
      role: 'call_centre',
      primaryBranchId: accraBranch.id,
      departmentId: 'dept-callcentre-008',
      phone: '+233 24 100 0010',
      isActive: true,
      lastLoginAt: new Date('2026-08-22T08:00:00Z'),
    },
    {
      id: 'USR-011',
      staffNumber: 'EMP-STR-011',
      email: 'store@eduhms.gh',
      fullName: 'Kweku Ofori',
      role: 'store_officer',
      primaryBranchId: mankessimBranch.id,
      departmentId: 'dept-stores-009',
      phone: '+233 24 100 0011',
      isActive: true,
      lastLoginAt: new Date('2026-08-20T14:00:00Z'),
    },
    {
      id: 'USR-012',
      staffNumber: 'EMP-DOC-012',
      email: 'dr.nimako@eduhms.gh',
      fullName: 'Dr. Adwoa Nimako',
      role: 'doctor',
      primaryBranchId: accraBranch.id,
      departmentId: 'dept-paed-010',
      phone: '+233 24 100 0012',
      isActive: false, // Inactive
      lastLoginAt: new Date('2026-07-15T10:00:00Z'),
    },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role: user.role,
        fullName: user.fullName,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        primaryBranchId: user.primaryBranchId,
        departmentId: user.departmentId,
      },
      create: {
        ...user,
        passwordHash: defaultPasswordHash,
      },
    });
  }


  // Seed default module permissions for all 12 staff accounts
  const defaultModulesByRole: Record<string, string[]> = {
    cto: ['dashboard', 'patients', 'appointments', 'consultation', 'pharmacy', 'lab', 'billing', 'ward', 'nursing', 'callcentre', 'followups', 'production', 'inventory', 'suppliers', 'reports', 'accounting', 'hr', 'meetings', 'chat', 'daily_reports', 'telemedicine', 'analytics', 'ai_assistant', 'user_management', 'access_control', 'audit_log'],
    admin: ['dashboard', 'patients', 'appointments', 'consultation', 'pharmacy', 'lab', 'billing', 'ward', 'nursing', 'callcentre', 'followups', 'production', 'inventory', 'suppliers', 'reports', 'accounting', 'hr', 'meetings', 'chat', 'daily_reports', 'telemedicine', 'analytics', 'ai_assistant', 'user_management', 'access_control', 'audit_log'],
    doctor: ['dashboard', 'patients', 'appointments', 'consultation', 'lab', 'followups', 'meetings', 'chat', 'daily_reports', 'telemedicine'],
    nurse: ['dashboard', 'patients', 'ward', 'nursing', 'meetings', 'chat', 'daily_reports'],
    pharmacist: ['dashboard', 'pharmacy', 'inventory', 'suppliers', 'meetings', 'chat', 'daily_reports'],
    lab_tech: ['dashboard', 'lab', 'meetings', 'chat', 'daily_reports'],
    receptionist: ['dashboard', 'patients', 'appointments', 'billing', 'meetings', 'chat', 'daily_reports'],
    accountant: ['dashboard', 'billing', 'accounting', 'reports', 'meetings', 'chat', 'daily_reports', 'analytics'],
    call_centre: ['dashboard', 'patients', 'appointments', 'callcentre', 'followups', 'meetings', 'chat', 'daily_reports'],
    store_officer: ['dashboard', 'inventory', 'suppliers', 'production', 'meetings', 'chat', 'daily_reports'],
  };

  for (const user of demoUsers) {
    const mods = defaultModulesByRole[user.role] || ['dashboard'];
    for (const mod of mods) {
      await prisma.userModulePermission.upsert({
        where: {
          userId_moduleKey: {
            userId: user.id,
            moduleKey: mod,
          },
        },
        update: { canView: true, canCreate: true, canEdit: true },
        create: {
          userId: user.id,
          moduleKey: mod,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: user.role === 'cto' || user.role === 'admin',
        },
      });
    }
  }

  console.log(`✅ Seeded ${demoUsers.length} Demo Staff Accounts with Module Permissions (Password: ${defaultPassword})`);


  // 4. Seed Drug Interactions CDSS Catalog
  const interactions = [
    {
      id: 'cdss-int-001',
      drugA: 'Aspirin',
      drugB: 'Warfarin',
      severity: 'high',
      warningMessage: 'Major bleeding risk: Concurrent use of Warfarin and Aspirin significantly elevates hemorrhage danger.',
      clinicalGuidance: 'Monitor INR closely or consider alternative analgesic such as Paracetamol.',
    },
    {
      id: 'cdss-int-002',
      drugA: 'Ciprofloxacin',
      drugB: 'Antacids',
      severity: 'moderate',
      warningMessage: 'Decreased absorption: Magnesium/Aluminum antacids reduce bioavailability of Ciprofloxacin by up to 85%.',
      clinicalGuidance: 'Administer Ciprofloxacin at least 2 hours before or 6 hours after antacids.',
    },
    {
      id: 'cdss-int-003',
      drugA: 'Artemether-Lumefantrine',
      drugB: 'Ketoconazole',
      severity: 'high',
      warningMessage: 'QT Prolongation risk: Ketoconazole increases plasma concentration of lumefantrine.',
      clinicalGuidance: 'Avoid concomitant administration.',
    },
  ];

  for (const item of interactions) {
    await prisma.drugInteractionsCatalog.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }

  console.log(`✅ Seeded ${interactions.length} CDSS Drug-Drug Interaction Rules`);

  // 5. Seed Demo Patients
  const demoPatients = [
    {
      id: 'PAT-001',
      mrn: 'MRN-2024-0001',
      fullName: 'Adjoa Mensah',
      dateOfBirth: new Date('1985-03-12'),
      gender: 'Female',
      phone: '+233 55 123 4567',
      email: 'adjoa.mensah@gmail.com',
      address: 'Osu, Accra',
      bloodGroup: 'O+',
      nhisId: 'NHIS-0034521',
      registrationBranchId: accraBranch.id,
      registeredBy: 'USR-006',
      allergies: ['Penicillin', 'Sulfa drugs'],
      emergencyContact: { name: 'Kwame Mensah', phone: '+233 55 765 4321', relationship: 'Spouse' },
    },
    {
      id: 'PAT-002',
      mrn: 'MRN-2024-0002',
      fullName: 'Kofi Acheampong',
      dateOfBirth: new Date('1970-07-24'),
      gender: 'Male',
      phone: '+233 24 987 6543',
      email: 'kofi.a@yahoo.com',
      address: 'Tema, Greater Accra',
      bloodGroup: 'A+',
      nhisId: 'NHIS-0041233',
      registrationBranchId: accraBranch.id,
      registeredBy: 'USR-006',
      allergies: [],
      emergencyContact: { name: 'Ama Acheampong', phone: '+233 24 111 2222', relationship: 'Spouse' },
    },
    {
      id: 'PAT-003',
      mrn: 'MRN-2024-0003',
      fullName: 'Akua Boafo',
      dateOfBirth: new Date('1995-11-01'),
      gender: 'Female',
      phone: '+233 20 444 5555',
      email: null,
      address: 'Mankessim, Central Region',
      bloodGroup: 'B-',
      nhisId: null,
      registrationBranchId: mankessimBranch.id,
      registeredBy: 'USR-006',
      allergies: ['Ibuprofen'],
      emergencyContact: { name: 'Yaw Boafo', phone: '+233 20 666 7777', relationship: 'Brother' },
    },
    {
      id: 'PAT-004',
      mrn: 'MRN-2024-0004',
      fullName: 'Yaw Darko',
      dateOfBirth: new Date('1960-05-15'),
      gender: 'Male',
      phone: '+233 27 333 4444',
      email: 'yaw.darko@gmail.com',
      address: 'Kasoa, Central Region',
      bloodGroup: 'AB+',
      nhisId: 'NHIS-0058900',
      registrationBranchId: accraBranch.id,
      registeredBy: 'USR-006',
      allergies: ['Aspirin'],
      emergencyContact: { name: 'Efua Darko', phone: '+233 27 555 6666', relationship: 'Sister' },
    },
    {
      id: 'PAT-005',
      mrn: 'MRN-2024-0005',
      fullName: 'Ama Asante',
      dateOfBirth: new Date('1990-09-18'),
      gender: 'Female',
      phone: '+233 54 222 3333',
      email: 'ama.asante@outlook.com',
      address: 'Lapaz, Accra',
      bloodGroup: 'O-',
      nhisId: 'NHIS-0067412',
      registrationBranchId: accraBranch.id,
      registeredBy: 'USR-006',
      allergies: [],
      emergencyContact: { name: 'Kweku Asante', phone: '+233 54 444 5555', relationship: 'Brother' },
    },
    {
      id: 'PAT-006',
      mrn: 'MRN-2024-0006',
      fullName: 'Kwame Osei',
      dateOfBirth: new Date('1978-04-12'),
      gender: 'Male',
      phone: '+233 24 555 6677',
      email: 'kwame.osei@gmail.com',
      address: 'Mankessim Market Street, Central Region',
      bloodGroup: 'O+',
      nhisId: 'NHIS-0081234',
      registrationBranchId: mankessimBranch.id,
      registeredBy: 'USR-006',
      allergies: [],
      emergencyContact: { name: 'Esi Osei', phone: '+233 24 888 9900', relationship: 'Spouse' },
    },
    {
      id: 'PAT-007',
      mrn: 'MRN-2024-0007',
      fullName: 'Abena Kyei',
      dateOfBirth: new Date('2002-06-08'),
      gender: 'Female',
      phone: '+233 50 111 2222',
      email: 'abena.kyei@gmail.com',
      address: 'Madina, Accra',
      bloodGroup: 'B+',
      nhisId: null,
      registrationBranchId: accraBranch.id,
      registeredBy: 'USR-006',
      allergies: [],
      emergencyContact: { name: 'Kofi Kyei', phone: '+233 50 333 4444', relationship: 'Father' },
    },
    {
      id: 'PAT-008',
      mrn: 'MRN-2024-0008',
      fullName: 'Kofi Frimpong',
      dateOfBirth: new Date('1965-03-20'),
      gender: 'Male',
      phone: '+233 24 666 7788',
      email: 'kofi.frimpong@gmail.com',
      address: 'Mankessim Central, Central Region',
      bloodGroup: 'O+',
      nhisId: 'NHIS-0099411',
      registrationBranchId: mankessimBranch.id,
      registeredBy: 'USR-006',
      allergies: [],
      emergencyContact: { name: 'Ama Frimpong', phone: '+233 24 888 1122', relationship: 'Spouse' },
    },
  ];

  for (const p of demoPatients) {
    const { allergies, emergencyContact, ...patientData } = p;
    await prisma.patient.upsert({
      where: { id: p.id },
      update: patientData,
      create: patientData,
    });

    if (emergencyContact) {
      await prisma.patientEmergencyContact.deleteMany({ where: { patientId: p.id } });
      await prisma.patientEmergencyContact.create({
        data: {
          patientId: p.id,
          contactName: emergencyContact.name,
          phone: emergencyContact.phone,
          relationship: emergencyContact.relationship,
          isPrimary: true,
        },
      });
    }

    if (allergies && allergies.length > 0) {
      await prisma.patientAllergy.deleteMany({ where: { patientId: p.id } });
      for (const allergen of allergies) {
        await prisma.patientAllergy.create({
          data: {
            patientId: p.id,
            allergenName: allergen,
            severity: 'Moderate',
            recordedBy: 'USR-006',
          },
        });
      }
    }
  }
  console.log(`✅ Seeded ${demoPatients.length} Demo Patients with Demographics, Contacts & Allergies`);

  // 6. Seed Demo Appointments
  const demoAppointments = [
    { id: 'APT-001', patientId: 'PAT-001', doctorId: 'USR-003', departmentId: 'dept-gen-med-001', branchId: accraBranch.id, appointmentDate: new Date('2026-08-22'), appointmentTime: '08:30', status: 'Checked-in', notes: 'Follow-up on hypertension medication', createdBy: 'USR-006' },
    { id: 'APT-002', patientId: 'PAT-002', doctorId: 'USR-003', departmentId: 'dept-gen-med-001', branchId: accraBranch.id, appointmentDate: new Date('2026-08-22'), appointmentTime: '09:00', status: 'In Progress', notes: 'Diabetes management review', createdBy: 'USR-006' },
    { id: 'APT-003', patientId: 'PAT-005', doctorId: 'USR-003', departmentId: 'dept-gen-med-001', branchId: accraBranch.id, appointmentDate: new Date('2026-08-22'), appointmentTime: '09:30', status: 'Scheduled', notes: 'New patient consultation', createdBy: 'USR-006' },
    { id: 'APT-004', patientId: 'PAT-007', doctorId: 'USR-003', departmentId: 'dept-gen-med-001', branchId: accraBranch.id, appointmentDate: new Date('2026-08-22'), appointmentTime: '10:00', status: 'Scheduled', notes: 'Routine check-up', createdBy: 'USR-006' },
    { id: 'APT-005', patientId: 'PAT-003', doctorId: 'USR-003', departmentId: 'dept-herbal-med-002', branchId: mankessimBranch.id, appointmentDate: new Date('2026-08-22'), appointmentTime: '08:00', status: 'Completed', notes: 'Herbal formulation review', createdBy: 'USR-006' },
    { id: 'APT-006', patientId: 'PAT-004', doctorId: 'USR-003', departmentId: 'dept-gen-med-001', branchId: accraBranch.id, appointmentDate: new Date('2026-08-22'), appointmentTime: '11:00', status: 'No-show', notes: 'Cardiac follow-up', createdBy: 'USR-006' },
  ];

  for (const appt of demoAppointments) {
    await prisma.appointment.upsert({
      where: { id: appt.id },
      update: appt,
      create: appt,
    });
  }
  console.log(`✅ Seeded ${demoAppointments.length} Demo Appointments`);

  // 7. Seed Demo Invoices, Line Items & Payments
  const demoInvoices = [
    {
      id: 'INV-2026-0041',
      patientId: 'PAT-001',
      branchId: accraBranch.id,
      visitDate: new Date('2026-08-22'),
      totalAmount: 320.00,
      paidAmount: 320.00,
      status: 'Paid',
      paymentMethod: 'Mobile Money',
      billedBy: 'USR-006',
      lineItems: [
        { itemType: 'Consultation', description: 'Consultation – General Medicine', quantity: 1, unitPrice: 80.00, lineTotal: 80.00 },
        { itemType: 'Pharmacy', description: 'Amlodipine 5mg x30', quantity: 1, unitPrice: 45.00, lineTotal: 45.00 },
        { itemType: 'Pharmacy', description: 'Lisinopril 10mg x30', quantity: 1, unitPrice: 55.00, lineTotal: 55.00 },
        { itemType: 'Laboratory', description: 'Full Blood Count', quantity: 1, unitPrice: 60.00, lineTotal: 60.00 },
        { itemType: 'Laboratory', description: 'Renal Function Test', quantity: 1, unitPrice: 80.00, lineTotal: 80.00 },
      ],
      payment: { id: 'PAY-2026-0041', amount: 320.00, method: 'Mobile Money' },
    },
    {
      id: 'INV-2026-0042',
      patientId: 'PAT-002',
      branchId: accraBranch.id,
      visitDate: new Date('2026-08-22'),
      totalAmount: 420.00,
      paidAmount: 200.00,
      status: 'Partial',
      paymentMethod: 'Cash',
      billedBy: 'USR-006',
      lineItems: [
        { itemType: 'Consultation', description: 'Consultation – General Medicine', quantity: 1, unitPrice: 80.00, lineTotal: 80.00 },
        { itemType: 'Pharmacy', description: 'Metformin 500mg x180', quantity: 1, unitPrice: 90.00, lineTotal: 90.00 },
        { itemType: 'Laboratory', description: 'HbA1c', quantity: 1, unitPrice: 120.00, lineTotal: 120.00 },
        { itemType: 'Laboratory', description: 'Fasting Blood Sugar', quantity: 1, unitPrice: 35.00, lineTotal: 35.00 },
        { itemType: 'Laboratory', description: 'Lipid Profile', quantity: 1, unitPrice: 95.00, lineTotal: 95.00 },
      ],
      payment: { id: 'PAY-2026-0042', amount: 200.00, method: 'Cash' },
    },
    {
      id: 'INV-2026-0040',
      patientId: 'PAT-004',
      branchId: accraBranch.id,
      visitDate: new Date('2026-08-20'),
      totalAmount: 630.00,
      paidAmount: 0.00,
      status: 'Unpaid',
      paymentMethod: null,
      billedBy: 'USR-006',
      lineItems: [
        { itemType: 'Consultation', description: 'Consultation – General Medicine', quantity: 1, unitPrice: 80.00, lineTotal: 80.00 },
        { itemType: 'Procedure', description: 'ECG', quantity: 1, unitPrice: 150.00, lineTotal: 150.00 },
        { itemType: 'Ward', description: 'Admission – Ward B (2 nights)', quantity: 2, unitPrice: 200.00, lineTotal: 400.00 },
      ],
      payment: null,
    },
    {
      id: 'INV-2026-0039',
      patientId: 'PAT-003',
      branchId: mankessimBranch.id,
      visitDate: new Date('2026-08-22'),
      totalAmount: 130.00,
      paidAmount: 130.00,
      status: 'Paid',
      paymentMethod: 'Cash',
      billedBy: 'USR-006',
      lineItems: [
        { itemType: 'Consultation', description: 'Herbal Consultation', quantity: 1, unitPrice: 60.00, lineTotal: 60.00 },
        { itemType: 'Pharmacy', description: 'Neem Leaf Extract 1 bottle', quantity: 1, unitPrice: 40.00, lineTotal: 40.00 },
        { itemType: 'Pharmacy', description: 'Moringa Capsules x60', quantity: 1, unitPrice: 30.00, lineTotal: 30.00 },
      ],
      payment: { id: 'PAY-2026-0039', amount: 130.00, method: 'Cash' },
    },
  ];

  for (const inv of demoInvoices) {
    const { lineItems, payment, ...invoiceData } = inv;
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: invoiceData,
      create: invoiceData,
    });

    await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: inv.id } });
    for (const item of lineItems) {
      await prisma.invoiceLineItem.create({
        data: {
          invoiceId: inv.id,
          ...item,
        },
      });
    }

    if (payment) {
      await prisma.payment.upsert({
        where: { id: payment.id },
        update: {
          amountPaid: payment.amount,
          paymentMethod: payment.method,
        },
        create: {
          id: payment.id,
          invoiceId: inv.id,
          patientId: inv.patientId,
          branchId: inv.branchId,
          amountPaid: payment.amount,
          paymentMethod: payment.method,
          receivedBy: 'USR-007',
        },
      });
    }
  }
  console.log(`✅ Seeded ${demoInvoices.length} Demo Invoices with Itemized Line Items and Payments (Total Accra Billed: GHS 1,370, Collected: GHS 520, Outstanding: GHS 850)`);

  // 8. Seed Demo Expenses
  const demoExpenses = [
    { id: 'EXP-001', description: 'August Drug Procurement — PharmaChem', category: 'Supplies', amount: 12450.00, expenseDate: new Date('2026-08-05'), approvedBy: 'USR-002', branchId: accraBranch.id, paymentMethod: 'Bank Transfer' },
    { id: 'EXP-002', description: 'Electricity Bill — August', category: 'Utilities', amount: 2340.00, expenseDate: new Date('2026-08-10'), approvedBy: 'USR-002', branchId: accraBranch.id, paymentMethod: 'Mobile Money' },
    { id: 'EXP-003', description: 'Herbal Raw Material Purchase', category: 'Supplies', amount: 1800.00, expenseDate: new Date('2026-08-05'), approvedBy: 'USR-001', branchId: mankessimBranch.id, paymentMethod: 'Cash' },
    { id: 'EXP-004', description: 'Generator Fuel — July', category: 'Utilities', amount: 890.00, expenseDate: new Date('2026-08-01'), approvedBy: 'USR-002', branchId: mankessimBranch.id, paymentMethod: 'Cash' },
    { id: 'EXP-005', description: 'AC Repair — Ward A', category: 'Maintenance', amount: 1500.00, expenseDate: new Date('2026-08-12'), approvedBy: 'USR-002', branchId: accraBranch.id, paymentMethod: 'POS' },
    { id: 'EXP-006', description: 'Staff Training Materials', category: 'Other', amount: 450.00, expenseDate: new Date('2026-08-18'), approvedBy: 'USR-001', branchId: null, paymentMethod: 'Bank Transfer' },
    { id: 'EXP-007', description: 'MediSupply Consumables', category: 'Supplies', amount: 3200.00, expenseDate: new Date('2026-08-08'), approvedBy: 'USR-002', branchId: accraBranch.id, paymentMethod: 'Bank Transfer' },
    { id: 'EXP-008', description: 'Water Bill — August', category: 'Utilities', amount: 420.00, expenseDate: new Date('2026-08-15'), approvedBy: 'USR-002', branchId: accraBranch.id, paymentMethod: 'Mobile Money' },
  ];

  for (const exp of demoExpenses) {
    await prisma.expense.upsert({
      where: { id: exp.id },
      update: exp,
      create: exp,
    });
  }
  console.log(`✅ Seeded ${demoExpenses.length} Demo Operational Expenses`);

  // 9. Seed Demo Payroll Records (August 2026)
  const demoPayroll = [
    { staffId: 'USR-003', branchId: accraBranch.id, payrollMonth: '2026-08', basicSalary: 4500.00, allowances: 800.00, deductions: 450.00, netSalary: 4850.00, status: 'Paid', processedBy: 'USR-007' },
    { staffId: 'USR-009', branchId: mankessimBranch.id, payrollMonth: '2026-08', basicSalary: 4200.00, allowances: 700.00, deductions: 420.00, netSalary: 4480.00, status: 'Paid', processedBy: 'USR-007' },
    { staffId: 'USR-005', branchId: accraBranch.id, payrollMonth: '2026-08', basicSalary: 1800.00, allowances: 300.00, deductions: 180.00, netSalary: 1920.00, status: 'Paid', processedBy: 'USR-007' },
    { staffId: 'USR-004', branchId: accraBranch.id, payrollMonth: '2026-08', basicSalary: 2200.00, allowances: 400.00, deductions: 220.00, netSalary: 2380.00, status: 'Pending', processedBy: 'USR-007' },
    { staffId: 'USR-011', branchId: accraBranch.id, payrollMonth: '2026-08', basicSalary: 1900.00, allowances: 350.00, deductions: 190.00, netSalary: 2060.00, status: 'Pending', processedBy: 'USR-007' },
    { staffId: 'USR-006', branchId: accraBranch.id, payrollMonth: '2026-08', basicSalary: 1200.00, allowances: 200.00, deductions: 120.00, netSalary: 1280.00, status: 'Paid', processedBy: 'USR-007' },
    { staffId: 'USR-007', branchId: accraBranch.id, payrollMonth: '2026-08', basicSalary: 2800.00, allowances: 500.00, deductions: 280.00, netSalary: 3020.00, status: 'Paid', processedBy: 'USR-007' },
    { staffId: 'USR-012', branchId: accraBranch.id, payrollMonth: '2026-08', basicSalary: 1400.00, allowances: 250.00, deductions: 140.00, netSalary: 1510.00, status: 'On Hold', processedBy: 'USR-007' },
    { staffId: 'USR-010', branchId: mankessimBranch.id, payrollMonth: '2026-08', basicSalary: 1500.00, allowances: 280.00, deductions: 150.00, netSalary: 1630.00, status: 'Paid', processedBy: 'USR-007' },
  ];

  for (const pr of demoPayroll) {
    await prisma.payrollRecord.upsert({
      where: {
        staffId_payrollMonth: {
          staffId: pr.staffId,
          payrollMonth: pr.payrollMonth,
        },
      },
      update: pr,
      create: pr,
    });
  }
  console.log(`✅ Seeded ${demoPayroll.length} Demo Staff Monthly Payroll Records (6 Paid, 2 Pending, 1 On Hold)`);

  // 10. Seed Demo Meetings
  const demoMeetings = [
    {
      id: 'MTG-001',
      title: 'Monthly Clinical Review',
      type: 'Staff Meeting',
      scope: 'Branch',
      targetBranchId: accraBranch.id,
      organizerId: 'USR-002',
      meetingDate: new Date('2026-08-25'),
      meetingTime: '09:00',
      duration: '2 hours',
      location: 'Conference Room A, Accra',
      agenda: '1. Review of patient outcomes for August\n2. Protocol updates for hypertension management\n3. Lab turnaround time improvement\n4. Any Other Business',
      status: 'Upcoming',
      minutes: null,
    },
    {
      id: 'MTG-002',
      title: 'Performance Review – Dr. Mensah',
      type: 'Performance Review',
      scope: 'Individual',
      targetBranchId: accraBranch.id,
      organizerId: 'USR-001',
      meetingDate: new Date('2026-08-26'),
      meetingTime: '14:00',
      duration: '1 hour',
      location: "CTO's Office, Accra",
      agenda: '1. Review of KPIs for Q2 2026\n2. Patient satisfaction scores\n3. Professional development goals\n4. Salary review',
      status: 'Upcoming',
      minutes: null,
    },
    {
      id: 'MTG-003',
      title: 'All-Hands Hospital Meeting',
      type: 'Board Meeting',
      scope: 'Hospital-wide',
      targetBranchId: null,
      organizerId: 'USR-001',
      meetingDate: new Date('2026-08-28'),
      meetingTime: '10:00',
      duration: '3 hours',
      location: 'Accra Main Hall (Mankessim via Video Call)',
      agenda: '1. H1 2026 Financial Overview\n2. Expansion Plan – New Pharmacy Wing\n3. Staff welfare updates\n4. Q3 targets and branch goals\n5. CTO technology roadmap',
      status: 'Upcoming',
      minutes: null,
    },
    {
      id: 'MTG-004',
      title: 'Herbal Production Briefing',
      type: 'Department Briefing',
      scope: 'Branch',
      targetBranchId: mankessimBranch.id,
      organizerId: 'USR-002',
      meetingDate: new Date('2026-08-22'),
      meetingTime: '07:30',
      duration: '45 minutes',
      location: 'Production Hall, Mankessim',
      agenda: '1. Batch PROD-003 QC sign-off status\n2. Raw material stock review\n3. August production targets',
      status: 'Completed',
      minutes: 'QC sign-off for Herbal Wound Balm approved by Dr. Darko. Raw material reorder to be placed by Friday. August target on track.',
    },
    {
      id: 'MTG-005',
      title: 'Staff Training – EMR System Update',
      type: 'Training',
      scope: 'Hospital-wide',
      targetBranchId: null,
      organizerId: 'USR-001',
      meetingDate: new Date('2026-09-02'),
      meetingTime: '08:00',
      duration: '4 hours',
      location: 'Training Room, Accra (Mankessim Remote)',
      agenda: '1. New features in EduHMS v2.5\n2. Updated lab order workflow\n3. Pharmacy dispense changes\n4. Hands-on session\n5. Q&A',
      status: 'Upcoming',
      minutes: null,
    },
  ];

  for (const m of demoMeetings) {
    await prisma.meeting.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }
  console.log(`✅ Seeded ${demoMeetings.length} Demo Meetings (4 Upcoming, 1 Completed; 1 Individual, 1 Branch, 2 Hospital-wide)`);

  // 11. Seed Demo Staff Chat Channels & Messages
  const demoChannels = [
    { id: 'general', name: 'general', description: 'Hospital-wide announcements and general discussion', icon: '📢', isDm: false },
    { id: 'clinical', name: 'clinical-team', description: 'Clinical staff coordination', icon: '🩺', isDm: false },
    { id: 'accra', name: 'accra-branch', description: 'Accra branch staff', icon: '🏥', isDm: false },
    { id: 'mankessim', name: 'mankessim-branch', description: 'Mankessim herbal centre staff', icon: '🌿', isDm: false },
    { id: 'pharmacy', name: 'pharmacy', description: 'Pharmacy and stock coordination', icon: '💊', isDm: false },
    { id: 'lab', name: 'laboratory', description: 'Lab team and result notifications', icon: '🔬', isDm: false },
    { id: 'admin', name: 'administration', description: 'Administrative coordination', icon: '📋', isDm: false },
  ];

  for (const ch of demoChannels) {
    await prisma.chatChannel.upsert({
      where: { id: ch.id },
      update: ch,
      create: ch,
    });
  }

  const demoMessages = [
    { id: 'MSG-001', senderId: 'USR-001', channelId: 'general', content: 'Good morning team! Reminder that the All-Hands meeting is scheduled for August 28th at 10:00 AM. Both branches to join via video call. Please make sure all departments submit their monthly reports by August 27th.', messageType: 'alert', createdAt: new Date('2026-08-22T07:00:00Z') },
    { id: 'MSG-002', senderId: 'USR-002', channelId: 'general', content: 'August payroll processing will begin on the 25th. Please ensure all timesheets are submitted to HR by end of day today.', messageType: 'text', createdAt: new Date('2026-08-22T07:15:00Z') },
    { id: 'MSG-003', senderId: 'USR-003', channelId: 'clinical', content: 'Ward round team — please note that BED-A03 (Yaw Darko) had elevated BP this morning. Adjusted antihypertensive protocol. Please monitor vitals every 2 hours and escalate if BP exceeds 150/95.', messageType: 'text', createdAt: new Date('2026-08-22T08:20:00Z') },
    { id: 'MSG-004', senderId: 'USR-005', channelId: 'clinical', content: 'Noted Dr. Mensah. Will set 2-hourly BP checks for BED-A03. Current reading at 08:00 was 138/88 — slight improvement.', messageType: 'text', createdAt: new Date('2026-08-22T08:25:00Z') },
    { id: 'MSG-005', senderId: 'USR-005', channelId: 'lab', content: 'LAB-001 results (Adjoa Mensah — FBC + RFT) are ready and submitted for approval. Dr. Mensah please check the portal when convenient.', messageType: 'text', createdAt: new Date('2026-08-22T08:55:00Z') },
    { id: 'MSG-006', senderId: 'USR-003', channelId: 'lab', content: 'Thanks. Just approved the results. Hb is slightly low — will adjust management plan. Can you also prioritize LAB-003 (Yaw Darko — Troponin) when the sample arrives?', messageType: 'text', createdAt: new Date('2026-08-22T09:05:00Z') },
    { id: 'MSG-007', senderId: 'USR-005', channelId: 'lab', content: 'Confirmed. However heads-up — Troponin I reagent is critically low (5 tests remaining). Already flagged in daily report. Waiting on store reorder.', messageType: 'text', createdAt: new Date('2026-08-22T09:08:00Z') },
    { id: 'MSG-008', senderId: 'USR-004', channelId: 'pharmacy', content: 'Stock alert: Metformin 500mg now at 180 tabs — below reorder threshold (500 tabs). Placing order with PharmaChem today. Any urgent patient needs in the next 3-4 days please let me know.', messageType: 'text', createdAt: new Date('2026-08-22T09:30:00Z') },
    { id: 'MSG-009', senderId: 'USR-002', channelId: 'admin', content: 'Reminder: Staff performance reviews for Q2 2026 are due by end of September. Department heads please ensure all your direct reports have been reviewed. Forms available on the HR module.', messageType: 'text', createdAt: new Date('2026-08-22T10:00:00Z') },
    { id: 'MSG-010', senderId: 'USR-003', channelId: 'mankessim', content: 'Neem Leaf Extract stock critically low — only 25 bottles remaining. Three patients on active neem protocol today. Please expedite the Edu Herbal Farm reorder.', messageType: 'text', createdAt: new Date('2026-08-22T10:15:00Z') },
    { id: 'MSG-011', senderId: 'USR-006', channelId: 'mankessim', content: "Order has been placed with Edu Herbal Farm this morning. Expected delivery Thursday. I'll reserve the current 25 bottles for your active patients.", messageType: 'text', createdAt: new Date('2026-08-22T10:22:00Z') },
    { id: 'MSG-012', senderId: 'USR-006', channelId: 'accra', content: 'The queue at reception is clearing up after the 10 AM rush. All morning appointments checked in. One no-show for APT-006 (Yaw Darko, 11:00 slot). Dr. Mensah please advise if you want to reschedule or note as no-show.', messageType: 'text', createdAt: new Date('2026-08-22T11:10:00Z') },
    { id: 'MSG-013', senderId: 'USR-002', channelId: 'general', content: 'Quick reminder — all department heads should confirm attendance for the August 28th All-Hands by end of today.', messageType: 'text', createdAt: new Date() },
  ];

  for (const msg of demoMessages) {
    await prisma.chatMessage.upsert({
      where: { id: msg.id },
      update: msg,
      create: msg,
    });
  }
  console.log(`✅ Seeded ${demoChannels.length} Staff Chat Channels and ${demoMessages.length} Messages`);

  // 12. Seed Demo Daily Departmental Activity Reports
  const demoReports = [
    {
      id: 'RPT-001',
      staffId: 'USR-003',
      departmentId: 'dept-gen-med-001',
      branchId: accraBranch.id,
      reportDate: new Date('2026-08-22'),
      activities: 'Conducted outpatient consultations for 18 patients. 3 referrals made to Cardiology and 2 to Paediatrics. Followed up on 4 hypertensive patients.',
      patientsHandled: 18,
      challenges: 'Intermittent delay in receiving troponin lab test results during morning shift.',
      recommendations: 'Prioritize STAT cardiac biomarker orders directly with lab desk.',
      status: 'Approved',
      reviewedBy: 'USR-001',
      reviewNotes: 'Clinical audit passed. Patient turnaround time within optimal range.',
      submittedAt: new Date('2026-08-22T17:00:00Z'),
    },
    {
      id: 'RPT-002',
      staffId: 'USR-004',
      departmentId: 'dept-pharmacy-003',
      branchId: accraBranch.id,
      reportDate: new Date('2026-08-22'),
      activities: 'Dispensed prescriptions for 32 patients. Performed physical inventory count for antihypertensives and antidiabetic medicines.',
      patientsHandled: 32,
      challenges: 'Metformin 500mg buffer stock fell below reorder threshold (180 tablets remaining).',
      recommendations: 'Place emergency reorder with primary pharmaceutical distributor.',
      status: 'Reviewed',
      reviewedBy: 'USR-002',
      reviewNotes: 'Purchase requisition PO-2026-088 approved and dispatched.',
      submittedAt: new Date('2026-08-22T17:15:00Z'),
    },
    {
      id: 'RPT-003',
      staffId: 'USR-005',
      departmentId: 'dept-lab-004',
      branchId: accraBranch.id,
      reportDate: new Date('2026-08-22'),
      activities: 'Processed 24 lab panels (Full Blood Count, Renal Function Tests, Lipid Panels). Daily QC calibration completed for Sysmex analyzer.',
      patientsHandled: 24,
      challenges: 'Troponin I test kits running low (5 tests left).',
      recommendations: 'Expedite procurement of Troponin and Liver Function reagents.',
      status: 'Reviewed',
      reviewedBy: 'USR-002',
      reviewNotes: 'Store keeper notified for restocking.',
      submittedAt: new Date('2026-08-22T17:20:00Z'),
    },
    {
      id: 'RPT-004',
      staffId: 'USR-009',
      departmentId: 'dept-herbal-med-002',
      branchId: mankessimBranch.id,
      reportDate: new Date('2026-08-22'),
      activities: 'Provided integrated herbal consultations for 16 patients. Monitored herbal tincture extraction batch PROD-003.',
      patientsHandled: 16,
      challenges: 'Neem leaf extract raw inventory requires replenishment from farm.',
      recommendations: 'Increase storage capacity for dried raw medicinal herbs.',
      status: 'Approved',
      reviewedBy: 'USR-001',
      reviewNotes: 'Herbal preparation QC approved. Expansion plan under review.',
      submittedAt: new Date('2026-08-22T17:30:00Z'),
    },
    {
      id: 'RPT-005',
      staffId: 'USR-006',
      departmentId: 'dept-triage-005',
      branchId: accraBranch.id,
      reportDate: new Date('2026-08-21'),
      activities: 'Registered 3 new patients. Checked in 14 appointment patients. Collected payments totalling GHS 1,240. Answered 22 phone inquiries. Updated appointment schedule for tomorrow. Directed 5 walk-ins to appropriate departments.',
      patientsHandled: 14,
      challenges: 'Double-booking issue in morning slot caused minor delays at triage desk.',
      recommendations: 'Implement appointment confirmation SMS 24 hours prior. Consider adding self-check-in option.',
      status: 'Noted',
      reviewedBy: 'USR-002',
      reviewNotes: 'Good initiative. Appointment SMS reminders being evaluated. Double-booking issue raised with IT.',
      submittedAt: new Date('2026-08-21T17:30:00Z'),
    },
    {
      id: 'RPT-006',
      staffId: 'USR-010',
      departmentId: 'dept-ward-a-007',
      branchId: accraBranch.id,
      reportDate: new Date('2026-08-21'),
      activities: 'Administered IV medication rounds and monitored vitals for 12 admitted ward patients. Monitored post-op recovery in Ward Bed A01.',
      patientsHandled: 12,
      challenges: 'Patient in BED-A03 required extra nighttime monitoring due to elevated blood pressure.',
      recommendations: 'Maintain 2-hourly vital checks on BED-A03.',
      status: 'Approved',
      reviewedBy: 'USR-002',
      reviewNotes: 'Care plan updated and verified.',
      submittedAt: new Date('2026-08-21T18:00:00Z'),
    },
  ];

  for (const report of demoReports) {
    await prisma.dailyReport.upsert({
      where: {
        staffId_reportDate: {
          staffId: report.staffId,
          reportDate: report.reportDate,
        },
      },
      update: report,
      create: report,
    });
  }
  console.log(`✅ Seeded ${demoReports.length} Daily Departmental Reports (including RPT-005 for Kwabena Appiah)`);

  // 13. Seed Demo Wards & Beds (Exact Alignment: Ward A, B, C in Accra; Ward D in Mankessim)
  const wardA = await prisma.ward.upsert({
    where: { id: 'ward-accra-001' },
    update: {
      name: 'Ward A (General)',
      branchId: accraBranch.id,
      genderAllocation: 'Mixed',
      totalBeds: 4,
      isActive: true,
    },
    create: {
      id: 'ward-accra-001',
      name: 'Ward A (General)',
      branchId: accraBranch.id,
      genderAllocation: 'Mixed',
      totalBeds: 4,
      isActive: true,
    },
  });

  const wardB = await prisma.ward.upsert({
    where: { id: 'ward-accra-002' },
    update: {
      name: 'Ward B (Male)',
      branchId: accraBranch.id,
      genderAllocation: 'Male',
      totalBeds: 3,
      isActive: true,
    },
    create: {
      id: 'ward-accra-002',
      name: 'Ward B (Male)',
      branchId: accraBranch.id,
      genderAllocation: 'Male',
      totalBeds: 3,
      isActive: true,
    },
  });

  const wardC = await prisma.ward.upsert({
    where: { id: 'ward-accra-003' },
    update: {
      name: 'Ward C (Female)',
      branchId: accraBranch.id,
      genderAllocation: 'Female',
      totalBeds: 2,
      isActive: true,
    },
    create: {
      id: 'ward-accra-003',
      name: 'Ward C (Female)',
      branchId: accraBranch.id,
      genderAllocation: 'Female',
      totalBeds: 2,
      isActive: true,
    },
  });

  const wardD = await prisma.ward.upsert({
    where: { id: 'ward-mank-001' },
    update: {
      name: 'Ward D (Mankessim)',
      branchId: mankessimBranch.id,
      genderAllocation: 'Mixed',
      totalBeds: 3,
      isActive: true,
    },
    create: {
      id: 'ward-mank-001',
      name: 'Ward D (Mankessim)',
      branchId: mankessimBranch.id,
      genderAllocation: 'Mixed',
      totalBeds: 3,
      isActive: true,
    },
  });

  const demoBeds = [
    // Ward A (General): 2/4 occupied, 1 available, 1 maintenance
    { id: 'BED-A01', wardId: wardA.id, branchId: accraBranch.id, bedNumber: 'A-01', status: 'Occupied' },
    { id: 'BED-A02', wardId: wardA.id, branchId: accraBranch.id, bedNumber: 'A-02', status: 'Available' },
    { id: 'BED-A03', wardId: wardA.id, branchId: accraBranch.id, bedNumber: 'A-03', status: 'Occupied' },
    { id: 'BED-A04', wardId: wardA.id, branchId: accraBranch.id, bedNumber: 'A-04', status: 'Maintenance' },
    // Ward B (Male): 1/3 occupied, 2 available
    { id: 'BED-B01', wardId: wardB.id, branchId: accraBranch.id, bedNumber: 'B-01', status: 'Available' },
    { id: 'BED-B02', wardId: wardB.id, branchId: accraBranch.id, bedNumber: 'B-02', status: 'Occupied' },
    { id: 'BED-B03', wardId: wardB.id, branchId: accraBranch.id, bedNumber: 'B-03', status: 'Available' },
    // Ward C (Female): 1/2 occupied, 1 available
    { id: 'BED-C01', wardId: wardC.id, branchId: accraBranch.id, bedNumber: 'C-01', status: 'Occupied' },
    { id: 'BED-C02', wardId: wardC.id, branchId: accraBranch.id, bedNumber: 'C-02', status: 'Available' },
    // Ward D (Mankessim): 1/3 occupied, 2 available
    { id: 'BED-M01', wardId: wardD.id, branchId: mankessimBranch.id, bedNumber: 'D-01', status: 'Occupied' },
    { id: 'BED-M02', wardId: wardD.id, branchId: mankessimBranch.id, bedNumber: 'D-02', status: 'Available' },
    { id: 'BED-M03', wardId: wardD.id, branchId: mankessimBranch.id, bedNumber: 'D-03', status: 'Available' },
  ];

  for (const bed of demoBeds) {
    await prisma.wardBed.upsert({
      where: { id: bed.id },
      update: bed,
      create: bed,
    });
  }

  const demoAdmissions = [
    { id: 'ADM-001', patientId: 'PAT-005', bedId: 'BED-A01', doctorId: 'USR-003', branchId: accraBranch.id, admissionDate: new Date('2026-08-20'), admissionDiagnosis: 'Post-operative recovery & monitoring', status: 'Admitted' },
    { id: 'ADM-002', patientId: 'PAT-004', bedId: 'BED-A03', doctorId: 'USR-003', branchId: accraBranch.id, admissionDate: new Date('2026-08-21'), admissionDiagnosis: 'Hypertension and cardiac observation', status: 'Admitted' },
    { id: 'ADM-003', patientId: 'PAT-002', bedId: 'BED-B02', doctorId: 'USR-003', branchId: accraBranch.id, admissionDate: new Date('2026-08-19'), admissionDiagnosis: 'Type 2 Diabetes Mellitus glycemic monitoring', status: 'Admitted' },
    { id: 'ADM-004', patientId: 'PAT-007', bedId: 'BED-C01', doctorId: 'USR-003', branchId: accraBranch.id, admissionDate: new Date('2026-08-22'), admissionDiagnosis: 'Febrile illness / IV fluid therapy', status: 'Admitted' },
    { id: 'ADM-005', patientId: 'PAT-006', bedId: 'BED-M01', doctorId: 'USR-004', branchId: mankessimBranch.id, admissionDate: new Date('2026-08-18'), admissionDiagnosis: 'Chronic back pain herbal protocol', status: 'Admitted' },
  ];

  for (const adm of demoAdmissions) {
    await prisma.admission.upsert({
      where: { id: adm.id },
      update: adm,
      create: adm,
    });
  }
  console.log(`✅ Seeded ${demoBeds.length} Ward Beds and ${demoAdmissions.length} Active Inpatient Admissions (Accra: 4 occupied · 4 available · 1 maintenance · 9 total beds)`);


  // 14. Seed Demo Stock Items (Exact Alignment with Frontend: 6 in Accra, 3 Low Stock)
  const demoStockItems = [
    { id: 'STK-001', name: 'Amlodipine 5mg', category: 'Drug', branchId: accraBranch.id, unit: 'Tabs', quantity: 450, reorderLevel: 200 },
    { id: 'STK-002', name: 'Metformin 500mg', category: 'Drug', branchId: accraBranch.id, unit: 'Tabs', quantity: 180, reorderLevel: 500 },
    { id: 'STK-003', name: 'Paracetamol 500mg', category: 'Drug', branchId: accraBranch.id, unit: 'Tabs', quantity: 1200, reorderLevel: 500 },
    { id: 'STK-004', name: 'Lisinopril 10mg', category: 'Drug', branchId: accraBranch.id, unit: 'Tabs', quantity: 60, reorderLevel: 200 },
    { id: 'STK-005', name: 'Neem Leaf Extract', category: 'Herbal', branchId: mankessimBranch.id, unit: 'Bottles (500ml)', quantity: 25, reorderLevel: 50 },
    { id: 'STK-006', name: 'Moringa Capsules', category: 'Herbal', branchId: mankessimBranch.id, unit: 'Caps', quantity: 300, reorderLevel: 200 },
    { id: 'STK-007', name: 'IV Cannula 22G', category: 'Consumable', branchId: accraBranch.id, unit: 'Pcs', quantity: 80, reorderLevel: 100 },
    { id: 'STK-008', name: 'Raw Neem Leaves (Dried)', category: 'Raw Material', branchId: mankessimBranch.id, unit: 'kg', quantity: 12, reorderLevel: 30 },
    { id: 'STK-009', name: 'Amoxicillin 500mg', category: 'Drug', branchId: accraBranch.id, unit: 'Caps', quantity: 600, reorderLevel: 300 },
    { id: 'STK-010', name: 'Artemether/Lumefantrine', category: 'Drug', branchId: mankessimBranch.id, unit: 'Tabs', quantity: 90, reorderLevel: 150 },
  ];

  for (const item of demoStockItems) {
    await prisma.stockItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`✅ Seeded ${demoStockItems.length} Stock Items (Accra: 6 items, exactly 3 Low Stock)`);

  // 16. Seed Demo Suppliers (Exact Alignment with Supplier Directory)
  const demoSuppliers = [
    {
      id: 'SUP-001',
      name: 'PharmaChem Ghana Ltd',
      contactPerson: 'Kojo Acheampong',
      phone: '+233 30 277 8800',
      email: 'orders@pharmachm.gh',
      address: 'Industrial Area, Accra',
      supplierType: 'Drug',
      paymentTerms: 'Net 30 days',
      rating: 4.5,
      lastOrderDate: new Date('2026-07-28'),
      branchId: accraBranch.id,
      active: true,
    },
    {
      id: 'SUP-002',
      name: 'HealthMeds Ltd',
      contactPerson: 'Abena Frempong',
      phone: '+233 24 444 5566',
      email: 'supply@healthmeds.gh',
      address: 'Spintex Road, Accra',
      supplierType: 'Drug',
      paymentTerms: 'Net 15 days',
      rating: 4.2,
      lastOrderDate: new Date('2026-08-10'),
      branchId: accraBranch.id,
      active: true,
    },
    {
      id: 'SUP-003',
      name: 'Edu Herbal Farm',
      contactPerson: 'Kwabena Asare',
      phone: '+233 23 111 2233',
      email: 'farm@eduherbal.gh',
      address: 'Mankessim Road, Central Region',
      supplierType: 'Herbal',
      paymentTerms: 'On delivery',
      rating: 4.8,
      lastOrderDate: new Date('2026-08-05'),
      branchId: mankessimBranch.id,
      active: true,
    },
    {
      id: 'SUP-004',
      name: 'MediSupply Ghana',
      contactPerson: 'Yaa Mensah',
      phone: '+233 20 333 4455',
      email: 'procurement@medisupply.gh',
      address: 'Tema, Greater Accra',
      supplierType: 'Consumable',
      paymentTerms: 'Net 30 days',
      rating: 4.0,
      lastOrderDate: new Date('2026-08-01'),
      branchId: accraBranch.id,
      active: true,
    },
    {
      id: 'SUP-005',
      name: 'NovaMed International',
      contactPerson: 'Samuel Kyei',
      phone: '+233 24 777 8899',
      email: 'sales@novamed.com',
      address: 'Airport City, Accra',
      supplierType: 'Drug',
      paymentTerms: 'Prepayment',
      rating: 3.8,
      lastOrderDate: new Date('2026-06-20'),
      branchId: mankessimBranch.id,
      active: true,
    },
    {
      id: 'SUP-006',
      name: 'BioEquip Africa',
      contactPerson: 'Ama Darko',
      phone: '+233 30 200 1122',
      email: 'info@bioequip.africa',
      address: 'East Legon, Accra',
      supplierType: 'Equipment',
      paymentTerms: 'Net 60 days',
      rating: 4.3,
      lastOrderDate: new Date('2026-05-15'),
      branchId: accraBranch.id,
      active: false,
    },
  ];

  for (const sup of demoSuppliers) {
    await prisma.supplier.upsert({
      where: { id: sup.id },
      update: sup,
      create: sup,
    });
  }
  console.log(`✅ Seeded ${demoSuppliers.length} Suppliers (Accra: exactly 3 Active Suppliers, 1 Inactive)`);

  // 17. Seed Demo Batches Linking Stock Items to Suppliers & Expiry
  const demoBatches = [
    { stockItemId: 'STK-001', batchNumber: 'BT-2025-0012', supplierId: 'SUP-001', quantity: 450, expiryDate: new Date('2027-06-30') },
    { stockItemId: 'STK-002', batchNumber: 'BT-2025-0015', supplierId: 'SUP-001', quantity: 180, expiryDate: new Date('2027-03-31') },
    { stockItemId: 'STK-003', batchNumber: 'BT-2025-0022', supplierId: 'SUP-002', quantity: 1200, expiryDate: new Date('2028-01-31') },
    { stockItemId: 'STK-004', batchNumber: 'BT-2025-0008', supplierId: 'SUP-001', quantity: 60, expiryDate: new Date('2026-12-31') },
    { stockItemId: 'STK-005', batchNumber: 'HB-2025-0003', supplierId: 'SUP-003', quantity: 25, expiryDate: new Date('2026-11-30') },
    { stockItemId: 'STK-006', batchNumber: 'HB-2025-0005', supplierId: 'SUP-003', quantity: 300, expiryDate: new Date('2027-04-30') },
    { stockItemId: 'STK-007', batchNumber: 'CS-2025-0031', supplierId: 'SUP-004', quantity: 80, expiryDate: new Date('2028-06-30') },
    { stockItemId: 'STK-008', batchNumber: 'RM-2025-0001', supplierId: 'SUP-003', quantity: 12, expiryDate: new Date('2026-10-31') },
    { stockItemId: 'STK-009', batchNumber: 'BT-2025-0019', supplierId: 'SUP-002', quantity: 600, expiryDate: new Date('2027-09-30') },
    { stockItemId: 'STK-010', batchNumber: 'BT-2025-0011', supplierId: 'SUP-005', quantity: 90, expiryDate: new Date('2027-02-28') },
  ];

  await prisma.stockBatch.deleteMany();
  for (const b of demoBatches) {
    await prisma.stockBatch.create({
      data: {
        stockItemId: b.stockItemId,
        batchNumber: b.batchNumber,
        supplierId: b.supplierId,
        quantity: b.quantity,
        expiryDate: b.expiryDate,
        dateReceived: new Date('2026-08-01'),
      },
    });
  }
  console.log(`✅ Seeded ${demoBatches.length} Stock Batches with FEFO Expiries and Supplier Links`);

  // 17. Seed Demo Consultations & Patient Vitals (Conventional & Herbal EMR)
  const demoConsultations = [
    {
      id: 'CNS-001',
      appointmentId: 'APT-001',
      patientId: 'PAT-001',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      consultationType: 'Conventional',
      chiefComplaint: 'Headache, palpitations, and mild dizziness for 5 days.',
      primaryDiagnosis: 'Essential Hypertension (Stage 2)',
      treatmentPlan: 'Amlodipine 5mg + Lisinopril 10mg daily. Low salt diet. Follow up in 30 days.',
      doctorNotes: 'BP elevated at 145/95 mmHg upon triage. Recommended DASH diet and lifestyle modification.',
      createdAt: new Date('2026-08-22T08:00:00Z'),
      vitals: {
        bpSystolic: 145,
        bpDiastolic: 95,
        pulseRate: 78,
        temperature: 36.7,
        weightKg: 68.0,
        heightCm: 168.0,
        bloodSugar: 5.6,
        recordedBy: 'USR-003',
      },
    },
    {
      id: 'CNS-002',
      appointmentId: 'APT-002',
      patientId: 'PAT-002',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      consultationType: 'Conventional',
      chiefComplaint: 'Polyuria, polydipsia, and fatigue for 2 weeks.',
      primaryDiagnosis: 'Type 2 Diabetes Mellitus',
      treatmentPlan: 'Metformin 500mg BD. Order HbA1c and Lipid profile. Dietary counselling.',
      doctorNotes: 'Fasting blood glucose elevated at 8.2 mmol/L. Referred to nutritionist.',
      createdAt: new Date('2026-08-22T08:15:00Z'),
      vitals: {
        bpSystolic: 130,
        bpDiastolic: 85,
        pulseRate: 76,
        temperature: 36.5,
        weightKg: 82.0,
        heightCm: 175.0,
        bloodSugar: 8.2,
        recordedBy: 'USR-003',
      },
    },
    {
      id: 'CNS-003',
      appointmentId: null,
      patientId: 'PAT-003',
      doctorId: 'USR-004',
      branchId: mankessimBranch.id,
      consultationType: 'Herbal',
      chiefComplaint: 'Chronic joint stiffness, fatigue, and low vitality.',
      primaryDiagnosis: 'Traditional constitutional imbalance; sluggish Qi and joint inflammation',
      treatmentPlan: 'Neem Leaf Extract + Moringa Capsules. Herbal tea twice daily. Follow up in 14 days.',
      doctorNotes: 'Patient prefers herbal/traditional holistic treatment. Constitution: Pitta/Kapha tendency.',
      createdAt: new Date('2026-08-22T08:00:00Z'),
      vitals: {
        bpSystolic: 120,
        bpDiastolic: 80,
        pulseRate: 72,
        temperature: 36.6,
        weightKg: 65.0,
        heightCm: 170.0,
        bloodSugar: 5.5,
        recordedBy: 'USR-004',
      },
    },
  ];

  for (const c of demoConsultations) {
    const { vitals, ...consultationData } = c;
    await prisma.consultation.upsert({
      where: { id: c.id },
      update: consultationData,
      create: consultationData,
    });

    await prisma.patientVitals.deleteMany({ where: { consultationId: c.id } });
    if (vitals) {
      await prisma.patientVitals.create({
        data: {
          patientId: c.patientId,
          consultationId: c.id,
          ...vitals,
        },
      });
    }
  }
  console.log(`✅ Seeded ${demoConsultations.length} Clinical Consultations (Conventional & Herbal) with Linked Vitals`);

  // 18. Seed Demo Prescriptions & Prescription Items (Exact Alignment with Prescription Queue)
  const demoPrescriptions = [
    {
      id: 'RX-001',
      consultationId: 'CNS-001',
      patientId: 'PAT-001',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      prescriptionType: 'Conventional',
      status: 'Dispensed',
      dispensedBy: 'USR-006',
      dispensedAt: new Date('2026-08-22T08:35:00Z'),
      createdAt: new Date('2026-08-22T08:15:00Z'),
      items: [

        { drugName: 'Amlodipine 5mg', dosage: '5mg', frequency: 'Once daily', duration: '30 days', quantityPrescribed: 30, quantityDispensed: 30, itemStatus: 'Dispensed', stockItemId: 'STK-001' },
        { drugName: 'Lisinopril 10mg', dosage: '10mg', frequency: 'Once daily', duration: '30 days', quantityPrescribed: 30, quantityDispensed: 30, itemStatus: 'Dispensed', stockItemId: 'STK-004' },
      ],
    },
    {
      id: 'RX-002',
      consultationId: 'CNS-002',
      patientId: 'PAT-002',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      prescriptionType: 'Conventional',
      status: 'Dispensed',
      dispensedBy: 'USR-006',
      dispensedAt: new Date('2026-08-22T08:35:00Z'),
      createdAt: new Date('2026-08-22T08:15:00Z'),
      items: [
        { drugName: 'Metformin 500mg', dosage: '500mg', frequency: 'Twice daily', duration: '90 days', quantityPrescribed: 180, quantityDispensed: 180, itemStatus: 'Dispensed', stockItemId: 'STK-002' },
      ],
    },
    {
      id: 'RX-003',
      consultationId: 'CNS-003',
      patientId: 'PAT-003',
      doctorId: 'USR-004',
      branchId: mankessimBranch.id,
      prescriptionType: 'Herbal',
      status: 'Pending',
      createdAt: new Date('2026-08-22T08:00:00Z'),
      items: [
        { drugName: 'Neem Leaf Extract', dosage: '10ml', frequency: 'Three times daily', duration: '14 days', quantityPrescribed: 1, quantityDispensed: 0, itemStatus: 'Pending', stockItemId: 'STK-005' },
        { drugName: 'Moringa Capsules', dosage: '500mg', frequency: 'Twice daily', duration: '30 days', quantityPrescribed: 60, quantityDispensed: 0, itemStatus: 'Pending', stockItemId: 'STK-006' },
      ],
    },
    {
      id: 'RX-004',
      patientId: 'PAT-005',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      prescriptionType: 'Conventional',
      status: 'Partial',
      createdAt: new Date('2026-08-21T10:00:00Z'),
      items: [
        { drugName: 'Paracetamol 500mg', dosage: '500mg', frequency: 'Every 8 hours', duration: '5 days', quantityPrescribed: 15, quantityDispensed: 0, itemStatus: 'Pending', stockItemId: 'STK-003' },
      ],
    },
  ];

  for (const rx of demoPrescriptions) {
    const { items, ...rxData } = rx;
    await prisma.prescription.upsert({
      where: { id: rx.id },
      update: rxData,
      create: rxData,
    });

    await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: rx.id } });
    for (const item of items) {
      await prisma.prescriptionItem.create({
        data: {
          prescriptionId: rx.id,
          ...item,
        },
      });
    }
  }
  console.log(`✅ Seeded ${demoPrescriptions.length} Prescriptions (Accra: RX-001 & RX-002 Dispensed, RX-004 Partial with Confirm Dispense)`);

  // 15. Seed Demo Laboratory Orders (3 Pending/Awaiting, 1 Completed with PDF)
  const demoLabOrders = [
    {
      id: 'LAB-001',
      consultationId: 'CNS-001',
      patientId: 'PAT-001',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      priority: 'Routine',
      status: 'Awaiting Approval',
      resultSummary: 'Hb: 11.2 g/dL (Low), WBC: 7.2 x10³/μL (Normal), Creatinine: 0.9 mg/dL (Normal)',
      technicianId: 'USR-007',
      items: [
        { testName: 'Full Blood Count', flag: 'Abnormal' },
        { testName: 'Renal Function Test', flag: 'Normal' },
      ],
    },
    {
      id: 'LAB-002',
      consultationId: 'CNS-002',
      patientId: 'PAT-002',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      priority: 'Urgent',
      status: 'In Progress',
      resultSummary: null,
      technicianId: 'USR-007',
      items: [
        { testName: 'HbA1c', flag: 'Normal' },
        { testName: 'Fasting Blood Sugar', flag: 'Normal' },
        { testName: 'Lipid Profile', flag: 'Normal' },
      ],
    },
    {
      id: 'LAB-003',
      patientId: 'PAT-004',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      priority: 'STAT',
      status: 'Pending',
      resultSummary: null,
      technicianId: 'USR-007',
      items: [
        { testName: 'ECG', flag: 'Normal' },
        { testName: 'Troponin I', flag: 'Normal' },
        { testName: 'BNP', flag: 'Normal' },
      ],
    },
    {
      id: 'LAB-004',
      patientId: 'PAT-007',
      doctorId: 'USR-012',
      branchId: accraBranch.id,
      priority: 'Routine',
      status: 'Completed',
      resultSummary: 'Malaria RDT: Negative. Hb: 12.1 g/dL (Normal). WBC: 8.5 x10³/μL (Normal)',
      technicianId: 'USR-007',
      approvedByDoctorId: 'USR-012',
      approvedAt: new Date('2026-08-21T15:30:00Z'),
      items: [
        { testName: 'Malaria RDT', flag: 'Normal' },
        { testName: 'Full Blood Count', flag: 'Normal' },
      ],
      attachment: {
        fileName: 'LAB-004_FBC_RDT_Abena_Kyei.pdf',
        filePathUrl: '/uploads/lab/LAB-004_FBC_RDT_Abena_Kyei.pdf',
        fileSizeKb: 284,
        uploadedBy: 'USR-007',
      },
    },
  ];

  for (const lab of demoLabOrders) {
    const { items, attachment, ...labData } = lab as any;
    await prisma.labOrder.upsert({
      where: { id: lab.id },
      update: labData,
      create: labData,
    });

    await prisma.labOrderItem.deleteMany({ where: { labOrderId: lab.id } });
    for (const item of items) {
      await prisma.labOrderItem.create({
        data: {
          labOrderId: lab.id,
          testName: item.testName,
          flag: item.flag,
        },
      });
    }

    if (attachment) {
      await prisma.labAttachment.deleteMany({ where: { labOrderId: lab.id } });
      await prisma.labAttachment.create({
        data: {
          labOrderId: lab.id,
          fileName: attachment.fileName,
          filePathUrl: attachment.filePathUrl,
          fileSizeKb: attachment.fileSizeKb,
          uploadedBy: attachment.uploadedBy,
        },
      });
    }
  }
  // 19. Seed Demo Nursing Notes (4 Inpatient Notes Today)
  const demoNursingNotes = [
    {
      id: 'NN-001',
      admissionId: 'ADM-001',
      patientId: 'PAT-005',
      bedId: 'BED-A01',
      nurseId: 'USR-005',
      noteType: 'Medication',
      vitalsBp: '128/84',
      vitalsPulse: '76',
      vitalsTemp: '36.8',
      vitalsSpo2: '98%',
      clinicalNote: 'Patient rested well. Morning vitals stable. Amlodipine administered at 06:00. Patient reports mild headache, paracetamol administered.',
      recordedAt: new Date('2026-08-22T06:00:00Z'),
    },
    {
      id: 'NN-002',
      admissionId: 'ADM-002',
      patientId: 'PAT-004',
      bedId: 'BED-A03',
      nurseId: 'USR-005',
      noteType: 'Observation',
      vitalsBp: '142/92',
      vitalsPulse: '88',
      vitalsTemp: '37.1',
      vitalsSpo2: '96%',
      clinicalNote: 'BP slightly elevated compared to yesterday. Informed Dr. Mensah. Patient ambulatory, ate breakfast well. ECG leads in place.',
      recordedAt: new Date('2026-08-22T06:15:00Z'),
    },
    {
      id: 'NN-003',
      admissionId: 'ADM-003',
      patientId: 'PAT-002',
      bedId: 'BED-B02',
      nurseId: 'USR-005',
      noteType: 'Routine',
      vitalsBp: '130/80',
      vitalsPulse: '72',
      vitalsTemp: '36.5',
      vitalsSpo2: '99%',
      clinicalNote: 'Fasting blood sugar 8.2 mmol/L. Pre-breakfast Metformin held. Awaiting dietary consult.',
      recordedAt: new Date('2026-08-22T06:30:00Z'),
    },
    {
      id: 'NN-004',
      admissionId: 'ADM-004',
      patientId: 'PAT-007',
      bedId: 'BED-C01',
      nurseId: 'USR-005',
      noteType: 'Medication',
      vitalsBp: '110/70',
      vitalsPulse: '90',
      vitalsTemp: '37.4',
      vitalsSpo2: '97%',
      clinicalNote: 'Patient admitted at 22:00 yesterday. Mild fever overnight, paracetamol given at 00:00. Temperature reduced. IV fluids running at 125ml/hr.',
      recordedAt: new Date('2026-08-22T07:00:00Z'),
    },
  ];

  for (const nn of demoNursingNotes) {
    await prisma.nursingNote.upsert({
      where: { id: nn.id },
      update: nn,
      create: nn,
    });
  }
  console.log(`✅ Seeded ${demoNursingNotes.length} Demo Nursing Notes (4 Inpatients Charted Today)`);

  // 20. Seed Demo Call Logs (3 in Accra, 1 in Mankessim; 1 Open Complaint, 1 Follow-up Scheduled)
  const demoCallLogs = [
    {
      id: 'CL-001',
      patientId: 'PAT-001',
      patientName: 'Adjoa Mensah',
      agentId: 'USR-010',
      branchId: accraBranch.id,
      reason: 'Appointment Inquiry',
      notes: 'Patient called to confirm appointment time. Confirmed 8:30 AM slot.',
      outcome: 'Resolved',
      callDate: new Date('2026-08-21T14:23:00Z'),
      followUpDate: null,
    },
    {
      id: 'CL-002',
      patientId: null,
      patientName: 'Anonymous',
      agentId: 'USR-010',
      branchId: accraBranch.id,
      reason: 'New Patient Inquiry',
      notes: 'Caller inquired about herbal treatment for chronic back pain. Directed to Mankessim branch.',
      outcome: 'Follow-up Scheduled',
      callDate: new Date('2026-08-21T15:10:00Z'),
      followUpDate: new Date('2026-08-25'),
    },
    {
      id: 'CL-003',
      patientId: 'PAT-002',
      patientName: 'Kofi Acheampong',
      agentId: 'USR-010',
      branchId: accraBranch.id,
      reason: 'Complaint – Waiting Time',
      notes: 'Patient complained about 45-minute wait beyond appointment time. Apology extended.',
      outcome: 'Complaint',
      callDate: new Date('2026-08-20T10:45:00Z'),
      followUpDate: null,
    },
    {
      id: 'CL-004',
      patientId: 'PAT-003',
      patientName: 'Akua Boafo',
      agentId: 'USR-010',
      branchId: mankessimBranch.id,
      reason: 'Medication Query',
      notes: 'Patient asked about dosage instructions for Neem extract. Advised per prescription.',
      outcome: 'Resolved',
      callDate: new Date('2026-08-22T09:15:00Z'),
      followUpDate: null,
    },
  ];

  for (const cl of demoCallLogs) {
    await prisma.callLog.upsert({
      where: { id: cl.id },
      update: cl,
      create: cl,
    });
  }
  console.log(`✅ Seeded ${demoCallLogs.length} Demo Call Logs (Accra: 3 calls · 1 open complaints · 1 follow-ups)`);

  // 21. Seed Demo Patient Follow-ups & Reviews (Accra: 1 Overdue · 1 Due · 1 Completed)
  const demoFollowUps = [
    {
      id: 'FU-001',
      patientId: 'PAT-001',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      condition: 'Hypertension — Medication Review',
      dueDate: new Date('2026-08-22'),
      lastVisit: new Date('2026-07-22'),
      status: 'Due',
      notes: null,
      effectiveness: null,
      nextDate: null,
    },
    {
      id: 'FU-002',
      patientId: 'PAT-002',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      condition: 'Type 2 Diabetes — HbA1c Review',
      dueDate: new Date('2026-08-15'),
      lastVisit: new Date('2026-07-15'),
      status: 'Overdue',
      notes: null,
      effectiveness: null,
      nextDate: null,
    },
    {
      id: 'FU-003',
      patientId: 'PAT-003',
      doctorId: 'USR-004',
      branchId: mankessimBranch.id,
      condition: 'Herbal Treatment — 2-Week Review',
      dueDate: new Date('2026-09-05'),
      lastVisit: new Date('2026-08-22'),
      status: 'Due',
      notes: null,
      effectiveness: null,
      nextDate: null,
    },
    {
      id: 'FU-004',
      patientId: 'PAT-006',
      doctorId: 'USR-004',
      branchId: mankessimBranch.id,
      condition: 'Chronic Back Pain — Herbal Protocol',
      dueDate: new Date('2026-08-10'),
      lastVisit: new Date('2026-07-10'),
      status: 'Overdue',
      notes: null,
      effectiveness: null,
      nextDate: null,
    },
    {
      id: 'FU-005',
      patientId: 'PAT-005',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      condition: 'Post-operative Review',
      dueDate: new Date('2026-08-20'),
      lastVisit: new Date('2026-08-06'),
      status: 'Completed',
      notes: 'Wound healing well. No signs of infection. Patient discharged from follow-up protocol.',
      effectiveness: 'Excellent',
      nextDate: null,
    },
    {
      id: 'FU-006',
      patientId: 'PAT-008',
      doctorId: 'USR-004',
      branchId: mankessimBranch.id,
      condition: 'Arthritis — Herbal Pain Management',
      dueDate: new Date('2026-08-29'),
      lastVisit: new Date('2026-07-29'),
      status: 'Due',
      notes: null,
      effectiveness: null,
      nextDate: null,
    },
  ];

  for (const fu of demoFollowUps) {
    await prisma.patientFollowUp.upsert({
      where: { id: fu.id },
      update: fu,
      create: fu,
    });
  }
  console.log(`✅ Seeded ${demoFollowUps.length} Demo Follow-up Reviews (Accra: 1 overdue · 1 due · 1 completed)`);

  // 22. Seed Demo Herbal Production Batches (0 Mixing, 1 Processing, 1 QC, 1 Packaging, 1 Completed)
  const demoProductionBatches = [
    {
      id: 'PROD-001',
      productName: 'Neem Leaf Extract 500ml',
      batchNumber: 'HB-2025-0003',
      stage: 'Completed',
      startDate: new Date('2025-10-01'),
      completionDate: new Date('2025-10-15'),
      expiryDate: new Date('2026-11-30'),
      plannedQuantity: 200,
      qcApproverId: 'USR-004',
      notes: 'Standard production run. All QC checks passed.',
    },
    {
      id: 'PROD-002',
      productName: 'Moringa Capsules',
      batchNumber: 'HB-2025-0005',
      stage: 'Packaging',
      startDate: new Date('2025-11-15'),
      completionDate: null,
      expiryDate: null,
      plannedQuantity: 500,
      qcApproverId: 'USR-004',
      notes: 'QC approved. In final packaging stage.',
    },
    {
      id: 'PROD-003',
      productName: 'Herbal Wound Balm 100g',
      batchNumber: 'HB-2026-0001',
      stage: 'QC',
      startDate: new Date('2026-08-10'),
      completionDate: null,
      expiryDate: null,
      plannedQuantity: 150,
      qcApproverId: null,
      notes: 'Awaiting QC sign-off from chief physician.',
    },
    {
      id: 'PROD-004',
      productName: 'Ginger-Turmeric Tonic 250ml',
      batchNumber: 'HB-2026-0002',
      stage: 'Processing',
      startDate: new Date('2026-08-18'),
      completionDate: null,
      expiryDate: null,
      plannedQuantity: 300,
      qcApproverId: null,
      notes: 'Steam extraction in progress.',
    },
  ];

  for (const pb of demoProductionBatches) {
    await prisma.productionBatch.upsert({
      where: { id: pb.id },
      update: pb,
      create: pb,
    });
  }
  console.log(`✅ Seeded ${demoProductionBatches.length} Herbal Production Batches (0 Mixing, 1 Processing, 1 QC, 1 Packaging, 1 Completed)`);

  // 23. Seed Demo HR Leave Requests (2 Pending in Accra: Yaa Frimpong & Nana Agyei)
  const demoLeaveRequests = [
    {
      id: 'LV-001',
      staffId: 'USR-003',
      branchId: accraBranch.id,
      leaveType: 'Annual',
      fromDate: new Date('2026-09-01'),
      toDate: new Date('2026-09-07'),
      days: 7,
      reason: 'Family vacation',
      status: 'Approved',
      approvedBy: 'USR-001',
    },
    {
      id: 'LV-002',
      staffId: 'USR-005',
      branchId: accraBranch.id,
      leaveType: 'Sick',
      fromDate: new Date('2026-08-19'),
      toDate: new Date('2026-08-21'),
      days: 3,
      reason: 'Flu and fever',
      status: 'Approved',
      approvedBy: 'USR-002',
    },
    {
      id: 'LV-003',
      staffId: 'USR-007',
      branchId: accraBranch.id,
      leaveType: 'Study',
      fromDate: new Date('2026-09-15'),
      toDate: new Date('2026-09-19'),
      days: 5,
      reason: 'Professional Development — MLSCG Annual Conference',
      status: 'Pending',
      approvedBy: null,
    },
    {
      id: 'LV-004',
      staffId: 'USR-010',
      branchId: accraBranch.id,
      leaveType: 'Annual',
      fromDate: new Date('2026-08-25'),
      toDate: new Date('2026-08-29'),
      days: 5,
      reason: 'Personal trip',
      status: 'Pending',
      approvedBy: null,
    },
    {
      id: 'LV-005',
      staffId: 'USR-011',
      branchId: mankessimBranch.id,
      leaveType: 'Emergency',
      fromDate: new Date('2026-08-20'),
      toDate: new Date('2026-08-22'),
      days: 3,
      reason: 'Family bereavement',
      status: 'Approved',
      approvedBy: 'USR-002',
    },
  ];

  for (const lr of demoLeaveRequests) {
    await prisma.leaveRequest.upsert({
      where: { id: lr.id },
      update: lr,
      create: lr,
    });
  }
  console.log(`✅ Seeded ${demoLeaveRequests.length} Demo HR Leave Requests (Accra Pending: 2)`);

  // 24. Seed Demo HR Off-Duty Requests (1 Pending in Accra: Emmanuel Tetteh)
  const demoOffDutyRequests = [
    {
      id: 'OD-001',
      staffId: 'USR-005',
      departmentId: 'dept-ward-a-007',
      branchId: accraBranch.id,
      requestDate: new Date('2026-08-30'),
      shiftType: 'Night',
      reason: "Family event — sister's wedding",
      status: 'Approved',
      approvedBy: 'USR-002',
      submittedAt: new Date('2026-08-20T10:00:00Z'),
    },
    {
      id: 'OD-002',
      staffId: 'USR-006',
      departmentId: 'dept-pharmacy-003',
      branchId: accraBranch.id,
      requestDate: new Date('2026-08-29'),
      shiftType: 'Afternoon',
      reason: 'Medical appointment',
      status: 'Pending',
      approvedBy: null,
      submittedAt: new Date('2026-08-22T08:30:00Z'),
    },
    {
      id: 'OD-003',
      staffId: 'USR-007',
      departmentId: 'dept-lab-004',
      branchId: accraBranch.id,
      requestDate: new Date('2026-08-28'),
      shiftType: 'Morning',
      reason: 'Personal errands',
      status: 'Rejected',
      approvedBy: 'USR-001',
      submittedAt: new Date('2026-08-21T14:00:00Z'),
    },
    {
      id: 'OD-004',
      staffId: 'USR-011',
      departmentId: 'dept-stores-009',
      branchId: mankessimBranch.id,
      requestDate: new Date('2026-09-01'),
      shiftType: 'Full Day',
      reason: "Child's school event",
      status: 'Pending',
      approvedBy: null,
      submittedAt: new Date('2026-08-22T07:45:00Z'),
    },
  ];

  for (const od of demoOffDutyRequests) {
    await prisma.offDutyRequest.upsert({
      where: { id: od.id },
      update: od,
      create: od,
    });
  }
  console.log(`✅ Seeded ${demoOffDutyRequests.length} Demo HR Off-Duty Requests (Accra Pending: 1)`);

  // ==========================================
  // 24. TELEMEDICINE SESSIONS (3 Scheduled · 1 Completed · 1 No-show)
  // ==========================================
  const demoTelemedSessions = [
    {
      id: 'TLM-001',
      patientId: 'PAT-001',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      scheduledAt: new Date('2026-08-25T10:00:00Z'),
      duration: 30,
      sessionType: 'Video',
      status: 'Scheduled',
      chiefComplaint: 'Blood pressure follow-up — requesting prescription renewal',
      notes: null,
      meetingLink: 'meet.eduhms.gh/tm-001',
    },
    {
      id: 'TLM-002',
      patientId: 'PAT-003',
      doctorId: 'USR-004',
      branchId: mankessimBranch.id,
      scheduledAt: new Date('2026-08-26T09:00:00Z'),
      duration: 20,
      sessionType: 'Video',
      status: 'Scheduled',
      chiefComplaint: 'Herbal treatment progress review — Week 2 check-in',
      notes: null,
      meetingLink: 'meet.eduhms.gh/tm-002',
    },
    {
      id: 'TLM-003',
      patientId: 'PAT-002',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      scheduledAt: new Date('2026-08-22T09:00:00Z'),
      duration: 25,
      sessionType: 'Video',
      status: 'Completed',
      chiefComplaint: 'Diabetes management — HbA1c review',
      notes: 'HbA1c improved to 7.1% from 7.8%. Continue current Metformin regimen. Dietary counselling reinforced. Next virtual review in 3 months.',
      meetingLink: 'meet.eduhms.gh/tm-003',
    },
    {
      id: 'TLM-004',
      patientId: 'PAT-005',
      doctorId: 'USR-003',
      branchId: accraBranch.id,
      scheduledAt: new Date('2026-08-23T11:00:00Z'),
      duration: 15,
      sessionType: 'Audio',
      status: 'Scheduled',
      chiefComplaint: 'Post-discharge check — wound assessment via photo',
      notes: null,
      meetingLink: 'meet.eduhms.gh/tm-004',
    },
    {
      id: 'TLM-005',
      patientId: 'PAT-006',
      doctorId: 'USR-004',
      branchId: mankessimBranch.id,
      scheduledAt: new Date('2026-08-21T14:00:00Z'),
      duration: 20,
      sessionType: 'Video',
      status: 'No-show',
      chiefComplaint: 'Back pain herbal protocol — monthly review',
      notes: null,
      meetingLink: 'meet.eduhms.gh/tm-005',
    },
  ];

  for (const session of demoTelemedSessions) {
    await prisma.telemedicineSession.upsert({
      where: { id: session.id },
      update: session,
      create: session,
    });
  }
  console.log(`✅ Seeded ${demoTelemedSessions.length} Demo Telemedicine Sessions (3 Scheduled · 1 Completed · 1 No-show)`);

  console.log('🎉 EduHMS Database Seeding Completed Successfully!');

}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

