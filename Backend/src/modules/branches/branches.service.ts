import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBranchDto) {
    const existing = await this.prisma.branch.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Branch code '${dto.code}' is already registered`);
    }

    return this.prisma.branch.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.branch.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            departments: true,
            users: true,
            patients: true,
            wards: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        departments: true,
        wards: {
          include: {
            wardBeds: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    return branch;
  }

  async update(id: string, dto: UpdateBranchDto) {
    await this.findOne(id);
    return this.prisma.branch.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
