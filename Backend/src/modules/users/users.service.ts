import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UploadCvDto } from './dto/upload-cv.dto';
import { SendAppointmentLetterDto } from './dto/send-appointment-letter.dto';
import * as argon2 from 'argon2';

const ROLE_LABELS: Record<string, string> = {
  cto: 'Chief Technology Officer',
  admin: 'Administrator',
  doctor: 'Doctor / Consultant',
  nurse: 'Nurse',
  pharmacist: 'Pharmacist',
  lab_tech: 'Lab Technician',
  receptionist: 'Receptionist',
  accountant: 'Accountant',
  call_centre: 'Call Centre Agent',
  store_officer: 'Store Officer',
  hr: 'Human Resources',
};


const DEFAULT_MODULES_BY_ROLE: Record<string, string[]> = {
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
  hr: ['dashboard', 'hr', 'accounting', 'meetings', 'chat', 'daily_reports'],
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const fullName = dto.fullName || dto.name || 'Staff Member';
    const email = dto.email.toLowerCase().trim();

    // Generate unique ID and Staff Number
    let staffNumber = dto.staffNumber;
    let id = dto.id;

    if (!staffNumber || !id) {
      const userCount = await this.prisma.user.count();
      const generatedCode = `USR-${String(userCount + 1).padStart(3, '0')}`;
      if (!staffNumber) staffNumber = generatedCode;
      if (!id) id = generatedCode;
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { staffNumber }, { id }],
      },
    });

    if (existing) {
      throw new ConflictException(`Staff user with email '${email}' or ID '${staffNumber}' already exists`);
    }

    // Hash password
    const rawPassword = dto.password || 'EduHMS@2026';
    const passwordHash = await argon2.hash(rawPassword, {
      type: argon2.argon2id,
    });

    // Resolve Branch
    let primaryBranchId = dto.primaryBranchId;
    if (!primaryBranchId && dto.branch && dto.branch !== 'All') {
      const b = await this.prisma.branch.findFirst({
        where: {
          OR: [
            { id: dto.branch },
            { code: dto.branch },
            { name: { contains: dto.branch, mode: 'insensitive' } },
          ],
        },
      });
      if (b) primaryBranchId = b.id;
    }

    // Resolve Department
    let departmentId = dto.departmentId;
    if (!departmentId && dto.department) {
      const d = await this.prisma.department.findFirst({
        where: {
          OR: [
            { id: dto.department },
            { code: dto.department },
            { name: { contains: dto.department, mode: 'insensitive' } },
          ],
        },
      });
      if (d) departmentId = d.id;
    }

    const user = await this.prisma.user.create({
      data: {
        id,
        staffNumber,
        email,
        passwordHash,
        fullName,
        role: dto.role,
        primaryBranchId: primaryBranchId || null,
        departmentId: departmentId || null,
        phone: dto.phone || null,
        isActive: true,
      },
      include: {
        primaryBranch: true,
        department: true,
      },
    });

    // Automatically initialize default module permissions for this staff member's role
    const defaultModules = DEFAULT_MODULES_BY_ROLE[dto.role] || ['dashboard'];
    await Promise.all(
      defaultModules.map((modKey) =>
        this.prisma.userModulePermission.upsert({
          where: {
            userId_moduleKey: {
              userId: user.id,
              moduleKey: modKey,
            },
          },
          update: { canView: true, canCreate: true, canEdit: true },
          create: {
            userId: user.id,
            moduleKey: modKey,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: dto.role === 'cto' || dto.role === 'admin',
          },
        }),
      ),
    );

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        moduleName: 'USER_MANAGEMENT',
        actionType: 'CREATE_STAFF',
        ipAddress: '127.0.0.1',
        diffState: {
          targetEntity: 'User',
          targetId: user.id,
          action: `Created staff account for ${user.fullName} (${user.role})`,
          staffId: user.id,
          branch: user.primaryBranch?.name || 'All',
        },
      },
    });

    return this.findOne(user.id);
  }

  async findAll(query?: QueryUsersDto | string, branchParam?: string) {
    let role: string | undefined;
    let branch: string | undefined;
    let branchId: string | undefined;
    let search: string | undefined;

    if (typeof query === 'string') {
      role = query;
      branchId = branchParam;
    } else if (query) {
      role = query.role;
      branch = query.branch;
      branchId = query.branchId;
      search = query.search;
    }

    const where: any = {};
    if (role && role !== 'All') where.role = role;

    if (branchId) {
      where.primaryBranchId = branchId;
    } else if (branch && branch !== 'All') {
      where.OR = [
        { primaryBranch: { name: { contains: branch, mode: 'insensitive' } } },
        { primaryBranchId: null }, // 'All' branches staff
      ];
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { staffNumber: { contains: q, mode: 'insensitive' } },
            { id: { contains: q, mode: 'insensitive' } },
            { department: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const [totalUsers, activeUsersCount, users] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.findMany({
        where,
        orderBy: { id: 'asc' },
        include: {
          primaryBranch: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
          modulePermissions: { select: { moduleKey: true, canView: true, canCreate: true, canEdit: true, canDelete: true } },
        },
      }),
    ]);

    // Fetch document metadata logs (CV and Appointment letters)
    const docLogs = await this.prisma.auditLog.findMany({
      where: {
        moduleName: 'USER_MANAGEMENT',
        actionType: { in: ['CV_UPLOADED', 'APPOINTMENT_LETTER_SENT'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const docMap: Record<string, { cvFileName?: string; appointmentLetterSent?: boolean; appointmentLetterDate?: string }> = {};
    for (const log of docLogs) {
      const diff: any = log.diffState || {};
      const targetId = diff.targetId || diff.staffId;
      if (!targetId) continue;
      if (!docMap[targetId]) docMap[targetId] = {};
      if (log.actionType === 'CV_UPLOADED' && !docMap[targetId].cvFileName) {
        docMap[targetId].cvFileName = diff.fileName || 'CV.pdf';
      }
      if (log.actionType === 'APPOINTMENT_LETTER_SENT' && !docMap[targetId].appointmentLetterSent) {
        docMap[targetId].appointmentLetterSent = true;
        docMap[targetId].appointmentLetterDate = log.createdAt.toISOString().slice(0, 10);
      }
    }

    // Format output matching UserManagement.tsx expectations
    const items = users.map((u) => {
      const docs = docMap[u.id] || {};
      const allowedModules = u.modulePermissions.filter((p) => p.canView).map((p) => p.moduleKey);

      return {
        id: u.id,
        staffNumber: u.staffNumber,
        name: u.fullName,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        roleLabel: ROLE_LABELS[u.role] || u.role,
        branch: u.primaryBranch
          ? u.primaryBranch.name.includes('Accra')
            ? 'Accra'
            : u.primaryBranch.name.includes('Mankessim')
              ? 'Mankessim'
              : u.primaryBranch.name
          : 'All',
        branchId: u.primaryBranchId,
        department: u.department?.name || ROLE_LABELS[u.role] || 'General',
        departmentId: u.departmentId,
        phone: u.phone || '+233 24 000 0000',
        active: u.isActive,
        isActive: u.isActive,
        lastLogin: u.lastLoginAt ? u.lastLoginAt.toISOString().slice(0, 16).replace('T', ' ') : 'Never',
        lastLoginAt: u.lastLoginAt,
        allowedModules: allowedModules.length > 0 ? allowedModules : DEFAULT_MODULES_BY_ROLE[u.role] || ['dashboard'],
        cvFileName: docs.cvFileName || null,
        appointmentLetterSent: docs.appointmentLetterSent || false,
        appointmentLetterDate: docs.appointmentLetterDate || null,
        createdAt: u.createdAt.toISOString().slice(0, 10),
      };
    });

    return {
      items,
      meta: {
        total: totalUsers,
        active: activeUsersCount,
        inactive: totalUsers - activeUsersCount,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id }, { staffNumber: id }, { email: id }],
      },
      include: {
        primaryBranch: true,
        department: true,
        modulePermissions: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User '${id}' not found`);
    }

    const { passwordHash, ...sanitized } = user;
    const allowedModules = user.modulePermissions.filter((p) => p.canView).map((p) => p.moduleKey);

    return {
      ...sanitized,
      name: user.fullName,
      branch: user.primaryBranch ? user.primaryBranch.name : 'All',
      departmentName: user.department?.name || ROLE_LABELS[user.role] || 'General',
      roleLabel: ROLE_LABELS[user.role] || user.role,
      active: user.isActive,
      allowedModules: allowedModules.length > 0 ? allowedModules : DEFAULT_MODULES_BY_ROLE[user.role] || ['dashboard'],
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id }, { staffNumber: id }] },
    });

    if (!user) {
      throw new NotFoundException(`User '${id}' not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: dto.fullName || undefined,
        email: dto.email ? dto.email.toLowerCase().trim() : undefined,
        role: dto.role || undefined,
        phone: dto.phone || undefined,
        primaryBranchId: dto.primaryBranchId || undefined,
        departmentId: dto.departmentId || undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
      include: {
        primaryBranch: true,
        department: true,
        modulePermissions: true,
      },
    });

    return this.findOne(updated.id);
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id }, { staffNumber: id }] },
    });

    if (!user) {
      throw new NotFoundException(`User '${id}' not found`);
    }

    const newStatus = !user.isActive;
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { isActive: newStatus },
    });

    await this.prisma.auditLog.create({
      data: {
        moduleName: 'USER_MANAGEMENT',
        actionType: newStatus ? 'ACTIVATE_STAFF' : 'DEACTIVATE_STAFF',
        ipAddress: '127.0.0.1',
        diffState: {
          targetEntity: 'User',
          targetId: user.id,
          action: `${newStatus ? 'Activated' : 'Deactivated'} staff account for ${user.fullName}`,
          isActive: newStatus,
        },
      },
    });

    return {
      success: true,
      id: user.id,
      active: updated.isActive,
      message: `Staff account for ${user.fullName} is now ${newStatus ? 'Active' : 'Inactive'}.`,
    };
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id }, { staffNumber: id }] },
    });

    if (!user) {
      throw new NotFoundException(`User '${id}' not found`);
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await this.prisma.auditLog.create({
      data: {
        moduleName: 'USER_MANAGEMENT',
        actionType: 'RESET_PASSWORD',
        ipAddress: '127.0.0.1',
        diffState: {
          targetEntity: 'User',
          targetId: user.id,
          action: `Password reset successfully for ${user.fullName} (${user.id})`,
        },
      },
    });

    return {
      success: true,
      message: `Password for ${user.fullName} (${user.id}) has been updated successfully.`,
    };
  }

  async uploadCv(id: string, dto: UploadCvDto) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id }, { staffNumber: id }] },
    });

    if (!user) {
      throw new NotFoundException(`User '${id}' not found`);
    }

    await this.prisma.auditLog.create({
      data: {
        moduleName: 'USER_MANAGEMENT',
        actionType: 'CV_UPLOADED',
        ipAddress: '127.0.0.1',
        diffState: {
          targetEntity: 'User',
          targetId: user.id,
          fileName: dto.fileName,
          filePathUrl: dto.filePathUrl || null,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      fileName: dto.fileName,
      message: `CV file '${dto.fileName}' attached to ${user.fullName}'s profile.`,
    };
  }

  async sendAppointmentLetter(id: string, dto: SendAppointmentLetterDto) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id }, { staffNumber: id }] },
      include: {
        primaryBranch: true,
        department: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User '${id}' not found`);
    }

    const effectiveDate = dto.effectiveDate || new Date().toISOString().slice(0, 10);
    const branchName = user.primaryBranch ? user.primaryBranch.name : 'All Branches';
    const roleTitle = ROLE_LABELS[user.role] || user.role;
    const deptName = user.department?.name || roleTitle;

    const letterContent = `EDHEC Health Management System
Accra & Mankessim Branches
Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}

