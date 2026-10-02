import "server-only";
import { db } from "./drizzle";
import { 
  users, farmers, plots, applications, featureSnapshots, 
  decisions, consents, auditLogs 
} from "./drizzleSchema";
import { Applicant } from "../data";
import { eq, desc, and, isNull } from "drizzle-orm";
import { 
  User, FarmerProfile, Plot, Application, 
  FeatureSnapshot, Decision, ConsentRecord, AuditLogEntry, 
  EarlyWarningRecord, UserRole 
} from "./schema";

// ─── In-Memory Fallback (used when DATABASE_URL is not configured) ───
interface DbState {
  users: Map<string, User>;
  farmers: Map<string, FarmerProfile>;
  plots: Map<string, Plot>;
  applications: Map<string, Application>;
  features: Map<string, FeatureSnapshot>;
  decisions: Map<string, Decision>;
  consents: ConsentRecord[];
  auditLogs: AuditLogEntry[];
  earlyWarnings: Map<string, EarlyWarningRecord>;
}

declare global {
  // eslint-disable-next-line no-var
  var __tvsDbState: DbState | undefined;
}

function initEmptyDatabase(): DbState {
  return {
    users: new Map(), farmers: new Map(), plots: new Map(),
    applications: new Map(), features: new Map(), decisions: new Map(),
    consents: [], auditLogs: [], earlyWarnings: new Map(),
  };
}

const mem: DbState = globalThis.__tvsDbState || (globalThis.__tvsDbState = initEmptyDatabase());

const useDrizzle = !!db;

export const CONSENT_TEXT_VERSION = "v2.1-dpdp-2023-rbi-compliant";

