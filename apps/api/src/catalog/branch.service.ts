/**
 * BranchService — queries active branch data for public and internal use.
 *
 * All reads go to PostgreSQL (source of truth). Redis cache is intentionally
 * NOT used for financial data — branch pricing lives in BranchProduct records,
 * not CMS display prices.
 *
 * Note: branch addresses, coordinates and hours are populated by Operations.
 * They must NOT be invented or seeded with placeholder data in production.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface BranchSummary {
  id: string;
  code: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  address: unknown;
  coordinates: unknown;
  timezone: string;
  status: string;
}

export interface BranchHoursEntry {
  weekday: number;
  opensAt: string;
  closesAt: string;
  overnight: boolean;
}

@Injectable()
export class BranchService {
  constructor(private readonly db: DatabaseService) {}

  /** Return all active branches (public catalog). */
  async listActive(): Promise<BranchSummary[]> {
    return this.db.client.branch.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        code: true,
        slug: true,
        nameEn: true,
        nameAr: true,
        address: true,
        coordinates: true,
        timezone: true,
        status: true,
      },
      orderBy: [{ nameEn: 'asc' }],
    });
  }

  /** Return a single branch by ID or throw 404. */
  async findById(id: string): Promise<BranchSummary> {
    const branch = await this.db.client.branch.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        slug: true,
        nameEn: true,
        nameAr: true,
        address: true,
        coordinates: true,
        timezone: true,
        status: true,
      },
    });
    if (!branch || branch.status !== 'ACTIVE') {
      throw new NotFoundException(`Branch ${id} not found`);
    }
    return branch;
  }

  /** Return opening hours for a branch. */
  async getHours(branchId: string): Promise<BranchHoursEntry[]> {
    await this.findById(branchId); // 404 if not active
    return this.db.client.branchHours.findMany({
      where: { branchId },
      select: { weekday: true, opensAt: true, closesAt: true, overnight: true },
      orderBy: { weekday: 'asc' },
    });
  }

  /** Return services offered at a branch. */
  async getServices(branchId: string): Promise<string[]> {
    await this.findById(branchId);
    const services = await this.db.client.branchService.findMany({
      where: { branchId },
      select: { serviceCode: true },
    });
    return services.map((s: { serviceCode: string }) => s.serviceCode);
  }

  /** Check whether a branch is currently open (UTC now vs branch hours). */
  async isCurrentlyOpen(branchId: string): Promise<boolean> {
    const now = new Date();
    // Asia/Dubai is UTC+4; get the local weekday + HH:MM
    const dubaiFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dubai',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = dubaiFormatter.formatToParts(now);
    const weekdayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    const weekday = weekdayMap[parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'] ?? 0;
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
    const currentHHMM = `${hour}:${minute}`;

    // Check for a date override (closure or replacement hours)
    const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(now);
    const closure = await this.db.client.branchClosure.findUnique({
      where: { branchId_localDate: { branchId, localDate } },
    });
    if (closure) {
      if (closure.closed) return false;
      // Replacement intervals
      const intervals = (closure.overrideIntervals ?? []) as Array<{
        opensAt: string;
        closesAt: string;
      }>;
      return intervals.some((i) => currentHHMM >= i.opensAt && currentHHMM < i.closesAt);
    }

    // Regular weekly schedule
    const hours = await this.db.client.branchHours.findMany({
      where: { branchId, weekday },
    });
    return hours.some((h: { opensAt: string; closesAt: string }) => currentHHMM >= h.opensAt && currentHHMM < h.closesAt);
  }
}