APPOINTMENT LETTER

Dear ${user.fullName},

We are pleased to inform you that you have been appointed to the position of ${roleTitle} at EDHEC HMS, ${branchName}, effective from ${effectiveDate}.

Your employment details are as follows:
  • Staff ID:     ${user.id}
  • Department:   ${deptName}
  • Email:        ${user.email}
  • Phone:        ${user.phone || 'N/A'}
  • Branch:       ${branchName}

Please report to the Administration Office on your first day with the following documents:
  1. Two passport photographs
  2. Academic certificates (originals and photocopies)
  3. Valid National ID / Ghana Card
  4. Tax Identification Number (TIN)
  5. Bank account details for payroll

Terms and conditions of employment will be provided separately in your employment contract.

We look forward to a productive working relationship.

Yours faithfully,

_______________________________
${dto.signatoryTitle || 'CTO / Chief Administrative Officer'}
EDHEC Health Management System`;

    await this.prisma.auditLog.create({
      data: {
        moduleName: 'USER_MANAGEMENT',
        actionType: 'APPOINTMENT_LETTER_SENT',
        ipAddress: '127.0.0.1',
        diffState: {
          targetEntity: 'User',
          targetId: user.id,
          letterContent,
          sentDate: effectiveDate,
        },
      },
    });

    return {
      success: true,
      appointmentLetterSent: true,
      appointmentLetterDate: effectiveDate,
      letterContent,
      message: `Appointment letter successfully generated and dispatched to ${user.fullName}.`,
    };
  }

  async setPermissions(targetUserId: string, dto: SetPermissionsDto, grantedById: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id: targetUserId }, { staffNumber: targetUserId }] },
    });

    if (!user) {
      throw new NotFoundException(`User '${targetUserId}' not found`);
    }

    if (dto.allowedModules && Array.isArray(dto.allowedModules)) {
      // 1. Delete old permissions
      await this.prisma.userModulePermission.deleteMany({
        where: { userId: user.id },
      });

      // 2. Insert new allowed modules
      await Promise.all(
        dto.allowedModules.map((moduleKey) =>
          this.prisma.userModulePermission.create({
            data: {
              userId: user.id,
              moduleKey,
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: user.role === 'cto' || user.role === 'admin',
              grantedBy: grantedById,
            },
          }),
        ),
      );
    } else if (dto.permissions && Array.isArray(dto.permissions)) {
      await Promise.all(
        dto.permissions.map((perm) =>
          this.prisma.userModulePermission.upsert({
            where: {
              userId_moduleKey: {
                userId: user.id,
                moduleKey: perm.moduleKey,
              },
            },
            update: {
              canView: perm.canView,
              canCreate: perm.canCreate,
              canEdit: perm.canEdit,
              canDelete: perm.canDelete,
              grantedBy: grantedById,
            },
            create: {
              userId: user.id,
              moduleKey: perm.moduleKey,
              canView: perm.canView,
              canCreate: perm.canCreate,
              canEdit: perm.canEdit,
              canDelete: perm.canDelete,
              grantedBy: grantedById,
            },
          }),
        ),
      );
    }

    const updatedPermissions = await this.prisma.userModulePermission.findMany({
      where: { userId: user.id },
    });

    return {
      success: true,
      userId: user.id,
      allowedModules: updatedPermissions.filter((p) => p.canView).map((p) => p.moduleKey),
      permissions: updatedPermissions,
      message: `Access rules saved for ${user.fullName}`,
    };
  }

  async resetPermissionsToDefault(targetUserId: string, grantedById: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id: targetUserId }, { staffNumber: targetUserId }] },
    });

    if (!user) {
      throw new NotFoundException(`User '${targetUserId}' not found`);
    }

    const defaultModules = DEFAULT_MODULES_BY_ROLE[user.role] || ['dashboard'];

    await this.prisma.userModulePermission.deleteMany({
      where: { userId: user.id },
    });

    await Promise.all(
      defaultModules.map((moduleKey) =>
        this.prisma.userModulePermission.create({
          data: {
            userId: user.id,
            moduleKey,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: user.role === 'cto' || user.role === 'admin',
            grantedBy: grantedById,
          },
        }),
      ),
    );

    return {
      success: true,
      userId: user.id,
      allowedModules: defaultModules,
      message: `Permissions for ${user.fullName} reset to default for role '${user.role}'`,
    };
  }
}