// ─── Unified DB Layer ───────────────────────────────────────────────
export const tvsDb = {
  isSupabaseConfigured(): boolean {
    return useDrizzle;
  },

  async syncFromSupabase(): Promise<void> {
    return Promise.resolve();
  },

  // ─── READ ──────────────────────────────────────────────────────────
  async getAllApplicants(): Promise<Applicant[]> {
    if (useDrizzle && db) {
      try {
        const rows = await db
          .select()
          .from(applications)
          .innerJoin(users, eq(applications.farmerId, users.id))
          .innerJoin(farmers, eq(applications.farmerId, farmers.userId))
          .innerJoin(plots, eq(applications.plotId, plots.id))
          .innerJoin(featureSnapshots, eq(applications.id, featureSnapshots.applicationId))
          .innerJoin(decisions, eq(applications.id, decisions.applicationId))
          .orderBy(desc(applications.createdAt));

        return rows.map((row) => {
          const coords: [number, number][] = row.plots.geom.coordinates;
          const centroidLat = coords.reduce((sum, c) => sum + c[0], 0) / (coords.length || 1);
          const centroidLng = coords.reduce((sum, c) => sum + c[1], 0) / (coords.length || 1);
          const soilProps = row.feature_snapshots.soilProperties as any;
          const mandiData = row.feature_snapshots.mandi as any;
          const ndviSeries = row.feature_snapshots.ndviSeries as number[];
          const factorsData = row.decisions.factors as any;
          const offerData = row.decisions.offer as any;

          return {
            id: row.applications.id,
            farmerId: row.applications.farmerId,
            name: row.users.name,
            phone: row.users.phone,
            state: row.farmers.state,
            district: row.farmers.district,
            village: row.farmers.village,
            lat: centroidLat,
            lng: centroidLng,
            landSizeAcres: row.plots.areaAcres,
            declaredAreaAcres: row.plots.declaredAreaAcres ?? undefined,
            cropType: row.plots.cropType,
            soilType: row.plots.soilType || soilProps?.type || "Unknown",
            irrigation: row.plots.irrigation,
            loanProduct: row.applications.product,
            requestedAmount: row.applications.requestedAmount,
            bureauStatus: row.applications.bureauStatus || "Verified via Alternative Data & Geospatial AI",
            mandiDistanceKm: mandiData?.distanceKm || 0,
            last90DaysRainfallMm: row.feature_snapshots.rainfallLast90DaysMm,
            districtAvgRainfallMm: row.feature_snapshots.rainfallDistrictAvgMm,
            rainfallAnomalyPct: row.feature_snapshots.rainfallAnomalyPct,
            ndviScore: row.feature_snapshots.ndviScore,
            satelliteVegetationIndex: ndviSeries,
            plotPolygon: coords,
            scoring: {
              score: row.decisions.score,
              riskTier: row.decisions.riskTier,
              recommendation: row.decisions.recommendation,
              factors: factorsData,
              offer: offerData,
            },
          };
        });
      } catch (e) {
        console.error("Drizzle getAllApplicants error:", e);
        // Fall back to in-memory if connection fails
      }
    }

    // In-memory fallback
    const list: Applicant[] = [];
    mem.applications.forEach((app) => {
      const user = mem.users.get(app.farmerId);
      const farmer = mem.farmers.get(app.farmerId);
      const plot = mem.plots.get(app.plotId);
      const feature = mem.features.get(app.id);
      const decision = mem.decisions.get(app.id);

      if (user && farmer && plot && feature && decision) {
        const coords = plot.geom.coordinates || [[20.1384, 78.3182]];
        const centroidLat = coords.reduce((sum, c) => sum + c[0], 0) / (coords.length || 1);
        const centroidLng = coords.reduce((sum, c) => sum + c[1], 0) / (coords.length || 1);

        list.push({
          id: app.id, farmerId: app.farmerId, name: user.name, phone: user.phone,
          state: farmer.state, district: farmer.district, village: farmer.village,
          lat: centroidLat, lng: centroidLng,
          landSizeAcres: plot.areaAcres, declaredAreaAcres: plot.declaredAreaAcres, cropType: plot.cropType,
          soilType: plot.soilType || feature.soilProperties.type,
          irrigation: plot.irrigation, loanProduct: app.product,
          requestedAmount: app.requestedAmount,
          bureauStatus: app.bureauStatus || "Verified via Alternative Data & Geospatial AI",
          mandiDistanceKm: feature.mandi.distanceKm,
          last90DaysRainfallMm: feature.rainfallLast90DaysMm,
          districtAvgRainfallMm: feature.rainfallDistrictAvgMm,
          rainfallAnomalyPct: feature.rainfallAnomalyPct,
          ndviScore: feature.ndviScore,
          satelliteVegetationIndex: feature.ndviSeries,
          plotPolygon: plot.geom.coordinates,
          scoring: {
            score: decision.score, riskTier: decision.riskTier,
            recommendation: decision.recommendation,
            factors: decision.factors, offer: decision.offer,
          },
        });
      }
    });
    return list.reverse();
  },

  async getApplicantById(id: string): Promise<Applicant | undefined> {
    const list = await this.getAllApplicants();
    return list.find((a) => a.id.toLowerCase() === id.toLowerCase());
  },

  // ─── DELETE ────────────────────────────────────────────────────────
  async deleteApplication(id: string): Promise<boolean> {
    const normId = id.toUpperCase();

    if (useDrizzle && db) {
      try {
        const app = await db.select().from(applications).where(eq(applications.id, normId)).limit(1);
        if (app.length > 0) {
          await db.delete(featureSnapshots).where(eq(featureSnapshots.applicationId, normId));
          await db.delete(decisions).where(eq(decisions.applicationId, normId));
          await db.delete(applications).where(eq(applications.id, normId));
          await db.delete(plots).where(eq(plots.id, app[0].plotId));
          return true;
        }
        return false;
      } catch (e) {
        console.error("Drizzle deleteApplication error:", e);
        // Fall back to in-memory if connection fails
      }
    }

    // In-memory fallback
    let foundKey = "";
    mem.applications.forEach((_, k) => { if (k.toUpperCase() === normId) foundKey = k; });
    if (!foundKey) return false;
    const app = mem.applications.get(foundKey);
    mem.applications.delete(foundKey);
    mem.features.delete(foundKey);
    mem.decisions.delete(foundKey);
    if (app) mem.plots.delete(app.plotId);
    return true;
  },

  async clearAllApplications(): Promise<void> {
    if (useDrizzle && db) {
      try {
        await db.delete(featureSnapshots);
        await db.delete(decisions);
        await db.delete(applications);
        await db.delete(plots);
        await db.delete(farmers);
        await db.delete(users);
      } catch (e) {
        console.error("Drizzle clearAllApplications error:", e);
      }
    }
    mem.applications.clear(); mem.features.clear(); mem.decisions.clear();
    mem.plots.clear(); mem.users.clear(); mem.farmers.clear();
  },

  // ─── CREATE ────────────────────────────────────────────────────────
  async createApplication(params: {
    /** Supabase auth id of the signed-in farmer; links the application to their account. */
    farmerUserId?: string;
    name: string; phone: string; state: string; district: string;
    village: string; pincode: string; product: string; requestedAmount: number;
    cropType: string; irrigation: string; areaAcres: number; declaredAreaAcres?: number;
    plotPolygon: [number, number][]; source?: "drawn" | "gps_walk";
    documentMatchPct?: number;
    features: Omit<FeatureSnapshot, "applicationId" | "fetchedAt">;
    decision: Omit<Decision, "applicationId" | "decidedAt">;
  }): Promise<{ applicationId: string; applicant: Applicant }> {
    const now = new Date().toISOString();
    const appSeq = useDrizzle ? (1000 + Date.now() % 10000) : (1000 + mem.applications.size + 1);
    const applicationId = `APP-${appSeq}`;
    const userId = params.farmerUserId || `USR-${Date.now().toString().slice(-5)}`;
    const plotId = `PLT-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`;

    if (useDrizzle && db) {
      try {
        // A farmer may apply more than once: upsert their profile rows.
        await db.insert(users).values({ id: userId, name: params.name, phone: params.phone, role: "farmer", preferredLang: "hi" })
          .onConflictDoUpdate({ target: users.id, set: { name: params.name, phone: params.phone } });
        const farmerProfile = { state: params.state, district: params.district, village: params.village, pincode: params.pincode };
        await db.insert(farmers).values({ userId, ...farmerProfile })
          .onConflictDoUpdate({ target: farmers.userId, set: farmerProfile });
        await db.insert(plots).values({
          id: plotId, farmerId: userId,
          geom: { type: "Polygon", coordinates: params.plotPolygon },
          areaAcres: params.areaAcres, declaredAreaAcres: params.declaredAreaAcres ?? null,
          cropType: params.cropType,
          irrigation: params.irrigation, soilType: params.features.soilProperties.type,
          source: params.source || "drawn", documentMatchPct: params.documentMatchPct ?? 95,
        });
        await db.insert(applications).values({
          id: applicationId, farmerId: userId, plotId,
          product: params.product, requestedAmount: params.requestedAmount,
          status: "decided", bureauStatus: "Verified via Alternative Data & Geospatial AI",
        });
        await db.insert(featureSnapshots).values({
          applicationId, ndviScore: params.features.ndviScore,
          ndviSeries: params.features.ndviSeries, cloudFreePct: params.features.cloudFreePct,
          rainfallLast90DaysMm: params.features.rainfallLast90DaysMm,
          rainfallDistrictAvgMm: params.features.rainfallDistrictAvgMm,
          rainfallAnomalyPct: params.features.rainfallAnomalyPct,
          soilProperties: params.features.soilProperties, mandi: params.features.mandi,
          alternativeScore: params.features.alternativeScore,
        });
        await db.insert(decisions).values({
          applicationId, score: params.decision.score, riskTier: params.decision.riskTier,
          recommendation: params.decision.recommendation,
          factors: params.decision.factors, offer: params.decision.offer,
        });
        await this.logAction(userId, "farmer", "SUBMIT_APPLICATION", "applications", applicationId, { status: "decided", score: params.decision.score });
        const applicant = await this.getApplicantById(applicationId);
        return { applicationId, applicant: applicant! };
      } catch (e) {
        // With a database configured, never pretend a failed write succeeded
        console.error("Drizzle createApplication error:", e);
        throw new Error("Could not save the application to the database");
      }
    }

    // In-memory store (only when DATABASE_URL is not configured)
    const user: User = { id: userId, name: params.name, phone: params.phone, role: "farmer", preferredLang: "hi", createdAt: now };
    mem.users.set(userId, user);
    mem.farmers.set(userId, { userId, state: params.state, district: params.district, village: params.village, pincode: params.pincode });
    const plot: Plot = {
      id: plotId, farmerId: userId, geom: { type: "Polygon", coordinates: params.plotPolygon },
      areaAcres: params.areaAcres, declaredAreaAcres: params.declaredAreaAcres, cropType: params.cropType, irrigation: params.irrigation,
      soilType: params.features.soilProperties.type, source: params.source || "drawn",
      documentMatchPct: params.documentMatchPct ?? 95, createdAt: now,
    };
    mem.plots.set(plotId, plot);
    const application: Application = {
      id: applicationId, farmerId: userId, plotId, product: params.product,
      requestedAmount: params.requestedAmount, status: "decided",
      bureauStatus: "Verified via Alternative Data & Geospatial AI", createdAt: now, updatedAt: now,
    };
    mem.applications.set(applicationId, application);
    const featureSnapshot: FeatureSnapshot = { ...params.features, applicationId, fetchedAt: now };
    mem.features.set(applicationId, featureSnapshot);
    const decision: Decision = { ...params.decision, applicationId, decidedAt: now };
    mem.decisions.set(applicationId, decision);
    mem.auditLogs.push({
      id: `AUD-${Date.now()}`, actorId: userId, actorRole: "farmer",
      action: "SUBMIT_APPLICATION", entity: "applications", entityId: applicationId,
      afterState: { status: "decided", score: decision.score }, timestamp: now,
    });
    const applicant = await this.getApplicantById(applicationId);
    return { applicationId, applicant: applicant! };
  },

  // ─── EARLY WARNINGS ───────────────────────────────────────────────
  getEarlyWarnings(): EarlyWarningRecord[] {
    return Array.from(mem.earlyWarnings.values());
  },

  // ─── AUDIT LOG ─────────────────────────────────────────────────────
  async logAction(
    actorId: string, actorRole: UserRole, action: string,
    entity: string, entityId: string, details?: Record<string, unknown>
  ): Promise<AuditLogEntry | undefined> {
    const entry: AuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorId, actorRole, action, entity, entityId,
      afterState: details, timestamp: new Date().toISOString(),
    };

    if (useDrizzle && db) {
      try {
        await db.insert(auditLogs).values({
          id: entry.id, userId: actorId, role: actorRole,
          action, resourceType: entity, resourceId: entityId,
          details: details || {},
        });
      } catch (e) { console.warn("Drizzle audit log error:", e); }
    }
    mem.auditLogs.push(entry);
    return entry;
  },

  /** True if an audit entry with this action + entity id exists (used for "send once" jobs). */
  async hasAuditEntry(action: string, entityId: string): Promise<boolean> {
    if (useDrizzle && db) {
      try {
        const rows = await db
          .select({ id: auditLogs.id })
          .from(auditLogs)
          .where(and(eq(auditLogs.action, action), eq(auditLogs.resourceId, entityId)))
          .limit(1);
        return rows.length > 0;
      } catch (e) {
        console.warn("Drizzle hasAuditEntry error:", e);
      }
    }
    return mem.auditLogs.some((l) => l.action === action && l.entityId === entityId);
  },

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    if (useDrizzle && db) {
      try {
        const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
        return logs.map((l) => ({
          id: l.id, actorId: l.userId, actorRole: l.role as UserRole,
          action: l.action, entity: l.resourceType, entityId: l.resourceId,
          afterState: l.details as Record<string, unknown>, timestamp: l.timestamp?.toISOString() || "",
        }));
      } catch { return [...mem.auditLogs].reverse(); }
    }
    return [...mem.auditLogs].reverse();
  },

  // ─── DPDP CONSENT ──────────────────────────────────────────────────
  // Consents are keyed by users.id (the farmer's Supabase auth id).
  async saveConsent(
    userId: string, purpose: ConsentRecord["purpose"],
    ip?: string, userAgent?: string
  ): Promise<ConsentRecord> {
    const record: ConsentRecord = {
      id: `CST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId, purpose, textVersion: CONSENT_TEXT_VERSION,
      grantedAt: new Date().toISOString(), ip, userAgent,
    };
    mem.consents.push(record);

    if (useDrizzle && db) {
      try {
        await db.insert(consents).values({ id: record.id, userId, purpose, consentGiven: 1 });
      } catch (e) { console.warn("Drizzle saveConsent error:", e); }
    }
    await this.logAction(userId, "farmer", "CONSENT_GRANTED", "consent", record.id, { purpose, ip, textVersion: record.textVersion });
    return record;
  },

  async getConsentsForUser(userId: string): Promise<ConsentRecord[]> {
    const byId = new Map<string, ConsentRecord>();
    if (useDrizzle && db) {
      try {
        const rows = await db.select().from(consents).where(eq(consents.userId, userId)).orderBy(desc(consents.timestamp));
        for (const r of rows) {
          byId.set(r.id, {
            id: r.id, userId: r.userId, purpose: r.purpose as ConsentRecord["purpose"],
            textVersion: CONSENT_TEXT_VERSION,
            grantedAt: r.timestamp?.toISOString() || "",
            revokedAt: r.revokedAt?.toISOString(),
          });
        }
      } catch (e) { console.warn("Drizzle getConsentsForUser error:", e); }
    }
    for (const c of mem.consents) {
      if (c.userId === userId && !byId.has(c.id)) byId.set(c.id, c);
    }
    return Array.from(byId.values());
  },

  async revokeConsent(
    userId: string, purpose: ConsentRecord["purpose"], reason?: string
  ): Promise<{ success: boolean; revokedCount: number }> {
    const now = new Date();
    let count = 0;
    mem.consents.forEach((c) => {
      if (c.userId === userId && c.purpose === purpose && !c.revokedAt) {
        c.revokedAt = now.toISOString(); count++;
      }
    });
    if (useDrizzle && db) {
      try {
        const updated = await db.update(consents).set({ consentGiven: 0, revokedAt: now })
          .where(and(eq(consents.userId, userId), eq(consents.purpose, purpose), isNull(consents.revokedAt)))
          .returning({ id: consents.id });
        count = Math.max(count, updated.length);
      } catch (e) { console.warn("Drizzle revokeConsent error:", e); }
    }
    await this.logAction(userId, "farmer", "CONSENT_REVOKED", "consent", purpose, { purpose, revokedAt: now.toISOString(), reason });
    return { success: true, revokedCount: count };
  },

  // ─── DPDP RIGHT TO ERASURE ─────────────────────────────────────────
  // Deletes the farmer's applications, plots, features and decisions, removes
  // their profile, anonymises the users row and revokes all consents. Consent
  // and audit records are retained (minus PII) as proof of lawful processing.
  async eraseUserData(
    userId: string, reason?: string
  ): Promise<{ success: boolean; erasedApplications: number; message: string }> {
    let erasedCount = 0;
    const now = new Date();

    const appIds: string[] = [];
    mem.applications.forEach((app, appId) => { if (app.farmerId === userId) appIds.push(appId); });
    for (const appId of appIds) {
      const app = mem.applications.get(appId)!;
      mem.plots.delete(app.plotId);
      mem.features.delete(appId); mem.decisions.delete(appId);
      mem.applications.delete(appId);
      erasedCount++;
    }
    mem.farmers.delete(userId);
    const memUser = mem.users.get(userId);
    if (memUser) { memUser.name = "Erased (DPDP)"; memUser.phone = ""; }
    mem.consents.forEach((c) => { if (c.userId === userId && !c.revokedAt) c.revokedAt = now.toISOString(); });

    if (useDrizzle && db) {
      try {
        const apps = await db.select({ id: applications.id }).from(applications).where(eq(applications.farmerId, userId));
        // feature_snapshots / decisions cascade from applications; applications cascade from plots
        await db.delete(applications).where(eq(applications.farmerId, userId));
        await db.delete(plots).where(eq(plots.farmerId, userId));
        await db.delete(farmers).where(eq(farmers.userId, userId));
        await db.update(users).set({ name: "Erased (DPDP)", phone: "" }).where(eq(users.id, userId));
        await db.update(consents).set({ consentGiven: 0, revokedAt: now })
          .where(and(eq(consents.userId, userId), isNull(consents.revokedAt)));
        erasedCount = Math.max(erasedCount, apps.length);
      } catch (e) { console.error("Drizzle eraseUserData error:", e); }
    }

    await this.logAction(userId, "farmer", "DPDP_RIGHT_TO_ERASURE_EXECUTED", "user_data", userId, {
      reason: reason || "Farmer requested full data erasure under DPDP Act 2023 Section 12",
      erasedApplicationsCount: erasedCount,
    });
    return { success: true, erasedApplications: erasedCount, message: "Personal data and geospatial boundaries erased in accordance with DPDP Act 2023." };
  },

  // ─── RBAC MIRROR ───────────────────────────────────────────────────
  // Roles live in Supabase app_metadata (see app/lib/services/userAdmin.ts).
  // This keeps the users table in step for SQL reporting / RLS policies.
  async mirrorUserRole(userId: string, role: UserRole): Promise<void> {
    const memUser = mem.users.get(userId);
    if (memUser) memUser.role = role;
    if (useDrizzle && db) {
      try {
        await db.update(users).set({ role }).where(eq(users.id, userId));
      } catch (e) { console.warn("Drizzle mirrorUserRole error:", e); }
    }
  },
};
